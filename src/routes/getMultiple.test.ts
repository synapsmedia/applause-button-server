import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

const mockGetMultipleClaps = vi.hoisted(() => vi.fn());

vi.mock("../services/clapService.js", () => ({
  getMultipleClaps: mockGetMultipleClaps,
}));

import router from "./getMultiple.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

describe("POST /get-multiple", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns clap counts for valid URL array", async () => {
    mockGetMultipleClaps.mockResolvedValue([
      { url: "google.com", claps: 10 },
      { url: "microsoft.com", claps: 20 },
    ]);

    const res = await request(createApp())
      .post("/get-multiple")
      .send(["google.com", "microsoft.com"]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { url: "google.com", claps: 10 },
      { url: "microsoft.com", claps: 20 },
    ]);
  });

  it("returns empty array for empty input", async () => {
    const res = await request(createApp())
      .post("/get-multiple")
      .send([]);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(mockGetMultipleClaps).not.toHaveBeenCalled();
  });

  it("returns 400 for non-array body", async () => {
    const res = await request(createApp())
      .post("/get-multiple")
      .send("not-an-array");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Request body must be an array of URLs" });
  });

  it("returns 400 for object body", async () => {
    const res = await request(createApp())
      .post("/get-multiple")
      .send({ url: "foo.com" });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Request body must be an array of URLs" });
  });

  it("returns 400 when getMultipleClaps rejects", async () => {
    mockGetMultipleClaps.mockRejectedValue(new Error("redis down"));

    const res = await request(createApp())
      .post("/get-multiple")
      .send(["foo.com"]);

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid request" });
  });
});
