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

// GET /api/workflows — list current user's workflows (summaries, cached).
export async function GET(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const pagination = parsePagination(searchParams, { limit: 20 });

    const allSummaries = await cacheQuery(
      cacheKeys.workflowList(user.id),
      async () => {
        const workflows = await prisma.workflow.findMany({
          where: { ownerId: user.id },
          orderBy: { updatedAt: "desc" },
        });

        return workflows.map((workflow) => ({
          id: workflow.id,
          name: workflow.name,
          version: workflow.version,
          isPublished: workflow.isPublished,
          updatedAt: workflow.updatedAt.toISOString(),
          nodeCount: (JSON.parse(workflow.nodes || "[]") as unknown[]).length,
        }));
      },
    );

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
      return badRequest("Nama workflow wajib diisi");
    }

    const workflow = await prisma.workflow.create({
      data: { name: body.name.trim(), ownerId: user.id },
    });

    await invalidateKeys(cacheKeys.workflowList(user.id));

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
