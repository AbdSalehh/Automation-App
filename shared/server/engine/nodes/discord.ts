import { requestExternal } from "@/shared/server/httpClient";
import { resolveTemplate } from "@/shared/server/templating";
import type { NodeHandler } from "../types";
import { toItems } from "../utils";

/**
 * Discord Send — mengirim pesan ke channel Discord lewat Webhook URL.
 *
 * Config:
 *   - webhookUrl: URL Webhook Discord (mendukung {{template}}).
 *   - content: isi pesan (mendukung {{template}}).
 */
export const discordSendHandler: NodeHandler = async ({ input, config }) => {
  const items = toItems(input);
  const itemsToSend = items.length > 0 ? items : [{}];

  const webhookUrl = String(config.webhookUrl ?? "").trim();

  if (!webhookUrl) {
    throw new Error("Discord: webhookUrl wajib diisi");
  }

  let sent = 0;

  for (const item of itemsToSend) {
    const content = resolveTemplate(String(config.content ?? ""), item);

    const response = await requestExternal(resolveTemplate(webhookUrl, item), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      data: { content },
    });

    if (!response.ok) {
      throw new Error("Discord: gagal mengirim pesan");
    }

    sent += 1;
  }

  return { sent };
};
