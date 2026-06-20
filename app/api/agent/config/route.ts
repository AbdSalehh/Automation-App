import { prisma } from "@/shared/lib/prisma";
import { requireUser } from "@/shared/auth";
import { encryptJson, decryptJson } from "@/shared/lib/crypto";
import { requestExternal } from "@/shared/server/httpClient";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import {
  resolveChainFromConfig,
  type AgentChatConfig,
} from "@/shared/server/agentChatConfig";

/**
 * Konfigurasi Agen Chat-Action (Telegram + penyedia AI).
 *
 * GET  — status aktif + daftar penyedia (tanpa membocorkan API key).
 * POST — simpan/ganti kredensial `agent_chat` lalu daftarkan webhook Telegram
 *        agar pesan masuk diterima realtime.
 */

interface AgentConfigBody {
  botToken?: string;
  /** Daftar id kredensial AI terurut (indeks 0 = utama, sisanya fallback). */
  credentialIds?: string[];
}

const baseUrl = (): string =>
  process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

/** Menyaring id kredensial yang valid (string non-kosong, tanpa duplikat). */
function sanitizeCredentialIds(credentialIds: string[] | undefined): string[] {
  if (!Array.isArray(credentialIds)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const credentialId of credentialIds) {
    const trimmed = String(credentialId ?? "").trim();

    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  }

  return result;
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

    const chain = await resolveChainFromConfig(decrypted, user.id);

    /** Kembalikan metadata penyedia tanpa membocorkan API key. */
    const providers = chain.map((provider) => ({
      provider: provider.provider,
      model: provider.model,
    }));

    return ok(
      {
        enabled: true,
        providers,
        credentialIds: decrypted.credentialIds ?? [],
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
    const credentialIds = sanitizeCredentialIds(body.credentialIds);

    if (!botToken) {
      return badRequest("Bot Token Telegram wajib diisi");
    }

    if (credentialIds.length === 0) {
      return badRequest("Minimal satu kredensial AI wajib dipilih");
    }

    /**
     * Pastikan semua kredensial yang dipilih benar milik pengguna dan bertipe
     * AI agar tidak ada referensi kredensial orang lain atau tipe lain.
     */
    const ownedAiCredentials = await prisma.credential.count({
      where: { userId: user.id, type: "ai", id: { in: credentialIds } },
    });

    if (ownedAiCredentials !== credentialIds.length) {
      return badRequest(
        "Sebagian kredensial AI tidak valid atau bukan milik Anda",
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

    const encrypted = encryptJson({ botToken, credentialIds });

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
      { enabled: true, providerCount: credentialIds.length, webhookUrl },
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
