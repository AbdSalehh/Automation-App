import { Client } from "@upstash/qstash";

/**
 * Returns a configured QStash client. Server-only.
 *
 * Requires a full-access QSTASH_TOKEN (read-only tokens cannot create or
 * manage schedules). QSTASH_URL is optional and defaults to the public API.
 */
export function getQStashClient(): Client {
  const token = process.env.QSTASH_TOKEN;

  if (!token) {
    throw new Error("QSTASH_TOKEN belum diset di environment");
  }

  return new Client({
    token,
    baseUrl: process.env.QSTASH_URL,
  });
}
