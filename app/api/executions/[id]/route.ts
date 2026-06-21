import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, notFound } from "@/shared/api/http";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/executions/:id — execution detail with node logs and runtime logs.
export async function GET(_req: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;
    const execution = await prisma.execution.findFirst({
      where: { id, workflow: { ownerId: user.id } },
      include: {
        workflow: { select: { name: true, nodes: true } },
        nodeLogs: { orderBy: { timestamp: "asc" } },
        logs: { orderBy: { timestamp: "asc" } },
      },
    });
    if (!execution) return notFound("Eksekusi tidak ditemukan");

    /**
     * Peta nodeId -> label dari definisi workflow agar log menampilkan nama
     * node yang ramah dibaca, bukan id mentah.
     */
    const workflowNodes = JSON.parse(
      execution.workflow.nodes || "[]",
    ) as Array<{
      id: string;
      data?: { label?: string };
    }>;

    const labelByNodeId = new Map(
      workflowNodes.map((node) => [node.id, node.data?.label ?? node.id]),
    );

    /**
     * Mengekstrak pesan error dari output node yang gagal (disimpan sebagai
     * `{ error: "..." }` oleh runner). Mengembalikan null bila tidak ada.
     */
    const extractErrorMessage = (parsedOutput: unknown): string | null => {
      if (parsedOutput && typeof parsedOutput === "object") {
        const record = parsedOutput as Record<string, unknown>;

        if (typeof record.error === "string") {
          return record.error;
        }
      }

      return null;
    };

    return ok(
      {
        id: execution.id,
        workflowId: execution.workflowId,
        workflowName: execution.workflow.name,
        status: execution.status,
        startedAt: execution.startedAt.toISOString(),
        finishedAt: execution.finishedAt?.toISOString() ?? null,
        result: execution.result ? JSON.parse(execution.result) : null,
        nodeLogs: execution.nodeLogs.map((nodeLog) => {
          const parsedOutput = nodeLog.output
            ? JSON.parse(nodeLog.output)
            : null;

          return {
            id: nodeLog.id,
            nodeId: nodeLog.nodeId,
            nodeLabel: labelByNodeId.get(nodeLog.nodeId) ?? nodeLog.nodeId,
            status: nodeLog.status,
            output: parsedOutput,
            errorMessage:
              nodeLog.status === "failed"
                ? extractErrorMessage(parsedOutput)
                : null,
            timestamp: nodeLog.timestamp.toISOString(),
          };
        }),
        logs: execution.logs.map((logEntry) => ({
          id: logEntry.id,
          message: logEntry.message,
          level: logEntry.level,
          timestamp: logEntry.timestamp.toISOString(),
        })),
      },
      "Data eksekusi berhasil diambil",
    );
  });
}
