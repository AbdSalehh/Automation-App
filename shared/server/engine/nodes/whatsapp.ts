import { requestExternal } from "@/shared/server/httpClient";
import { baileysClient } from "@/shared/api/baileysClient";
import { resolveTemplate } from "@/shared/server/templating";
import {
  upsertReminder,
  clearReminder,
  listReminderKeys,
} from "@/shared/server/reminders";
import type { WhatsAppProvider } from "@/entities/workflow/model/node.model";
import type { Item, NodeHandler } from "../types";
import { loadCredential } from "../credentials";
import { resolveActionItems, sleep } from "../utils";

/**
 * Sends a WhatsApp message via the Meta WhatsApp Business Cloud API.
 */
async function sendMeta(
  credential: Record<string, string>,
  target: string,
  message: string,
): Promise<Record<string, unknown>> {
  const to = target.replace(/\D/g, "");

  const response = await requestExternal(
    `https://graph.facebook.com/v20.0/${credential.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential.accessToken}`,
        "Content-Type": "application/json",
      },
      data: {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: message },
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `WhatsApp Meta: gagal mengirim ke ${target} (status ${response.status})`,
    );
  }

  return { provider: "meta", messageId: null, raw: response.body };
}

/**
 * Sends a WhatsApp message via the self-hosted Baileys service (Express),
 * memakai sesi multi-login milik `sessionId` (id user pemilik workflow).
 * Auth & target service URL come from env (BAILEYS_API_BASE_URL / API key),
 * so no per-user credential is required.
 */
async function sendBaileys(
  sessionId: string,
  target: string,
  message: string,
): Promise<Record<string, unknown>> {
  const cleanTarget = target.includes("@") ? target : target.replace(/\D/g, "");

  const { data: response } = await baileysClient.post<{
    success: boolean;
    message: string;
    data: { messageId: string | null } | null;
  }>(`/sessions/${sessionId}/send-message`, {
    target: cleanTarget,
    message,
  });

  if (!response.success) {
    throw new Error(
      `WhatsApp Baileys: ${response.message ?? "gagal mengirim pesan"}`,
    );
  }

  const messageId = response.data?.messageId ?? null;

  return { provider: "baileys", messageId, raw: response };
}

/**
 * Provider dispatcher used by the unified `whatsapp_send` node. Routes the
 * send to Meta or the self-hosted Baileys service based on the selected
 * provider.
 */
export async function sendWhatsApp(
  provider: WhatsAppProvider,
  credential: Record<string, string>,
  target: string,
  message: string,
  countryCode: string,
  sessionId: string,
): Promise<Record<string, unknown>> {
  if (provider === "meta") {
    return sendMeta(credential, target, message);
  }

  return sendBaileys(sessionId, target, message);
}

/**
 * Validates that the selected provider has the credential fields it needs.
 */
function assertWhatsAppCredential(
  provider: WhatsAppProvider,
  credential: Record<string, string> | null,
): asserts credential is Record<string, string> {
  /**
   * Baileys memakai konfigurasi dari env (URL service + API key), bukan
   * kredensial per-user, jadi tidak ada field yang perlu divalidasi di sini.
   */
  if (provider === "baileys") {
    return;
  }

  if (
    provider === "meta" &&
    (!credential?.accessToken || !credential?.phoneNumberId)
  ) {
    throw new Error("WhatsApp Meta: kredensial tidak lengkap");
  }
}

/**
 * Incoming WhatsApp reply. The provider webhook seeds triggerPayload with
 * { sender, message, ... }. Expose it as a single-item collection so downstream
 * condition/update nodes can use {{sender}}, {{message}}.
 */
export const whatsappTriggerHandler: NodeHandler = async ({ context }) => {
  const payload = (context.triggerPayload ?? {}) as Record<string, unknown>;

  /**
   * Waktu balasan terformat (lokal Asia/Jakarta) agar template tulis bisa
   * mencatat kapan target membalas, mis. "{{message}} ({{__replyAt}})".
   * Selaras dengan jalur `wait_reply` di `resumeWorkflow`.
   */
  const replyAt = new Date().toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const enrichedRow = {
    ...payload,
    reply: payload.message,
    __replyAt: replyAt,
  };

  return { rows: [enrichedRow], ...enrichedRow };
};

