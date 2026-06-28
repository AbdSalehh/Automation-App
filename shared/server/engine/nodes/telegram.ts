import { requestExternal } from "@/shared/server/httpClient";
import { resolveTemplate } from "@/shared/server/templating";
import type { NodeHandler } from "../types";
import { loadCredential } from "../credentials";
import { toItems } from "../utils";

/** Telegram send node — mengirim pesan via Bot token (BotFather). */
export const telegramSendHandler: NodeHandler = async ({
  node,
  input,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential?.botToken) {
    if (credential?.apiId) {
      throw new Error(
        "Telegram personal numbers are not yet supported in this node — use a Telegram Bot credential (BotFather).",
      );
    }

    throw new Error("Telegram: missing credential");
  }

  const items = toItems(input);
  const results: unknown[] = [];

  const itemsToSend = items.length > 0 ? items : [{}];

  for (const item of itemsToSend) {
    const text = resolveTemplate(String(config.text ?? ""), item);
    const chatId = resolveTemplate(String(config.chatId ?? ""), item);

    const response = await requestExternal(
      `https://api.telegram.org/bot${credential.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: { chat_id: chatId, text },
      },
    );

    if (!response.ok) {
      throw new Error("Telegram: failed to send the message");
    }

    results.push(response.body);
  }

  return { sent: results.length, results };
};

/**
 * Pesan/balasan Telegram masuk. Webhook men-seed triggerPayload dengan
 * { sender, message, ... }. Ekspos sebagai satu item collection agar node
 * berikutnya bisa memakai {{sender}}, {{message}}.
 */
export const telegramTriggerHandler: NodeHandler = async ({ context }) => {
  const payload = (context.triggerPayload ?? {}) as Record<string, unknown>;

  const enrichedRow = {
    ...payload,
    reply: payload.message,
  };

  return { rows: [enrichedRow], ...enrichedRow };
};
