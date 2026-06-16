import { auth } from "@/shared/auth";
import { prisma } from "@/shared/lib/prisma";
import { decryptJson } from "@/shared/lib/crypto";
import { requestExternal } from "@/shared/server/httpClient";
import { handleRoute, ok, badRequest, unauthorized } from "@/shared/api/http";

/**
 * POST /api/connectors/telegram/register-webhook
 *
 * Mendaftarkan webhook bot Telegram (setWebhook) ke endpoint penerima
 * `/api/webhooks/telegram/[token]`. Dipicu dari halaman kredensial setelah user
 * menyimpan Bot Token. Body: { credentialId }.
 */
interface RegisterWebhookBody {
  credentialId?: string;
}

const baseUrl = (): string =>
  process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function POST(request: Request) {
  return handleRoute(async () => {
    const session = await auth();

    if (!session?.user?.id) {
      return unauthorized("Sesi tidak ditemukan");
    }

    let body: RegisterWebhookBody;

    try {
      body = (await request.json()) as RegisterWebhookBody;
    } catch {
      return badRequest("Body bukan JSON yang valid");
    }

    if (!body.credentialId) {
      return badRequest("credentialId wajib diisi");
    }

    const credentialRecord = await prisma.credential.findFirst({
      where: {
        id: body.credentialId,
        userId: session.user.id,
        type: "telegram",
      },
    });

    if (!credentialRecord) {
      return badRequest("Kredensial Telegram tidak ditemukan");
    }

    const decrypted = decryptJson<Record<string, string>>(
      credentialRecord.data,
    );

    if (!decrypted.botToken) {
      return badRequest("Kredensial ini bukan Bot Telegram (botToken kosong)");
    }

    const webhookUrl = `${baseUrl()}/api/webhooks/telegram/${decrypted.botToken}`;

    const response = await requestExternal(
      `https://api.telegram.org/bot${decrypted.botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: { url: webhookUrl, allowed_updates: ["message"] },
      },
    );

    if (!response.ok) {
      return badRequest(
        `Telegram menolak setWebhook (status ${response.status})`,
      );
    }

    return ok(
      { registered: true, webhookUrl },
      "Webhook Telegram berhasil didaftarkan",
    );
  });
}