/** Unified WhatsApp send node — immediate or delayed-reminder mode. */
export const whatsappSendHandler: NodeHandler = async ({
  node,
  input,
  context,
  config,
}) => {
  const provider = String(config.provider ?? "baileys") as WhatsAppProvider;

  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  assertWhatsAppCredential(provider, credential);

  const { items, isCollection } = resolveActionItems(input);
  const countryCode = String(config.countryCode ?? "62");
  const targetField = String(config.targetField ?? "").trim();
  const messageTemplate = String(config.message ?? config.text ?? "");

  /**
   * Jeda antrian antar pengiriman (detik). Mencegah banyak nomor terkirim di
   * detik yang sama. Default 2 detik bila tidak diatur.
   */
  const sendDelaySeconds = Number(config.sendDelaySeconds ?? 2);

  /** If an upstream collection is empty, there's nothing to send. */
  if (isCollection && items.length === 0) {
    return { sent: 0, results: [], rows: [] };
  }

  const resolveTarget = (item: Item): string =>
    resolveTemplate(String(config.target ?? config.to ?? ""), item) ||
    (targetField
      ? String(item[targetField] ?? item[targetField + " "] ?? "")
      : "") ||
    String(item.phone ?? item.nomor ?? item.Nomor ?? "");

  /**
   * Delayed reminder mode with auto-cancel.
   *
   * When reminderDelayMinutes > 0, matching rows are not sent immediately.
   * Each row registers a pending reminder (due = now + delay). On a later run
   * we only send rows whose reminder is due. Rows that stopped matching the
   * upstream condition disappear from `items`, so we cancel them.
   */
  const reminderDelayMinutes = Number(config.reminderDelayMinutes ?? 0);
  const reminderScope = `${context.workflowId}:${node.id}`;

  if (reminderDelayMinutes > 0) {
    const now = Date.now();
    const dueOffsetMs = reminderDelayMinutes * 60_000;

    const currentRowKeys = new Set<string>();

    const results: Array<{
      target: string;
      ok: boolean;
      messageId: unknown;
      status: string;
    }> = [];

    const enrichedRows: Item[] = [];

    for (const item of items) {
      const target = resolveTarget(item);

      if (!target) {
        continue;
      }

      const rowKey = String(item.__rowNumber ?? target);
      currentRowKeys.add(rowKey);

      const message = messageTemplate
        ? resolveTemplate(messageTemplate, item)
        : JSON.stringify(item);

      const reminder = await upsertReminder(reminderScope, rowKey, {
        dueAt: now + dueOffsetMs,
        target,
        message,
      });

      /** Redis unavailable -> fall back to immediate send. */
      if (!reminder) {
        const sendResult = await sendWhatsApp(
          provider,
          credential,
          target,
          message,
          countryCode,
          context.ownerId,
        );

        results.push({
          target,
          ok: true,
          messageId: sendResult.messageId,
          status: "sent_immediate",
        });

        enrichedRows.push({
          ...item,
          __waTarget: target,
          __waMessageId: sendResult.messageId,
          __waSentAt: new Date().toISOString(),
        });
        continue;
      }

      if (now >= reminder.dueAt) {
        const sendResult = await sendWhatsApp(
          provider,
          credential,
          target,
          reminder.message,
          countryCode,
          context.ownerId,
        );

        await clearReminder(reminderScope, rowKey);

        results.push({
          target,
          ok: true,
          messageId: sendResult.messageId,
          status: "sent",
        });

        enrichedRows.push({
          ...item,
          __waTarget: target,
          __waMessageId: sendResult.messageId,
          __waSentAt: new Date().toISOString(),
        });
      } else {
        const minutesLeft = Math.ceil((reminder.dueAt - now) / 60_000);

        results.push({
          target,
          ok: true,
          messageId: null,
          status: `pending_${minutesLeft}m`,
        });
      }
    }

    const pendingKeys = await listReminderKeys(reminderScope);
    let cancelled = 0;

    for (const pendingKey of pendingKeys) {
      if (!currentRowKeys.has(pendingKey)) {
        await clearReminder(reminderScope, pendingKey);
        cancelled += 1;
      }
    }

    const sentCount = results.filter(
      (result) =>
        result.status === "sent" || result.status === "sent_immediate",
    ).length;

    return {
      sent: sentCount,
      pending: results.filter((result) => result.status.startsWith("pending"))
        .length,
      cancelled,
      results,
      rows: enrichedRows,
    };
  }

  /** Immediate send mode (default). */
  const results: Array<{
    target: string;
    ok: boolean;
    messageId: unknown;
  }> = [];

  const enrichedRows: Item[] = [];

  let sentIndex = 0;

  for (const item of items) {
    const target = resolveTarget(item);

    if (!target) {
      results.push({
        target: "(tidak ada nomor)",
        ok: false,
        messageId: null,
      });
      continue;
    }

    const message = messageTemplate
      ? resolveTemplate(messageTemplate, item)
      : JSON.stringify(item);

    /**
     * Antrian: beri jeda sebelum pengiriman kedua dan seterusnya, dengan
     * sedikit jitter agar tidak presisi di detik yang sama.
     */
    if (sentIndex > 0 && sendDelaySeconds > 0) {
      const jitterMs = Math.floor(Math.random() * 400);
      await sleep(sendDelaySeconds * 1000 + jitterMs);
    }

    sentIndex += 1;

    const sendResult = await sendWhatsApp(
      provider,
      credential,
      target,
      message,
      countryCode,
      context.ownerId,
    );

    results.push({
      target,
      ok: true,
      messageId: sendResult.messageId,
    });

    enrichedRows.push({
      ...item,
      __waTarget: target,
      __waMessageId: sendResult.messageId,
      __waSentAt: new Date().toISOString(),
    });
  }

  return { sent: results.length, results, rows: enrichedRows };
};
