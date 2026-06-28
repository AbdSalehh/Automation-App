import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import {
  handleRoute,
  ok,
  created,
  badRequest,
  okPaginated,
  parsePagination,
} from "@/shared/api/http";
import { cacheQuery, cacheKeys, invalidateKeys } from "@/shared/lib/cache";
import { publishWorkflowUpdate } from "@/shared/server/ablyPublisher";

// GET /api/workflows — list current user's workflows (summaries, cached).
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams, { limit: 20 });

    /**
     * Ringkasan dasar (nama, versi, jumlah node, trigger) di-cache karena hanya
     * berubah saat workflow diedit.
     */
    const baseSummaries = await cacheQuery(
      cacheKeys.workflowList(user.id),
      async () => {
        const workflows = await prisma.workflow.findMany({
          where: { ownerId: user.id },
          orderBy: { updatedAt: "desc" },
        });

        return workflows.map((workflow) => {
          const flowNodes = JSON.parse(workflow.nodes || "[]") as {
            data?: { kind?: string };
          }[];

          const triggerNode = flowNodes.find((flowNode) =>
            String(flowNode.data?.kind ?? "").includes("trigger"),
          );

          return {
            id: workflow.id,
            name: workflow.name,
            version: workflow.version,
            isPublished: workflow.isPublished,
            updatedAt: workflow.updatedAt.toISOString(),
            nodeCount: flowNodes.length,
            triggerKind: triggerNode?.data?.kind ?? null,
          };
        });
      },
    );

    /**
     * Agregat eksekusi dihitung segar setiap request karena berubah independen
     * dari penyuntingan workflow (run manual, schedule, webhook).
     */
    const workflowIds = baseSummaries.map((summary) => summary.id);

    const [executionCounts, latestExecutions] = await Promise.all([
      prisma.execution.groupBy({
        by: ["workflowId"],
        where: { workflowId: { in: workflowIds } },
        _count: { _all: true },
      }),
      prisma.execution.findMany({
        where: { workflowId: { in: workflowIds } },
        orderBy: { startedAt: "desc" },
        distinct: ["workflowId"],
        select: { workflowId: true, status: true, startedAt: true },
      }),
    ]);

    const countByWorkflow = new Map(
      executionCounts.map((row) => [row.workflowId, row._count._all]),
    );

    const latestByWorkflow = new Map(
      latestExecutions.map((row) => [row.workflowId, row]),
    );

    const allSummaries = baseSummaries.map((summary) => {
      const latest = latestByWorkflow.get(summary.id);

      return {
        ...summary,
        executionCount: countByWorkflow.get(summary.id) ?? 0,
        lastExecutionStatus: latest?.status ?? null,
        lastExecutionAt: latest?.startedAt.toISOString() ?? null,
      };
    });

    const totalItems = allSummaries.length;
    const start = (pagination.page - 1) * pagination.limit;
    const pageItems = allSummaries.slice(start, start + pagination.limit);

    return okPaginated(
      pageItems,
      totalItems,
      pagination,
      "Data workflow berhasil diambil",
    );
  });
}

// POST /api/workflows — create a new workflow.
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const body = (await request.json()) as { name?: string };

    if (!body.name?.trim()) {
      return badRequest("Workflow name is required");
    }

    const workflow = await prisma.workflow.create({
      data: { name: body.name.trim(), ownerId: user.id },
    });

    await invalidateKeys(cacheKeys.workflowList(user.id));

    await publishWorkflowUpdate(user.id, {
      action: "created",
      workflowId: workflow.id,
    });

    return created(
      {
        id: workflow.id,
        name: workflow.name,
        ownerId: workflow.ownerId,
        nodes: [],
        edges: [],
        version: workflow.version,
        isPublished: workflow.isPublished,
        createdAt: workflow.createdAt.toISOString(),
        updatedAt: workflow.updatedAt.toISOString(),
      },
      "Workflow berhasil dibuat",
    );
  });
}
