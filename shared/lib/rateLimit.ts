import { getRedisClient } from "@/shared/lib/redis";

/**
 * Rate limiter sliding-window berbasis Redis sorted-set.
 *
 * Setiap permintaan dicatat sebagai anggota sorted-set dengan skor = timestamp.
 * Anggota yang lebih tua dari jendela waktu dihapus, lalu sisa anggota dihitung.
 * Jika melebihi batas, permintaan ditolak.
 *
 * Bersifat fail-open: bila Redis tidak tersedia, permintaan tetap diizinkan
 * agar gangguan cache tidak menjatuhkan aplikasi.
 *
 * Server-only module.
 */

interface RateLimitResult {
  success: boolean;
  remaining: number;
}

/**
 * Membaca IP klien dari header proxy (Vercel/Cloudflare) dengan fallback aman.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "127.0.0.1";
  }

  return request.headers.get("x-real-ip") || "127.0.0.1";
}

/**
 * Membatasi `identifier` menjadi maksimal `limit` aksi dalam `windowSeconds`.
 */
export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const redisClient = await getRedisClient();

    if (!redisClient.isOpen) {
      return { success: true, remaining: limit };
    }

    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    const key = `ratelimit:${identifier}`;

    const multi = redisClient.multi();

    multi.zRemRangeByScore(key, 0, windowStart);
    multi.zAdd(key, { score: now, value: `${now}-${Math.random()}` });
    multi.zCard(key);
    multi.expire(key, windowSeconds);

    const results = await multi.exec();

    const count = Number(results?.[2] ?? 0);

    return { success: count <= limit, remaining: Math.max(0, limit - count) };
  } catch (error) {
    console.warn(
      "[rateLimit] check failed:",
      error instanceof Error ? error.message : String(error),
    );

    return { success: true, remaining: limit };
  }
}
