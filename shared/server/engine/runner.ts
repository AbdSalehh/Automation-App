import { prisma } from "@/shared/lib/prisma";
import { publishExecutionUpdate } from "@/shared/server/ablyPublisher";
import type {
  FlowNode,
  FlowEdge,
} from "@/entities/workflow/model/workflow.model";
import type { Item, RunContext, ExecOutcome, TriggerScope } from "./types";
import { writeLog } from "./logging";
import { isSamePhoneKey } from "./utils";
import { runNode } from "./registry";

/** Jenis node trigger yang dipicu balasan masuk (WhatsApp/Telegram). */
const REPLY_TRIGGER_KINDS = new Set(["whatsapp_trigger", "telegram_trigger"]);

/**
 * Mengurutkan node mulai dari `entryIds` dengan menelusuri edge (BFS), dan
 * HANYA mengembalikan node yang terjangkau dari entri tersebut. Node di chain
 * lain (mis. chain penangkap balasan yang terpisah) tidak ikut dijalankan,
 * sehingga tiap trigger hanya menjalankan subgraph-nya sendiri.
 */
function orderNodes(
  nodes: FlowNode[],
  edges: FlowEdge[],
  entryIds: string[],
): FlowNode[] {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));

  const orderedNodes: FlowNode[] = [];
  const visitedIds = new Set<string>();

  const pendingQueue = [...entryIds];

  while (pendingQueue.length > 0) {
    const currentId = pendingQueue.shift()!;

    if (visitedIds.has(currentId)) {
      continue;
    }

    visitedIds.add(currentId);

    const currentNode = nodesById.get(currentId);

    if (currentNode) {
      orderedNodes.push(currentNode);
    }

    edges
      .filter((edge) => edge.source === currentId)
      .forEach((edge) => {
        if (!visitedIds.has(edge.target)) {
          pendingQueue.push(edge.target);
        }
      });
  }

  return orderedNodes;
}

/**
 * Menentukan node entri untuk sebuah eksekusi sesuai scope trigger.
 *
 * - `"reply"`: hanya node trigger balasan (`whatsapp_trigger`/`telegram_trigger`).
 * - `"main"`: trigger lain + node tanpa incoming-edge, TAPI bukan trigger
 *   balasan. Dengan begitu run manual/terjadwal tidak ikut menjalankan chain
 *   penangkap balasan.
 */
function resolveEntryIds(
  nodes: FlowNode[],
  edges: FlowEdge[],
  triggerScope: TriggerScope,
): string[] {
  if (triggerScope === "reply") {
    return nodes
      .filter((node) => REPLY_TRIGGER_KINDS.has(node.data.kind))
      .map((node) => node.id);
  }

  const incomingCount = new Map<string, number>();

  nodes.forEach((node) => incomingCount.set(node.id, 0));
  edges.forEach((edge) =>
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1),
  );

  return nodes
    .filter((node) => {
      if (REPLY_TRIGGER_KINDS.has(node.data.kind)) {
        return false;
      }

      return (
        (incomingCount.get(node.id) ?? 0) === 0 ||
        node.data.kind.endsWith("_trigger")
      );
    })
    .map((node) => node.id);
}

/**
 * Executes ordered nodes starting from a cursor, seeding prior outputs. Detects
 * the `__pause` sentinel returned by `schedule` / `wait_reply` nodes: when hit,
 * it serialises the engine state into a `WaitingExecution` row, marks the
 * execution as "waiting", and returns early so the workflow can resume later.
 */
