import { Redis } from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 2000);
    return delay;
  },
});

redis.on("error", (err: Error) => {
  console.error("Redis connection error:", err.message);
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});
