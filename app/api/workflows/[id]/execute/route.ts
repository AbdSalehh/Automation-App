import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, notFound } from "@/shared/api/http";
import { runWorkflow } from "@/shared/server/engine";
import { invalidatePattern } from "@/shared/lib/cache";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/workflows/:id/execute — run the workflow now.
export async function POST(_request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: { id, ownerId: user.id },
    });

    if (!workflow) {
      return notFound("Workflow not found");
    }

    const executionId = await runWorkflow(id);

    // A new execution invalidates any cached execution lists for this user.
    await invalidatePattern(`executions:list:${user.id}:*`);

    return ok({ executionId }, "Workflow berhasil dijalankan");
  });
}
