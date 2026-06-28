import { requestExternal } from "@/shared/server/httpClient";
import { resolveTemplate } from "@/shared/server/templating";
import { getGoogleAccessToken } from "@/shared/server/google";
import type { NodeHandler } from "../types";
import { loadCredential } from "../credentials";
import { toItems } from "../utils";

/** Gmail send node — mengirim email memakai kredensial google_oauth. */
export const gmailSendHandler: NodeHandler = async ({
  node,
  input,
  context,
  config,
}) => {
  const credential = await loadCredential(
    node.data.credentialId,
    context.ownerId,
  );

  if (!credential) {
    throw new Error("Gmail: missing Google credential");
  }

  const accessToken = await getGoogleAccessToken(credential);

  const items = toItems(input);
  const itemsToSend = items.length > 0 ? items : [{}];
  const results: unknown[] = [];

  for (const item of itemsToSend) {
    const to = resolveTemplate(String(config.to ?? ""), item);
    const subject = resolveTemplate(String(config.subject ?? ""), item);
    const messageBody = resolveTemplate(
      String(config.body ?? config.text ?? ""),
      item,
    );

    if (!to) {
      throw new Error("Gmail: recipient (to) is empty");
    }

    /**
     * Tipe isi email. "html" mengirim sebagai text/html agar template berformat
     * tampil rapi di klien email; selain itu tetap text/plain.
     */
    const isHtml = String(config.bodyType ?? "text") === "html";

    const contentType = isHtml
      ? "text/html; charset=UTF-8"
      : "text/plain; charset=UTF-8";

    const mimeMessage = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "MIME-Version: 1.0",
      `Content-Type: ${contentType}`,
      "",
      messageBody,
    ].join("\n");

    const encodedMessage = Buffer.from(mimeMessage)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await requestExternal(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        data: { raw: encodedMessage },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Gmail: gagal mengirim ke ${to} (status ${response.status})`,
      );
    }

    results.push(response.body);
  }

  const first = results[0] as { id?: string; threadId?: string } | undefined;

  return {
    messageId: first?.id ?? null,
    threadId: first?.threadId ?? null,
    sent: results.length,
    results,
  };
};
