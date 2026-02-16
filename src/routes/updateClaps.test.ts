import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

const mockUpdateClaps = vi.hoisted(() => vi.fn());
const mockGetSourceUrl = vi.hoisted(() => vi.fn());

vi.mock("../services/clapService.js", () => ({
  updateClaps: mockUpdateClaps,
}));

vi.mock("../lib/util.js", () => ({
  getSourceUrl: mockGetSourceUrl,
}));

import router from "./updateClaps.js";

function createApp() {
  const app = express();
  app.use(express.json());
  app.use(express.text());
  app.use(router);
  return app;
}

describe("POST /update-claps", () => {
  beforeEach(() => vi.clearAllMocks());

  it("increments claps with numeric text body", async () => {
    mockGetSourceUrl.mockReturnValue("foo.com");
    mockUpdateClaps.mockResolvedValue(5);

    const res = await request(createApp())
      .post("/update-claps")
      .set("Referer", "http://foo.com")
      .set("Content-Type", "text/plain")
      .send("3");

    expect(res.status).toBe(200);
    expect(res.body).toBe(5);
    expect(mockUpdateClaps).toHaveBeenCalledWith("foo.com", 3, expect.any(String));
  });

  it("handles string body with comma (version format)", async () => {
    mockGetSourceUrl.mockReturnValue("foo.com");
    mockUpdateClaps.mockResolvedValue(6);

    const res = await request(createApp())
      .post("/update-claps")
      .set("Referer", "http://foo.com")
      .set("Content-Type", "text/plain")
      .send("4,3.0.0");

    expect(res.status).toBe(200);
    expect(res.body).toBe(6);
    expect(mockUpdateClaps).toHaveBeenCalledWith("foo.com", 4, expect.any(String));
  });

  it("handles numeric body (typeof number) from JSON parser", async () => {
    mockGetSourceUrl.mockReturnValue("foo.com");
    mockUpdateClaps.mockResolvedValue(8);

    const app = express();
    app.use((req, _res, next) => {
      // Simulate a pre-parsed numeric body
      req.body = 5;
      next();
    });
    app.use(router);

    const res = await request(app)
      .post("/update-claps")
      .set("Referer", "http://foo.com");

    expect(res.status).toBe(200);
    expect(res.body).toBe(8);
    expect(mockUpdateClaps).toHaveBeenCalledWith("foo.com", 5, expect.any(String));
  });

  it("handles non-string non-number body via Number() conversion", async () => {
    mockGetSourceUrl.mockReturnValue("foo.com");
    mockUpdateClaps.mockResolvedValue(1);

    const res = await request(createApp())
      .post("/update-claps")
      .set("Referer", "http://foo.com")
      .send([5]);

    expect(res.status).toBe(200);
    // Number([5]) = 5, which is integer
    expect(mockUpdateClaps).toHaveBeenCalledWith("foo.com", 5, expect.any(String));
  });

  it("defaults non-integer claps to 1", async () => {
    mockGetSourceUrl.mockReturnValue("foo.com");
    mockUpdateClaps.mockResolvedValue(1);

    const res = await request(createApp())
      .post("/update-claps")
      .set("Referer", "http://foo.com")
      .set("Content-Type", "text/plain")
      .send("3.14");

    expect(res.status).toBe(200);
    expect(mockUpdateClaps).toHaveBeenCalledWith("foo.com", 1, expect.any(String));
  });

  it("handles JSON object body by converting with Number()", async () => {
    mockGetSourceUrl.mockReturnValue("foo.com");
    mockUpdateClaps.mockResolvedValue(1);

    const res = await request(createApp())
      .post("/update-claps")
      .set("Referer", "http://foo.com")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ value: 5 }));

    expect(res.status).toBe(200);
    // Number({value:5}) is NaN, not integer → defaults to 1
    expect(mockUpdateClaps).toHaveBeenCalledWith("foo.com", 1, expect.any(String));
  });

  it("returns 400 when getSourceUrl throws", async () => {
    mockGetSourceUrl.mockImplementation(() => {
      throw new Error("no referer");
    });

    const res = await request(createApp())
      .post("/update-claps")
      .send("1");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid request" });
  });

  it("returns 400 when updateClaps rejects", async () => {
    mockGetSourceUrl.mockReturnValue("foo.com");
    mockUpdateClaps.mockRejectedValue(new Error("redis down"));

    const res = await request(createApp())
      .post("/update-claps")
      .set("Referer", "http://foo.com")
      .send("1");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "Invalid request" });
  });

  it("uses 'unknown' when req.ip is undefined", async () => {
    mockGetSourceUrl.mockReturnValue("foo.com");
    mockUpdateClaps.mockResolvedValue(1);

    const app = express();
    app.use(express.text());
    app.use((req, _res, next) => {
      Object.defineProperty(req, "ip", { value: undefined, writable: true });
      next();
    });
    app.use(router);

    const res = await request(app)
      .post("/update-claps")
      .set("Referer", "http://foo.com")
      .set("Content-Type", "text/plain")
      .send("1");

    expect(res.status).toBe(200);
    expect(mockUpdateClaps).toHaveBeenCalledWith("foo.com", 1, "unknown");
  });
});
