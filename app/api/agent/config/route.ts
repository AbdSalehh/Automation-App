import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { encryptJson, decryptJson } from "@/shared/lib/crypto";
import { requestExternal } from "@/shared/server/httpClient";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import {
  buildChainFromConfig,
  type AgentChatConfig,
} from "@/shared/server/agentChatConfig";
import type { AiProviderConfig } from "@/shared/server/ai/types";

/**
 * Konfigurasi Agen Chat-Action (Telegram + penyedia AI).
 *
 * GET  — status aktif + daftar penyedia (tanpa membocorkan API key).
 * POST — simpan/ganti kredensial `agent_chat` lalu daftarkan webhook Telegram
 *        agar pesan masuk diterima realtime.
 */

interface AgentConfigBody {
  botToken?: string;
  /** Daftar penyedia AI terurut (indeks 0 = utama, sisanya fallback). */
  providers?: AiProviderConfig[];
}

const baseUrl = (): string =>
  process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

/** Menyaring penyedia yang lengkap (punya provider, apiKey, dan model). */
function sanitizeProviders(
  providers: AiProviderConfig[] | undefined,
): AiProviderConfig[] {
  if (!Array.isArray(providers)) {
    return [];
  }

  return providers
    .filter(
      (provider) =>
        provider?.provider && provider.apiKey?.trim() && provider.model?.trim(),
    )
    .map((provider) => ({
      provider: provider.provider,
      apiKey: provider.apiKey.trim(),
      model: provider.model.trim(),
    }));
}

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

    const decrypted = decryptJson<AgentChatConfig>(credentialRecord.data);

    const chain = buildChainFromConfig(decrypted);

    /** Kembalikan metadata penyedia tanpa membocorkan API key. */
    const providers = chain.map((provider) => ({
      provider: provider.provider,
      model: provider.model,
    }));

    return ok(
      {
        enabled: true,
        providers,
        hasBotToken: Boolean(decrypted.botToken),
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
    const providers = sanitizeProviders(body.providers);

    if (!botToken) {
      return badRequest("Bot Token Telegram wajib diisi");
    }

    if (providers.length === 0) {
      return badRequest(
        "Minimal satu penyedia AI (provider, API key, dan model) wajib diisi",
      );
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

    const encrypted = encryptJson({ botToken, providers });

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
      { enabled: true, providerCount: providers.length, webhookUrl },
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
