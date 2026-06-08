import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, noContent, notFound } from "@/shared/api/http";
import { cacheQuery, cacheKeys, invalidateKeys } from "@/shared/lib/cache";
import type {
  FlowNode,
  FlowEdge,
} from "@/entities/workflow/model/workflow.model";

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface WorkflowRecord {
  id: string;
  name: string;
  ownerId: string;
  nodes: string;
  edges: string;
  version: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

async function findOwnedWorkflow(workflowId: string, ownerId: string) {
  return prisma.workflow.findFirst({ where: { id: workflowId, ownerId } });
}

function serializeWorkflow(workflow: WorkflowRecord) {
  return {
    id: workflow.id,
    name: workflow.name,
    ownerId: workflow.ownerId,
    nodes: JSON.parse(workflow.nodes || "[]") as FlowNode[],
    edges: JSON.parse(workflow.edges || "[]") as FlowEdge[],
    version: workflow.version,
    isPublished: workflow.isPublished,
    createdAt: workflow.createdAt.toISOString(),
    updatedAt: workflow.updatedAt.toISOString(),
  };
}

// GET /api/workflows/:id — detail (cached).
export async function GET(_request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const existingWorkflow = await findOwnedWorkflow(id, user.id);

    if (!existingWorkflow) {
      return notFound("Workflow tidak ditemukan");
    }

    const detail = await cacheQuery(cacheKeys.workflowDetail(id), async () =>
      serializeWorkflow(existingWorkflow),
    );

    return ok(detail, "Data workflow berhasil diambil");
  });
}

// PUT /api/workflows/:id — update name/nodes/edges/publish.
export async function PUT(request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const existingWorkflow = await findOwnedWorkflow(id, user.id);

    if (!existingWorkflow) {
      return notFound("Workflow tidak ditemukan");
    }

    const body = (await request.json()) as {
      name?: string;
      nodes?: FlowNode[];
      edges?: FlowEdge[];
      isPublished?: boolean;
    };

    const updateData: Record<string, unknown> = {};

    if (typeof body.name === "string") {
      updateData.name = body.name.trim();
    }

    if (Array.isArray(body.nodes)) {
      updateData.nodes = JSON.stringify(body.nodes);
    }

    if (Array.isArray(body.edges)) {
      updateData.edges = JSON.stringify(body.edges);
    }

    if (typeof body.isPublished === "boolean") {
      updateData.isPublished = body.isPublished;
    }

    // Bump version whenever the graph changes.
    if (updateData.nodes || updateData.edges) {
      updateData.version = existingWorkflow.version + 1;
    }

    const updatedWorkflow = await prisma.workflow.update({
      where: { id },
      data: updateData,
    });

    await invalidateKeys(
      cacheKeys.workflowDetail(id),
      cacheKeys.workflowList(user.id),
    );

    return ok(serializeWorkflow(updatedWorkflow), "Workflow berhasil diperbarui");
  });
}

// DELETE /api/workflows/:id
export async function DELETE(_request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const existingWorkflow = await findOwnedWorkflow(id, user.id);

    if (!existingWorkflow) {
      return notFound("Workflow tidak ditemukan");
    }

    await prisma.workflow.delete({ where: { id } });

    await invalidateKeys(
      cacheKeys.workflowDetail(id),
      cacheKeys.workflowList(user.id),
    );

    return noContent();
  });
}
