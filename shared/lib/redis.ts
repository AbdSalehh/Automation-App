import { createClient, type RedisClientType } from "redis";

const globalForRedis = globalThis as unknown as {
  redisClient: RedisClientType | undefined;
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
    },
  });

  client.on("error", (error: any) => {
    console.warn("[redis] connection error:", error.message);
  });

  client.on("connect", () => {
    console.log("[redis] connected successfully");
  });

  return client;
}

let redisClientInstance: RedisClientType;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClientInstance) {
    redisClientInstance = createRedisClient();

    if (!redisClientInstance.isOpen) {
      await redisClientInstance.connect();
    }
  }

  return redisClientInstance;
}

/**
 * Disconnect the Redis client (useful for cleanup in serverless environments).
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClientInstance?.isOpen) {
    await redisClientInstance.quit();
  }
}

// Cache the instance on globalThis in development to survive hot-reload
if (process.env.NODE_ENV !== "production") {
  if (!globalForRedis.redisClient) {
    globalForRedis.redisClient = undefined; // Will be initialized on first call
  }
}