async function executeNodes(
  orderedNodes: FlowNode[],
  edges: FlowEdge[],
  context: RunContext,
  startCursor: number,
  outputByNodeId: Map<string, unknown>,
  seedLastOutput: unknown,
): Promise<ExecOutcome> {
  let lastOutput: unknown = seedLastOutput;
  let hasFailed = false;

  for (
    let cursorIndex = startCursor;
    cursorIndex < orderedNodes.length;
    cursorIndex += 1
  ) {
    const node = orderedNodes[cursorIndex];

    /** Resolve this node's input: prefer the output of its direct predecessor. */
    const incomingEdge = edges.find((edge) => edge.target === node.id);
    const nodeInput = incomingEdge
      ? (outputByNodeId.get(incomingEdge.source) ?? lastOutput)
      : lastOutput;

    try {
      const output = await runNode(node, nodeInput, context);

      /** Pause sentinel -> persist state and stop until resumed. */
      if (
        output &&
        typeof output === "object" &&
        "__pause" in (output as Record<string, unknown>)
      ) {
        const pause = output as {
          __pause: string;
          dueAt?: number;
          matchKey?: string;
          waitTargets?: Array<{ matchKey: string; row: Item }>;
        };

        outputByNodeId.set(node.id, output);

        /**
         * Wait Reply with multiple targets: each target waits independently so
         * every person's reply is recorded and the run only completes once the
         * last target resolves. We persist one WaitingExecution per target, and
         * scope its saved state to that target's single row so the resumed
         * downstream nodes act on just that person.
         */
        if (
          pause.__pause === "wait_reply" &&
          pause.waitTargets &&
          pause.waitTargets.length > 0
        ) {
          for (const target of pause.waitTargets) {
            const scopedOutputs = new Map(outputByNodeId);

            scopedOutputs.set(node.id, {
              ...(output as Record<string, unknown>),
              rows: [target.row],
            });

            const scopedState = JSON.stringify({
              outputs: Object.fromEntries(scopedOutputs),
              cursorIndex,
            });

            await prisma.waitingExecution.create({
              data: {
                executionId: context.executionId,
                workflowId: context.workflowId,
                nodeId: node.id,
                pauseType: pause.__pause,
                matchKey: target.matchKey,
                dueAt: null,
                state: scopedState,
              },
            });
          }
        } else {
          const serializedState = JSON.stringify({
            outputs: Object.fromEntries(outputByNodeId),
            cursorIndex,
          });

          await prisma.waitingExecution.create({
            data: {
              executionId: context.executionId,
              workflowId: context.workflowId,
              nodeId: node.id,
              pauseType: pause.__pause,
              matchKey: pause.matchKey ?? null,
              dueAt: pause.dueAt ? BigInt(pause.dueAt) : null,
              state: serializedState,
            },
          });
        }

        await prisma.execution.update({
          where: { id: context.executionId },
          data: { status: "waiting" },
        });

        await writeLog(
          context.executionId,
          "info",
          `Node "${node.data.label}": eksekusi dijeda (${pause.__pause})`,
        );

        return { status: "paused", lastOutput };
      }

      outputByNodeId.set(node.id, output);
      lastOutput = output;

      /** Stop traversal down a branch when a condition node evaluates false. */
      if (
        node.data.kind === "condition" &&
        output &&
        typeof output === "object" &&
        (output as { condition?: boolean }).condition === false
      ) {
        await prisma.nodeLog.create({
          data: {
            executionId: context.executionId,
            nodeId: node.id,
            status: "success",
            output: JSON.stringify(output),
          },
        });

        await writeLog(
          context.executionId,
          "info",
          `Node "${node.data.label}": kondisi tidak terpenuhi, branch dihentikan`,
        );

        continue;
      }

      await prisma.nodeLog.create({
        data: {
          executionId: context.executionId,
          nodeId: node.id,
          status: "success",
          output: JSON.stringify(output ?? null),
        },
      });

      await writeLog(
        context.executionId,
        "info",
        `Node "${node.data.label}" sukses`,
      );
    } catch (error) {
      hasFailed = true;

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      await prisma.nodeLog.create({
        data: {
          executionId: context.executionId,
          nodeId: node.id,
          status: "failed",
          output: JSON.stringify({ error: errorMessage }),
        },
      });

      await writeLog(
        context.executionId,
        "error",
        `Node "${node.data.label}" gagal: ${errorMessage}`,
      );

      break;
    }
  }

  return { status: hasFailed ? "failed" : "success", lastOutput };
}

/**
 * Executes a single node in isolation with a caller-supplied sample input, for
 * the editor's per-node "Test Run". No Execution row is created, so this has no
 * side effects on execution history (though connector nodes still perform their
 * real external calls). Returns the node output or an error message.
 */
