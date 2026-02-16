import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../lib/redis.js";

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
const max = parseInt(process.env.RATE_LIMIT_MAX || "100", 10);

export const rateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) =>
      redis.call(args[0], ...args.slice(1)) as never,
  }),
  message: { error: "Too many requests, please try again later." },
});
