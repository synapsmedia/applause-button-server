import { describe, it, expect } from "vitest";
import express from "express";
import request from "supertest";
import router from "./home.js";

function createApp() {
  const app = express();
  app.use(router);
  return app;
}

describe("GET /", () => {
  it("returns HTML content", async () => {
    const res = await request(createApp()).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
  });

  it("contains the applause button demo", async () => {
    const res = await request(createApp()).get("/");
    expect(res.text).toContain("Applause Button Server");
    expect(res.text).toContain("applause-button");
    expect(res.text).toContain("applause-button.com");
  });

  it("includes the current host in the api URL", async () => {
    const res = await request(createApp())
      .get("/")
      .set("Host", "applause.synaps.media");
    expect(res.text).toContain("applause.synaps.media");
  });

  it("falls back to localhost:3000 when host header is missing", async () => {
    const app = express();
    app.use((req, _res, next) => {
      // Override req.get to simulate missing host
      req.get = () => undefined as any;
      next();
    });
    app.use(router);

    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain("localhost:3000");
  });
});
