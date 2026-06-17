import { prisma } from "@/shared/lib/prisma";
import { decryptJson } from "@/shared/lib/crypto";
import { GEMINI_MODEL } from "@/shared/config/constants";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import { runWorkflow, resumeWaitingReplies } from "@/shared/server/engine";
import { requestExternal } from "@/shared/server/httpClient";
import {
  handleAgentMessage,
  type AgentTransport,
} from "@/shared/server/agent/agentRouter";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";

/**
 * Webhook pesan masuk Telegram (per-bot).
 *
 * Telegram melakukan POST ke URL ini setiap ada update (realtime, lewat
 * setWebhook). Token bot diambil dari segmen path `[token]` sehingga endpoint
 * bisa mengidentifikasi kredensial & pemilik (owner) yang tepat tanpa header
 * auth (Telegram tidak mengirim auth).
 *
 * Dua jalur:
 * 1. Bot terdaftar sebagai Agen Chat-Action (`agent_chat`) → pesan diproses
 *    router Gemini (tanya/buat/jalankan).
 * 2. Bot biasa → memicu workflow milik pemilik yang memuat `telegram_trigger`.
 */
interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id?: number | string };
    from?: { first_name?: string; username?: string };
  };
}

interface AgentChatConfig {
  ownerId: string;
  geminiApiKey: string;
  geminiModel: string;
}

/** Mencari kredensial agen chat-action yang botToken-nya cocok. */
async function findAgentChatConfig(
  botToken: string,
): Promise<AgentChatConfig | null> {
  const agentCredentials = await prisma.credential.findMany({
    where: { type: "agent_chat" },
  });

  for (const credentialRecord of agentCredentials) {
    try {
      const decrypted = decryptJson<Record<string, string>>(
        credentialRecord.data,
      );

      if (decrypted.botToken === botToken) {
        return {
          ownerId: credentialRecord.userId,
          geminiApiKey: decrypted.geminiApiKey ?? "",
          geminiModel: decrypted.geminiModel || GEMINI_MODEL,
        };
      }
    } catch {
      continue;
    }
  }

  return null;
}

/** Mencari kredensial Telegram (beserta owner) yang botToken-nya cocok. */
async function findTelegramOwner(
  botToken: string,
): Promise<{ ownerId: string } | null> {
  const telegramCredentials = await prisma.credential.findMany({
    where: { type: "telegram" },
  });

  for (const credentialRecord of telegramCredentials) {
    try {
      const decrypted = decryptJson<Record<string, string>>(
        credentialRecord.data,
      );

      if (decrypted.botToken === botToken) {
        return { ownerId: credentialRecord.userId };
      }
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Transport Telegram untuk router agen: mengirim balasan via `sendMessage` dan
 * indikator "sedang mengetik" via `sendChatAction` (realtime di aplikasi chat).
 */
function createTelegramTransport(
  botToken: string,
  chatId: string,
): AgentTransport {
  return {
    reply: async (text) => {
      const sendMessageUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

      const htmlResponse = await requestExternal(sendMessageUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: { chat_id: chatId, text, parse_mode: "HTML" },
      });

      /**
       * Bila Telegram menolak HTML (mis. tag tidak valid), kirim ulang sebagai
       * teks biasa agar pesan tetap sampai ke pengguna.
       */
      if (!htmlResponse.ok) {
        await requestExternal(sendMessageUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          data: { chat_id: chatId, text },
        });
      }
    },

    sendTyping: async () => {
      try {
        await requestExternal(
          `https://api.telegram.org/bot${botToken}/sendChatAction`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            data: { chat_id: chatId, action: "typing" },
          },
        );
      } catch {
        /** Indikator mengetik opsional; kegagalan tidak menghentikan alur. */
      }
    },
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  return handleRoute(async () => {
    const { token } = await params;

    if (!token) {
      return badRequest("Token bot tidak ada di URL");
    }

    let update: TelegramUpdate;

    try {
      update = (await request.json()) as TelegramUpdate;
    } catch {
      return badRequest("Body bukan JSON yang valid");
    }

    const message = update.message;
    const text = message?.text ?? "";
    const chatId = message?.chat?.id;

    /** Update tanpa pesan teks (mis. status) diabaikan dengan sukses. */
    if (!text || chatId === undefined || chatId === null) {
      return ok({ ignored: true }, "Update tanpa pesan teks diabaikan");
    }

    /**
     * Jalur 1 — Agen Chat-Action. Jika token cocok dengan kredensial
     * `agent_chat`, seluruh pesan diproses router Gemini.
     */
    const agentConfig = await findAgentChatConfig(token);

    if (agentConfig) {
      if (!agentConfig.geminiApiKey) {
        return badRequest("Agen chat-action belum memiliki Gemini API key");
      }

      const transport = createTelegramTransport(token, String(chatId));

      const result = await handleAgentMessage({
        ownerId: agentConfig.ownerId,
        sender: String(chatId),
        message: text,
        geminiApiKey: agentConfig.geminiApiKey,
        geminiModel: agentConfig.geminiModel,
        transport,
      });

      return ok(result, "Pesan agen diproses");
    }

    /** Jalur 2 — Bot biasa: picu workflow telegram_trigger milik pemilik. */
    const owner = await findTelegramOwner(token);

    if (!owner) {
      return badRequest("Token bot tidak dikenali");
    }

    const senderName =
      message?.from?.first_name ?? message?.from?.username ?? "";

    const payload = {
      sessionId: owner.ownerId,
      sender: String(chatId),
      chatId: String(chatId),
      message: text,
      name: senderName,
      receivedAt: new Date().toISOString(),
      provider: "telegram",
    };

    /** Lanjutkan eksekusi wait_reply yang menunggu balasan pengirim ini. */
    const resumedCount = await resumeWaitingReplies(payload.sender, payload);

    const publishedWorkflows = await prisma.workflow.findMany({
      where: { isPublished: true, ownerId: owner.ownerId },
    });

    const triggered: string[] = [];

    for (const workflow of publishedWorkflows) {
      const nodes: FlowNode[] = JSON.parse(workflow.nodes || "[]");

      const hasReplyTrigger = nodes.some(
        (node) => node.data.kind === "telegram_trigger",
      );

      if (!hasReplyTrigger) {
        continue;
      }

      const executionId = await runWorkflow(workflow.id, payload, "reply");
      triggered.push(executionId);
    }

    return ok(
      { triggered, count: triggered.length, resumed: resumedCount },
      "Pesan masuk Telegram diterima",
    );
  });
}

/** Telegram kadang mem-probe endpoint dengan GET — balas OK. */
export async function GET() {
  return handleRoute(async () => ok({ ok: true }, "Webhook Telegram aktif"));
}
