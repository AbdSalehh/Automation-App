import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { encryptJson, decryptJson } from "@/shared/lib/crypto";
import { GEMINI_MODEL } from "@/shared/config/constants";
import { requestExternal } from "@/shared/server/httpClient";
import { handleRoute, ok, badRequest } from "@/shared/api/http";

/**
 * Konfigurasi Agen Chat-Action (Telegram + Gemini).
 *
 * GET  — status aktif + model terpilih (tanpa membocorkan secret).
 * POST — simpan/ganti kredensial `agent_chat` lalu daftarkan webhook Telegram
 *        agar pesan masuk diterima realtime.
 */

interface AgentConfigBody {
  botToken?: string;
  geminiApiKey?: string;
  geminiModel?: string;
}

const baseUrl = (): string =>
  process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

export async function GET() {
  return handleRoute(async () => {
    const user = await requireUser();

    const credentialRecord = await prisma.credential.findFirst({
      where: { userId: user.id, type: "agent_chat" },
      orderBy: { createdAt: "desc" },
    });

    if (!credentialRecord) {
      return ok({ enabled: false }, "Agen chat-action belum aktif");
    }

    const decrypted = decryptJson<Record<string, string>>(
      credentialRecord.data,
    );

    return ok(
      {
        enabled: true,
        geminiModel: decrypted.geminiModel || GEMINI_MODEL,
        hasBotToken: Boolean(decrypted.botToken),
        hasGeminiApiKey: Boolean(decrypted.geminiApiKey),
      },
      "Status agen chat-action",
    );
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const user = await requireUser();

    let body: AgentConfigBody;

    try {
      body = (await request.json()) as AgentConfigBody;
    } catch {
      return badRequest("Body bukan JSON yang valid");
    }

    const botToken = body.botToken?.trim() ?? "";
    const geminiApiKey = body.geminiApiKey?.trim() ?? "";
    const geminiModel = body.geminiModel?.trim() || GEMINI_MODEL;

    if (!botToken) {
      return badRequest("Bot Token Telegram wajib diisi");
    }

    if (!geminiApiKey) {
      return badRequest("Gemini API key wajib diisi");
    }

    /**
     * Daftarkan webhook Telegram dulu — jika token salah, jangan simpan config.
     */
    const webhookUrl = `${baseUrl()}/api/webhooks/telegram/${botToken}`;

    const webhookResponse = await requestExternal(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: { url: webhookUrl, allowed_updates: ["message"] },
      },
    );

    if (!webhookResponse.ok) {
      return badRequest(
        `Telegram menolak Bot Token (status ${webhookResponse.status}). Periksa kembali token dari BotFather.`,
      );
    }

    const encrypted = encryptJson({ botToken, geminiApiKey, geminiModel });

    /** Hapus config lama (bila ada) lalu simpan yang baru. */
    await prisma.credential.deleteMany({
      where: { userId: user.id, type: "agent_chat" },
    });

    await prisma.credential.create({
      data: {
        userId: user.id,
        type: "agent_chat",
        name: "Agen Chat-Action",
        data: encrypted,
      },
    });

    return ok(
      { enabled: true, geminiModel, webhookUrl },
      "Agen chat-action berhasil diaktifkan",
    );
  });
}

export async function DELETE() {
  return handleRoute(async () => {
    const user = await requireUser();

    await prisma.credential.deleteMany({
      where: { userId: user.id, type: "agent_chat" },
    });

    return ok({ enabled: false }, "Agen chat-action dinonaktifkan");
  });
}
