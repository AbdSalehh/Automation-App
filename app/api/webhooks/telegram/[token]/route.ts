import { prisma } from "@/shared/lib/prisma";
import { decryptJson } from "@/shared/lib/crypto";
import { handleRoute, ok, badRequest } from "@/shared/api/http";
import { runWorkflow, resumeWaitingReplies } from "@/shared/server/engine";
import { handleBuilderIntent } from "@/shared/server/builderIntent";
import type { FlowNode } from "@/entities/workflow/model/workflow.model";

/**
 * Webhook pesan masuk Telegram (per-bot).
 *
 * Telegram melakukan POST ke URL ini setiap ada update. Token bot diambil dari
 * segmen path `[token]` sehingga endpoint bisa mengidentifikasi kredensial &
 * pemilik (owner) yang tepat tanpa header auth (Telegram tidak mengirim auth).
 *
 * Hanya workflow milik pemilik bot yang memuat node `telegram_trigger` yang
 * dipicu, sehingga pesan satu user tidak salah memicu workflow user lain.
 */
interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id?: number | string };
    from?: { first_name?: string; username?: string };
  };
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

    /**
     * Intent builder: bila pesan adalah perintah membuat otomasi, bangun
     * workflow lalu balas via Telegram — tidak meneruskan ke alur biasa.
     */
    const builderHandled = await handleBuilderIntent({
      ownerId: owner.ownerId,
      sender: payload.sender,
      message: text,
      provider: "telegram",
      botToken: token,
    });

    if (builderHandled) {
      return ok({ builder: true }, "Permintaan pembuatan otomasi diproses");
    }

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
