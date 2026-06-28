import { requestExternal } from "@/shared/server/httpClient";
import { resolveTemplate } from "@/shared/server/templating";
import type { NodeHandler } from "../types";
import { toItems } from "../utils";

/**
 * Slack Send — mengirim pesan ke channel Slack lewat Incoming Webhook URL.
 *
 * Config:
 *   - webhookUrl: URL Incoming Webhook Slack (mendukung {{template}}).
 *   - text: isi pesan (mendukung {{template}}).
 */
export const slackSendHandler: NodeHandler = async ({ input, config }) => {
  const items = toItems(input);
  const itemsToSend = items.length > 0 ? items : [{}];

  const webhookUrl = String(config.webhookUrl ?? "").trim();

  if (!webhookUrl) {
    throw new Error("Slack: webhookUrl is required");
  }

  let sent = 0;

  for (const item of itemsToSend) {
    const text = resolveTemplate(String(config.text ?? ""), item);

    const response = await requestExternal(resolveTemplate(webhookUrl, item), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: { text },
    });

    if (!response.ok) {
      throw new Error("Slack: failed to send the message");
    }

    sent += 1;
  }

  return { sent };
};
