import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { handleRoute, ok, notFound } from "@/shared/api/http";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Prefix penanda balasan yang ditulis engine ke tabel Log saat resume. */
const REPLY_LOG_PREFIX = "__REPLY__|";

/**
 * Mengembalikan balasan WhatsApp masuk terbaru untuk sebuah workflow, dibaca
 * dari log penanda yang ditulis engine (tanpa tabel inbox khusus). Dipakai
 * editor untuk memunculkan toast saat balasan tiba ketika workflow berjalan.
 *
 * Aman: workflow difilter berdasarkan pemilik (`requireUser`), bukan input
 * browser. Parameter `since` (ISO) membatasi hanya balasan setelah waktu itu.
 */
export async function GET(request: Request, { params }: RouteParams) {
  return handleRoute(async () => {
    const user = await requireUser();
    const { id } = await params;

    const workflow = await prisma.workflow.findFirst({
      where: { id, ownerId: user.id },
      select: { id: true },
    });

    if (!workflow) {
      return notFound("Workflow tidak ditemukan");
    }

    const url = new URL(request.url);
    const sinceParam = url.searchParams.get("since");
    const since = sinceParam ? new Date(sinceParam) : null;

    const logs = await prisma.log.findMany({
      where: {
        execution: { workflowId: id },
        message: { startsWith: REPLY_LOG_PREFIX },
        ...(since ? { timestamp: { gt: since } } : {}),
      },
      orderBy: { timestamp: "asc" },
      take: 50,
    });

    console.log("logs", logs);

    /**
     * Format penanda: __REPLY__|sender|name|message. Pisahkan jadi maksimal 4
     * bagian agar pesan yang memuat karakter "|" tetap utuh.
     */
    const replies = logs.map((log) => {
      const parts = log.message.split("|", 4);

      const senderPhoneNumber = parts[1] ?? "";

      const senderName = parts[2] ?? "";

      const messageContent = parts[3] ?? "";

      return {
        id: log.id,
        sender: senderPhoneNumber,
        name: senderName,
        message: messageContent,
        receivedAt: log.timestamp.toISOString(),
      };
    });

    const [{ serverTime }] = await prisma.$queryRaw<
      Array<{ serverTime: Date }>
    >`SELECT LOCALTIMESTAMP as "serverTime"`;

    return ok(
      {
        replies,
        serverTime: serverTime.toISOString(),
      },
      "Balasan masuk berhasil diambil",
    );
  });
}
