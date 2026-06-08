import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok } from "@/shared/api/http";

// GET /api/logs?workflowId=&level= — runtime logs across the user's executions.
export async function GET(req: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get("workflowId") ?? undefined;
    const level = searchParams.get("level") ?? undefined;

    const logs = await prisma.log.findMany({
      where: {
        level,
        execution: {
          workflowId,
          workflow: { ownerId: user.id },
        },
      },
      orderBy: { timestamp: "desc" },
      take: 200,
      include: {
        execution: {
          select: { id: true, workflow: { select: { name: true } } },
        },
      },
    });

    return ok(
      logs.map((l) => ({
        id: l.id,
        executionId: l.executionId,
        workflowName: l.execution.workflow.name,
        message: l.message,
        level: l.level,
        timestamp: l.timestamp.toISOString(),
      })),
    );
  });
}
