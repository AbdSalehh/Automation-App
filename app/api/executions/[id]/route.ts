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
        workflow: { select: { name: true } },
        nodeLogs: { orderBy: { timestamp: "asc" } },
        logs: { orderBy: { timestamp: "asc" } },
      },
    });
    if (!execution) return notFound("Eksekusi tidak ditemukan");

    return ok(
      {
        id: execution.id,
        workflowId: execution.workflowId,
        workflowName: execution.workflow.name,
        status: execution.status,
        startedAt: execution.startedAt.toISOString(),
        finishedAt: execution.finishedAt?.toISOString() ?? null,
        result: execution.result ? JSON.parse(execution.result) : null,
        nodeLogs: execution.nodeLogs.map((n) => ({
          id: n.id,
          nodeId: n.nodeId,
          status: n.status,
          output: n.output ? JSON.parse(n.output) : null,
          timestamp: n.timestamp.toISOString(),
        })),
        logs: execution.logs.map((l) => ({
          id: l.id,
          message: l.message,
          level: l.level,
          timestamp: l.timestamp.toISOString(),
        })),
      },
      "Data eksekusi berhasil diambil",
    );
  });
}
