import { requestExternal } from "@/shared/server/httpClient";
import { resolveTemplate } from "@/shared/server/templating";
import type { Item } from "../types";

/**
 * Node HTTP Request generik. Diekspor sebagai handler biasa.
 */
export async function httpRequestHandler({
  input,
  config,
}: {
  input: unknown;
  config: Record<string, unknown>;
}): Promise<unknown> {
  const requestUrl = resolveTemplate(
    String(config.url ?? ""),
    (input as Item) ?? {},
  );
  const requestMethod = String(config.method ?? "GET").toUpperCase();

  if (!requestUrl) {
    throw new Error("HTTP Request: url kosong");
  }

  const isBodyless = requestMethod === "GET" || requestMethod === "HEAD";

  const response = await requestExternal(requestUrl, {
    method: requestMethod,
    headers: { "Content-Type": "application/json" },
    data: isBodyless ? undefined : (config.body ?? input ?? {}),
  });

  return { status: response.status, body: response.body };
}