export async function runSingleNode(
  workflowId: string,
  ownerId: string,
  node: FlowNode,
  sampleInput: unknown,
): Promise<{ ok: boolean; output?: unknown; error?: string }> {
  const context: RunContext = {
    executionId: `test-${Date.now()}`,
    ownerId,
    workflowId,
    triggerPayload: sampleInput,
  };

  try {
    const output = await runNode(node, sampleInput, context);
    return { ok: true, output };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Runs a workflow and records an Execution with logs. The workflow may pause at
 * a `schedule` or `wait_reply` node, in which case the execution status becomes
 * "waiting" and is resumed later via `resumeWorkflow`.
 *
 * @param triggerPayload optional data that seeds trigger nodes (e.g. webhook body)
 * @param triggerScope `"main"` (manual/jadwal) atau `"reply"` (balasan WA/Telegram
 *        via webhook). Menentukan chain mana yang dijalankan saat satu workflow
 *        memuat beberapa chain terpisah.
 */
export async function runWorkflow(
  workflowId: string,
  triggerPayload?: unknown,
  triggerScope: TriggerScope = "main",
): Promise<string> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow) {
    throw new Error("Workflow tidak ditemukan");
  }

  const nodes: FlowNode[] = JSON.parse(workflow.nodes || "[]");
  const edges: FlowEdge[] = JSON.parse(workflow.edges || "[]");

  const execution = await prisma.execution.create({
    data: { workflowId, status: "running" },
  });

  const context: RunContext = {
    executionId: execution.id,
    ownerId: workflow.ownerId,
    workflowId,
    triggerPayload,
  };

  await writeLog(execution.id, "info", `Mulai eksekusi "${workflow.name}"`);

  const entryIds = resolveEntryIds(nodes, edges, triggerScope);
  const orderedNodes = orderNodes(nodes, edges, entryIds);

  const outcome = await executeNodes(
    orderedNodes,
    edges,
    context,
    0,
    new Map(),
    null,
  );

  if (outcome.status !== "paused") {
    await prisma.execution.update({
      where: { id: execution.id },
      data: {
        status: outcome.status,
        finishedAt: new Date(),
        result: JSON.stringify(outcome.lastOutput ?? null),
      },
    });

    await writeLog(
      execution.id,
      outcome.status === "failed" ? "error" : "info",
      `Eksekusi selesai dengan status ${outcome.status}`,
    );
  }

  /**
   * Beri tahu klien (editor) bahwa eksekusi ini berjalan agar animasi run node
   * dapat diputar realtime, termasuk untuk run dari webhook & schedule.
   */
  await publishExecutionUpdate(workflow.ownerId, {
    executionId: execution.id,
    workflowId,
    status: outcome.status,
  });

  return execution.id;
}

/**
 * Resumes a paused execution from its saved cursor. For `wait_reply` pauses the
 * incoming reply payload is merged into each held row so downstream nodes can
 * use {{message}}, {{sender}}, etc.
 */
export async function resumeWorkflow(
  waitingExecutionId: string,
  replyPayload?: Record<string, unknown>,
): Promise<void> {
  const waiting = await prisma.waitingExecution.findUnique({
    where: { id: waitingExecutionId },
  });

  if (!waiting || waiting.status !== "waiting") {
    return;
  }

  const workflow = await prisma.workflow.findUnique({
    where: { id: waiting.workflowId },
  });

  if (!workflow) {
    return;
  }

  const nodes: FlowNode[] = JSON.parse(workflow.nodes || "[]");
  const edges: FlowEdge[] = JSON.parse(workflow.edges || "[]");

  /**
   * Pause `wait_reply`/`schedule` selalu berada di chain utama, jadi pakai
   * scope `"main"` agar urutan node (dan `cursorIndex` tersimpan) tetap sama
   * seperti saat eksekusi dijeda.
   */
  const entryIds = resolveEntryIds(nodes, edges, "main");
  const orderedNodes = orderNodes(nodes, edges, entryIds);

  const parsedState = JSON.parse(waiting.state) as {
    outputs: Record<string, unknown>;
    cursorIndex: number;
  };

  const outputByNodeId = new Map<string, unknown>(
    Object.entries(parsedState.outputs),
  );

  const pauseNode = orderedNodes[parsedState.cursorIndex];

  if (!pauseNode) {
    return;
  }

  const pauseOutput = outputByNodeId.get(pauseNode.id) as
    | { rows?: Item[] }
    | undefined;
  const pauseRows = pauseOutput?.rows ?? [];

  /** Compute the pause node's real output now that it is unblocked. */
  let resumeOutput: unknown;

  if (waiting.pauseType === "wait_reply") {
    const reply = replyPayload ?? {};

    /**
     * Formatted reply time (local Asia/Jakarta) so write templates can record
     * exactly when the target replied, e.g. "{{message}} ({{__replyAt}})".
     */
    const replyAt = new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Jakarta",
      dateStyle: "medium",
      timeStyle: "short",
    });

    const enrichedRows = pauseRows.map((row) => ({
      ...row,
      ...reply,
      reply: reply.message,
      __replyAt: replyAt,
    }));

    resumeOutput = { rows: enrichedRows, ...reply, __replyAt: replyAt };

    /**
     * Catat penanda balasan terstruktur agar editor bisa memunculkan toast
     * "balasan masuk" saat workflow berjalan. Format: __REPLY__|sender|name|message
     * (message dipangkas agar log tetap ringkas).
     */
    const replySender = String(reply.sender ?? "");
    const replyName = String(reply.name ?? "");
    const replyMessage = String(reply.message ?? "")
      .replace(/\s+/g, " ")
      .slice(0, 200);

    await writeLog(
      waiting.executionId,
      "info",
      `__REPLY__|${replySender}|${replyName}|${replyMessage}`,
    );
  } else {
    resumeOutput = {
      rows: pauseRows,
      scheduledAt: new Date().toISOString(),
    };
  }

  outputByNodeId.set(pauseNode.id, resumeOutput);

  const context: RunContext = {
    executionId: waiting.executionId,
    ownerId: workflow.ownerId,
    workflowId: waiting.workflowId,
    triggerPayload: replyPayload,
  };

  await prisma.execution.update({
    where: { id: waiting.executionId },
    data: { status: "running" },
  });

  await prisma.waitingExecution.update({
    where: { id: waiting.id },
    data: { status: "resumed" },
  });

  await writeLog(waiting.executionId, "info", "Eksekusi dilanjutkan");

  const outcome = await executeNodes(
    orderedNodes,
    edges,
    context,
    parsedState.cursorIndex + 1,
    outputByNodeId,
    resumeOutput,
  );

  if (outcome.status !== "paused") {
    /**
     * With per-target waits, several WaitingExecution rows can share one
     * executionId. Only finalize the run when no sibling targets are still
     * waiting; otherwise keep the execution in "waiting" so later replies are
     * still accepted and recorded.
     */
    const remainingWaits = await prisma.waitingExecution.count({
      where: {
        executionId: waiting.executionId,
        status: "waiting",
      },
    });

    if (remainingWaits > 0) {
      await prisma.execution.update({
        where: { id: waiting.executionId },
        data: { status: "waiting" },
      });

      await writeLog(
        waiting.executionId,
        "info",
        `Balasan dicatat. Menunggu ${remainingWaits} target lain membalas`,
      );

      await publishExecutionUpdate(workflow.ownerId, {
        executionId: waiting.executionId,
        workflowId: waiting.workflowId,
        status: "running",
      });

      return;
    }

    await prisma.execution.update({
      where: { id: waiting.executionId },
      data: {
        status: outcome.status,
        finishedAt: new Date(),
        result: JSON.stringify(outcome.lastOutput ?? null),
      },
    });

    await writeLog(
      waiting.executionId,
      outcome.status === "failed" ? "error" : "info",
      `Eksekusi selesai dengan status ${outcome.status}`,
    );
  }

  /**
   * Beri tahu klien (editor) bahwa lanjutan eksekusi ini berjalan agar animasi
   * run node dapat diputar realtime (mis. setelah balasan WhatsApp masuk).
   */
  await publishExecutionUpdate(workflow.ownerId, {
    executionId: waiting.executionId,
    workflowId: waiting.workflowId,
    status: outcome.status,
  });
}

