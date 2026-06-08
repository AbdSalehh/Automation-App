import { getRedisClient } from "@/shared/lib/redis";

/**
 * Best-effort Redis query cache helper using the official redis client.
 *
 * Caching is never required for correctness: if Redis is unavailable we
 * silently fall back to the database and the request completes normally.
 * Use {@link cacheKeys} to build consistent, namespaced keys and
 * {@link invalidateKeys} after mutations.
 *
 * Server-only module.
 */

const DEFAULT_TTL_SECONDS = 60;

export const cacheKeys = {
  workflowList: (userId: string) => `workflows:list:${userId}`,
  workflowDetail: (workflowId: string) => `workflows:detail:${workflowId}`,
  credentialList: (userId: string) => `credentials:list:${userId}`,
  executionList: (userId: string, workflowId?: string) =>
    `executions:list:${userId}:${workflowId ?? "all"}`,
};

/**
 * Returns a cached value if present, otherwise runs {@link loader}, stores
 * the result with a TTL, and returns it.
 *
 * If Redis is unavailable, silently falls back to executing the loader.
 */
export async function cacheQuery<TResult>(
  key: string,
  loader: () => Promise<TResult>,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<TResult> {
  try {
    const redisClient = await getRedisClient();

    if (redisClient.isOpen) {
      const cachedValue = await redisClient.get(key);

      if (cachedValue !== null) {
        return JSON.parse(cachedValue) as TResult;
      }
    }
  } catch (error) {
    console.warn(
      "[cache] read failed:",
      error instanceof Error ? error.message : String(error),
    );
  }

  const freshValue = await loader();

  try {
    const redisClient = await getRedisClient();

    if (redisClient.isOpen) {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(freshValue));
    }
  } catch (error) {
    console.warn(
      "[cache] write failed:",
      error instanceof Error ? error.message : String(error),
    );
  }

  return freshValue;
}

/**
 * Deletes one or more cache keys.
 * Safe to call even when Redis is down.
 */
export async function invalidateKeys(...keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }

  try {
    const redisClient = await getRedisClient();

    if (redisClient.isOpen) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.warn(
      "[cache] invalidate failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
}

/**
 * Deletes every key matching a glob pattern (e.g. "executions:list:user:*").
 * Safe to call even when Redis is down.
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  try {
    const redisClient = await getRedisClient();

    if (redisClient.isOpen) {
      const matchingKeys = await redisClient.keys(pattern);

      if (matchingKeys.length > 0) {
        await redisClient.del(matchingKeys);
      }
    }
  } catch (error) {
    console.warn(
      "[cache] pattern invalidate failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
}
