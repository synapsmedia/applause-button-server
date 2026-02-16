import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import router from "./health.js";

function createApp() {
  const app = express();
  app.use(router);
  return app;
}

describe("GET /health", () => {
  it("returns status ok", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