/**
 * Resumes any `wait_reply` executions whose match key corresponds to the sender
 * of an incoming WhatsApp/Telegram reply. Phone keys are compared on digits only.
 */
export async function resumeWaitingReplies(
  sender: string,
  replyPayload: Record<string, unknown>,
): Promise<number> {
  const senderDigits = sender.replace(/\D/g, "");

  if (!senderDigits) {
    return 0;
  }

  const waitingList = await prisma.waitingExecution.findMany({
    where: { pauseType: "wait_reply", status: "waiting" },
    orderBy: { createdAt: "asc" },
  });

  const matchedWaits = waitingList.filter((waiting) =>
    isSamePhoneKey(waiting.matchKey ?? "", senderDigits),
  );

  /**
   * Tanpa batasan jumlah balasan: tiap balasan masuk melanjutkan SATU wait
   * tertua per workflow (tanpa membatalkan sisanya). Dengan begitu target bisa
   * membalas berkali-kali, dan setiap balasan tercatat ke reminder berikutnya
   * yang masih menunggu (lihat mode append daftar pada Google Sheets Update).
   */
  const resumedWorkflowIds = new Set<string>();

  let resumedCount = 0;

  for (const waiting of matchedWaits) {
    if (resumedWorkflowIds.has(waiting.workflowId)) {
      continue;
    }

    resumedWorkflowIds.add(waiting.workflowId);

    await resumeWorkflow(waiting.id, replyPayload);
    resumedCount += 1;
  }

  return resumedCount;
}

/**
 * Resumes all `schedule` executions whose due time has passed. Intended to be
 * driven by an external cron (Vercel Cron / QStash) on serverless deploys.
 */
export async function resumeDueSchedules(): Promise<number> {
  const now = BigInt(Date.now());

  const waitingList = await prisma.waitingExecution.findMany({
    where: { pauseType: "schedule", status: "waiting" },
  });

  let resumedCount = 0;

  for (const waiting of waitingList) {
    if (waiting.dueAt !== null && waiting.dueAt <= now) {
      await resumeWorkflow(waiting.id);
      resumedCount += 1;
    }
  }

  return resumedCount;
}
