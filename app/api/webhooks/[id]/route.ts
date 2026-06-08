import { prisma } from "@/shared/lib/prisma";
import { handleRoute, ok, notFound } from "@/shared/api/http";
import { runWorkflow } from "@/shared/server/engine";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Public webhook entry point.
 *
 * POST /api/webhooks/:id triggers the workflow identified by :id, passing the
 * request body to the engine as the trigger payload. This lets external systems
 * (forms, other apps, cron services) kick off a workflow.
 *
 * The workflow must be published and contain a webhook_trigger node.
 *
 * NOTE: This endpoint is intentionally unauthenticated so external callers can
 * reach it. Security is provided by the unguessable workflow id; for stronger
 * protection add a per-workflow secret check before going to production.
 */
export async function POST(request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const { id } = await params;

    const workflow = await prisma.workflow.findUnique({ where: { id } });

    if (!workflow) {
      return notFound("Workflow tidak ditemukan");
    }

    if (!workflow.isPublished) {
      return notFound("Workflow belum dipublish");
    }

    let payload: unknown = null;

    try {
      payload = await request.json();
    } catch {
      payload = null;
    }

    const executionId = await runWorkflow(id, payload);

    return ok({ executionId }, "Webhook diterima, workflow dijalankan");
  });
}

/** Allow simple GET pings for connectivity checks. */
export async function GET(_request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const { id } = await params;

    const workflow = await prisma.workflow.findUnique({ where: { id } });

    if (!workflow) {
      return notFound("Workflow tidak ditemukan");
    }

    return ok(
      { workflowId: id, published: workflow.isPublished },
      "Webhook aktif",
    );
  });
}
