import express from "express";
import cors from "cors";
import { redis } from "./lib/redis.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import homeRouter from "./routes/home.js";
import healthRouter from "./routes/health.js";
import getClapsRouter from "./routes/getClaps.js";
import updateClapsRouter from "./routes/updateClaps.js";
import getMultipleRouter from "./routes/getMultiple.js";

const app = express();
const PORT = parseInt(process.env.PORT || "3000", 10);
const TRUST_PROXY = process.env.TRUST_PROXY || "1";

app.set("trust proxy", TRUST_PROXY === "true" || parseInt(TRUST_PROXY, 10) || TRUST_PROXY);

const corsOrigin = process.env.CORS_ORIGIN || "*";
const origin = corsOrigin === "*" ? "*" : corsOrigin.split(",").map((s) => s.trim());

app.use(cors({ origin }));
app.use(express.json());
app.use(express.text());
app.use(rateLimiter);

app.use(homeRouter);
app.use(healthRouter);
app.use(getClapsRouter);
app.use(updateClapsRouter);
app.use(getMultipleRouter);

const server = app.listen(PORT, () => {
  console.log(`Applause Button Server listening on port ${PORT}`);
});

function shutdown() {
  console.log("Shutting down...");
  server.close(() => {
    redis.disconnect();
    console.log("Server closed");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forced shutdown after timeout");
    process.exit(1);
  }, 5000);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
