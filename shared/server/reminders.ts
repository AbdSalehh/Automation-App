import { getRedisClient } from "@/shared/lib/redis";

/**
 * Redis-backed reminder scheduling for delayed WhatsApp sends with auto-cancel.
 *
 * Scenario: a workflow runs on a schedule (e.g. every few minutes). When a row
 * first matches the send condition (e.g. Pembayaran = "Belum Dibayar") we don't
 * send immediately — we register a pending reminder due after N minutes. On a
 * later run:
 *   - if the reminder is due AND the row still matches  -> send, then clear
 *   - if the row no longer matches (changed to "Dibayar") -> cancel
 *
 * Cancellation works because each run computes the set of currently-matching
 * rows; any previously-pending row missing from that set is dropped.
 *
 * All operations degrade gracefully: if Redis is unavailable, callers fall back
 * to sending immediately.
 *
 * Server-only module.
 */

export interface PendingReminder {
  dueAt: number;
  target: string;
  message: string;
}

function reminderKey(scope: string, rowKey: string): string {
  return `reminder:${scope}:${rowKey}`;
}

function indexKey(scope: string): string {
  return `reminder:index:${scope}`;
}

/**
 * Registers a reminder for a row if one doesn't exist yet. Returns the stored
 * reminder (existing or newly created). Returns null when Redis is unavailable.
 */
export async function upsertReminder(
  scope: string,
  rowKey: string,
  reminder: PendingReminder,
): Promise<PendingReminder | null> {
  try {
    const redisClient = await getRedisClient();

    if (!redisClient.isOpen) {
      return null;
    }

    const key = reminderKey(scope, rowKey);
    const existing = await redisClient.get(key);

    if (existing) {
      return JSON.parse(existing) as PendingReminder;
    }

    // 7-day TTL guards against orphaned keys if a workflow is deleted.
    await redisClient.setEx(key, 7 * 24 * 60 * 60, JSON.stringify(reminder));
    await redisClient.sAdd(indexKey(scope), rowKey);

    return reminder;
  } catch {
    return null;
  }
}

/** Removes a reminder (after it fires or is cancelled). */
export async function clearReminder(
  scope: string,
  rowKey: string,
): Promise<void> {
  try {
    const redisClient = await getRedisClient();

    if (!redisClient.isOpen) {
      return;
    }

    await redisClient.del(reminderKey(scope, rowKey));
    await redisClient.sRem(indexKey(scope), rowKey);
  } catch {
    // best-effort
  }
}

/** Returns all pending row keys for a scope. */
export async function listReminderKeys(scope: string): Promise<string[]> {
  try {
    const redisClient = await getRedisClient();

    if (!redisClient.isOpen) {
      return [];
    }

    return await redisClient.sMembers(indexKey(scope));
  } catch {
    return [];
  }
}
