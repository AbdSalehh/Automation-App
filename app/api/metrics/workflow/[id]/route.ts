import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, notFound } from "@/shared/api/http";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Awal bulan ini (UTC) sebagai patokan agregasi "bulan ini". */
function startOfMonthUtc(): Date {
  const now = new Date();

  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * GET /api/metrics/workflow/:id — metrik nyata untuk satu workflow: total
 * eksekusi, eksekusi bulan ini, success rate, dan waktu eksekusi terakhir.
 */
export async function GET(_request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: { id, ownerId: user.id },
    });

    if (!workflow) {
      return notFound("Workflow tidak ditemukan");
    }

    const monthStart = startOfMonthUtc();

    const [totalExecutions, executionsThisMonth, successCount, lastExecution] =
      await Promise.all([
        prisma.execution.count({ where: { workflowId: id } }),
        prisma.execution.count({
          where: { workflowId: id, startedAt: { gte: monthStart } },
        }),
        prisma.execution.count({
          where: { workflowId: id, status: "success" },
        }),
        prisma.execution.findFirst({
          where: { workflowId: id },
          orderBy: { startedAt: "desc" },
          select: { status: true, startedAt: true, finishedAt: true },
        }),
      ]);

    const successRate =
      totalExecutions > 0
        ? Math.round((successCount / totalExecutions) * 1000) / 10
        : 0;

    return ok(
      {
        workflowId: id,
        totalExecutions,
        executionsThisMonth,
        successRate,
        lastExecutionStatus: lastExecution?.status ?? null,
        lastExecutionAt: lastExecution?.startedAt.toISOString() ?? null,
        lastExecutionFinishedAt:
          lastExecution?.finishedAt?.toISOString() ?? null,
        updatedAt: workflow.updatedAt.toISOString(),
      },
      "Metrik workflow berhasil diambil",
    );
  });
}
