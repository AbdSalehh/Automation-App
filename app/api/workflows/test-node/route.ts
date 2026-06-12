import { requireUser } from "@/shared/auth";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import { runSingleNode } from "@/shared/server/engine";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";

/**
 * POST /api/workflows/test-node
 *
 * Runs a single node in isolation with a caller-supplied sample payload so the
 * editor can offer a per-node "Test Run". Connector nodes still perform their
 * real external calls, but no Execution row is recorded.
 *
 * Body: { workflowId, node, sampleInput? }
 * Returns: { ok, output?, error? }
 */
export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    const body = (await request.json()) as {
      workflowId?: string;
      node?: FlowNode;
      sampleInput?: unknown;
    };

    if (!body.node || !body.node.data?.kind) {
      return badRequest("Node tidak valid");
    }

    const result = await runSingleNode(
      body.workflowId ?? "test-workflow",
      user.id,
      body.node,
      body.sampleInput ?? {},
    );

    return ok(result, result.ok ? "Test berhasil" : "Test gagal");
  });
}
