import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

const mockGetClaps = vi.hoisted(() => vi.fn());
const mockGetSourceUrl = vi.hoisted(() => vi.fn());

vi.mock("../services/clapService.js", () => ({
  getClaps: mockGetClaps,
}));

vi.mock("../lib/util.js", () => ({
  getSourceUrl: mockGetSourceUrl,
}));

import router from "./getClaps.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(router);
  return app;
}

describe("GET /get-claps", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 0 when no referer and no url param", async () => {
    const res = await request(createApp()).get("/get-claps");
    expect(res.status).toBe(200);
    expect(res.body).toBe(0);
    expect(mockGetClaps).not.toHaveBeenCalled();
  });

  it("returns clap count for valid referer", async () => {
    mockGetSourceUrl.mockReturnValue("foo.com");
    mockGetClaps.mockResolvedValue(42);

    const res = await request(createApp())
      .get("/get-claps")
      .set("Referer", "http://foo.com");

    expect(res.status).toBe(200);
    expect(res.body).toBe(42);
  });

  it("returns clap count for url query param", async () => {
    mockGetSourceUrl.mockReturnValue("bar.com");
    mockGetClaps.mockResolvedValue(10);

    const res = await request(createApp())
      .get("/get-claps?url=bar.com");

    expect(res.status).toBe(200);
    expect(res.body).toBe(10);
  });

  it("returns 400 when getSourceUrl throws", async () => {
    mockGetSourceUrl.mockImplementation(() => {
      throw new Error("bad url");
    });

    const res = await request(createApp())
      .get("/get-claps")
      .set("Referer", "bad");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid request" });
  });

  it("returns 400 when getClaps rejects", async () => {
    mockGetSourceUrl.mockReturnValue("foo.com");
    mockGetClaps.mockRejectedValue(new Error("redis down"));

    const res = await request(createApp())
      .get("/get-claps")
      .set("Referer", "http://foo.com");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid request" });
  });
});
