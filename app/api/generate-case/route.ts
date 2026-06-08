import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok } from "@/shared/api/http";

// GET /api/generate-case — generate next case number JR-YYYY-XXXX.
export async function GET() {
  return handleRoute(async () => {
    await requireUser();
    const year = new Date().getFullYear();
    const prefix = `JR-${year}-`;

    const lastCase = await prisma.workflow.findFirst({
      where: { name: { startsWith: prefix } },
      orderBy: { name: "desc" },
    });

    const nextSeq = lastCase
      ? Number(lastCase.name.split("-")[2]) + 1
      : 1;
    const caseId = `${prefix}${String(nextSeq).padStart(4, "0")}`;

    return ok({ caseId });
  });
}
