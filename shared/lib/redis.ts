import { createClient, type RedisClientType } from "redis";

/**
 * Klien Redis singleton yang aman untuk lingkungan serverless (Vercel).
 *
 * Di serverless setiap invocation dapat membuat koneksi baru sehingga jumlah
 * klien cepat habis ("max number of clients reached"). Untuk mencegahnya:
 *  - Instance di-cache di `globalThis` agar dipakai ulang lintas invocation
 *    pada lambda yang sama, termasuk di produksi.
 *  - Sebuah promise koneksi tunggal mencegah pembukaan banyak koneksi sekaligus
 *    dalam satu invocation (thundering herd).
 *  - `connect()` dibatasi timeout dan `reconnectStrategy` dibatasi agar tidak
 *    menggantung saat Redis penuh; ini penyebab utama 504 Vercel Runtime
 *    Timeout.
 *
 * Bersifat fail-open: konsumen menangani kegagalan dengan melanjutkan tanpa
 * cache/rate-limit.
 */

const CONNECT_TIMEOUT_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 2;

const globalForRedis = globalThis as unknown as {
  redisClient?: RedisClientType;
  redisConnectPromise?: Promise<RedisClientType> | null;
};

function createRedisClient(): RedisClientType {
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT
    ? parseInt(process.env.REDIS_PORT, 10)
    : 6379;
  const redisUsername = process.env.REDIS_USERNAME || "default";
  const redisPassword = process.env.REDIS_PASSWORD;

  if (!redisHost || !redisPassword) {
    throw new Error(
      "REDIS_HOST and REDIS_PASSWORD environment variables are required",
    );
  }

  const client = createClient({
    username: redisUsername,
    password: redisPassword,
    socket: {
      host: redisHost,
      port: redisPort,
      connectTimeout: CONNECT_TIMEOUT_MS,
      /**
       * Batasi percobaan reconnect agar koneksi tidak menggantung selamanya
       * ketika Redis menolak (mis. kuota klien penuh). Setelah batas tercapai,
       * kembalikan Error agar promise connect ditolak dan konsumen fail-open.
       */
      reconnectStrategy: (retries) => {
        if (retries >= MAX_RECONNECT_ATTEMPTS) {
          return new Error("Redis: batas percobaan reconnect tercapai");
        }

        return Math.min(retries * 200, 1000);
      },
    },
  });

  client.on("error", (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[redis] connection error:", message);
  });

  return client;
}

/**
 * Mengembalikan klien Redis yang sudah terhubung. Bila koneksi gagal atau
 * melewati batas waktu, instance dibuang dan error dilempar agar pemanggil
 * dapat melanjutkan tanpa Redis (fail-open).
 */
export async function getRedisClient(): Promise<RedisClientType> {
  const existingClient = globalForRedis.redisClient;

  if (existingClient?.isOpen) {
    return existingClient;
  }

  if (globalForRedis.redisConnectPromise) {
    return globalForRedis.redisConnectPromise;
  }

  const client = existingClient ?? createRedisClient();
  globalForRedis.redisClient = client;

  const connectPromise = (async () => {
    try {
      if (!client.isOpen) {
        await Promise.race([
          client.connect(),
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Redis: connect timeout")),
              CONNECT_TIMEOUT_MS,
            ),
          ),
        ]);
      }

      return client;
    } catch (error) {
      /** Bersihkan koneksi gagal agar percobaan berikutnya mulai dari awal. */
      try {
        await client.disconnect();
      } catch {
        /** Abaikan; koneksi memang tidak sehat. */
      }

      globalForRedis.redisClient = undefined;

      throw error;
    } finally {
      globalForRedis.redisConnectPromise = null;
    }
  })();

  globalForRedis.redisConnectPromise = connectPromise;

  return connectPromise;
}

/**
 * Memutus koneksi Redis (berguna untuk cleanup di lingkungan serverless).
 */
export async function disconnectRedis(): Promise<void> {
  const client = globalForRedis.redisClient;

  if (client?.isOpen) {
    await client.quit();
  }

  globalForRedis.redisClient = undefined;
  globalForRedis.redisConnectPromise = null;
}
