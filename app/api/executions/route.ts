import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, okPaginated, parsePagination } from "@/shared/api/http";
import { cacheQuery, cacheKeys } from "@/shared/lib/cache";

// GET /api/executions?workflowId=...&page=1&limit=10 — list executions (cached).
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get("workflowId") ?? undefined;
    const pagination = parsePagination(searchParams, { limit: 10 });

    const allExecutions = await cacheQuery(
      cacheKeys.executionList(user.id, workflowId),
      async () => {
        const executionRecords = await prisma.execution.findMany({
          where: {
            workflowId,
            workflow: { ownerId: user.id },
          },
          orderBy: { startedAt: "desc" },
          take: 500,
          include: { workflow: { select: { name: true } } },
        });

        return executionRecords.map((execution) => ({
          id: execution.id,
          workflowId: execution.workflowId,
          workflowName: execution.workflow.name,
          status: execution.status,
          startedAt: execution.startedAt.toISOString(),
          finishedAt: execution.finishedAt?.toISOString() ?? null,
          result: execution.result ? JSON.parse(execution.result) : null,
        }));
      },
      30,
    );

    const totalItems = allExecutions.length;
    const start = (pagination.page - 1) * pagination.limit;
    const pageItems = allExecutions.slice(start, start + pagination.limit);

    return okPaginated(
      pageItems,
      totalItems,
      pagination,
      "Data eksekusi berhasil diambil",
    );
  });
}
