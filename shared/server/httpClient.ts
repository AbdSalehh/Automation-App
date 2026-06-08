import axios, { type AxiosRequestConfig } from "axios";

/**
 * Server-side Axios instance for calling external connector APIs (WhatsApp,
 * Telegram, generic HTTP, etc.). Per coding rule #5, server code must not use
 * the native fetch API directly — all outbound requests go through here.
 *
 * Server-only module.
 */
export const externalHttpClient = axios.create({
  timeout: 15000,
  // Never throw on non-2xx: connectors inspect the status themselves.
  validateStatus: () => true,
});

export interface ExternalResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

/**
 * Performs an external request and normalises the result into a small shape
 * the engine and connectors can reason about without try/catch everywhere.
 */
export async function requestExternal(
  url: string,
  config: AxiosRequestConfig = {},
): Promise<ExternalResponse> {
  const response = await externalHttpClient.request({ url, ...config });

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    body: response.data,
  };
}
