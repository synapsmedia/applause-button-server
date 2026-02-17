import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedis = vi.hoisted(() => ({
  hget: vi.fn(),
  hincrby: vi.fn(),
  sismember: vi.fn(),
  sadd: vi.fn(),
  expire: vi.fn(),
  pipeline: vi.fn(),
}));

vi.mock("../lib/redis.js", () => ({
  redis: mockRedis,
}));

import { getClaps, updateClaps, getMultipleClaps } from "./clapService.js";

describe("getClaps", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns clap count for existing URL", async () => {
    mockRedis.hget.mockResolvedValue("42");
    expect(await getClaps("foo.com")).toBe(42);
    expect(mockRedis.hget).toHaveBeenCalledWith("applause:foo.com", "claps");
  });

  it("returns 0 for unknown URL", async () => {
    mockRedis.hget.mockResolvedValue(null);
    expect(await getClaps("unknown.com")).toBe(0);
  });
});

describe("updateClaps", () => {
  beforeEach(() => vi.clearAllMocks());

  it("increments claps for new IP", async () => {
    mockRedis.sismember.mockResolvedValue(0);
    mockRedis.hincrby.mockResolvedValue(5);
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);

    expect(await updateClaps("foo.com", 5, "1.2.3.4")).toBe(5);
    expect(mockRedis.hincrby).toHaveBeenCalledWith("applause:foo.com", "claps", 5);
    expect(mockRedis.sadd).toHaveBeenCalledWith("applause:ips:foo.com", expect.any(String));
    expect(mockRedis.expire).toHaveBeenCalledWith("applause:ips:foo.com", 86400);
  });

  it("stores hashed IP, not raw IP", async () => {
    mockRedis.sismember.mockResolvedValue(0);
    mockRedis.hincrby.mockResolvedValue(5);
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);

    await updateClaps("foo.com", 5, "1.2.3.4");
    const storedHash = mockRedis.sadd.mock.calls[0][1];
    expect(storedHash).not.toBe("1.2.3.4");
    expect(storedHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("blocks duplicate claps from same IP", async () => {
    mockRedis.sismember.mockResolvedValue(1);
    mockRedis.hget.mockResolvedValue("10");

    expect(await updateClaps("foo.com", 5, "1.2.3.4")).toBe(10);
    expect(mockRedis.hincrby).not.toHaveBeenCalled();
    expect(mockRedis.sadd).not.toHaveBeenCalled();
  });

  it("returns 0 when same IP and no claps stored", async () => {
    mockRedis.sismember.mockResolvedValue(1);
    mockRedis.hget.mockResolvedValue(null);

    expect(await updateClaps("foo.com", 5, "1.2.3.4")).toBe(0);
  });

  it("allows claps from different IP", async () => {
    mockRedis.sismember.mockResolvedValue(0);
    mockRedis.hincrby.mockResolvedValue(15);
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);

    expect(await updateClaps("foo.com", 5, "5.6.7.8")).toBe(15);
    expect(mockRedis.hincrby).toHaveBeenCalled();
  });

  it("clamps clap increment to max 10", async () => {
    mockRedis.sismember.mockResolvedValue(0);
    mockRedis.hincrby.mockResolvedValue(10);
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);

    await updateClaps("foo.com", 100, "1.2.3.4");
    expect(mockRedis.hincrby).toHaveBeenCalledWith("applause:foo.com", "claps", 10);
  });

  it("clamps negative values to 1", async () => {
    mockRedis.sismember.mockResolvedValue(0);
    mockRedis.hincrby.mockResolvedValue(1);
    mockRedis.sadd.mockResolvedValue(1);
    mockRedis.expire.mockResolvedValue(1);

    await updateClaps("foo.com", -5, "1.2.3.4");
    expect(mockRedis.hincrby).toHaveBeenCalledWith("applause:foo.com", "claps", 1);
  });
});

describe("getMultipleClaps", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns clap counts for multiple URLs", async () => {
    const mockPipeline = {
      hget: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([
        [null, "10"],
        [null, "20"],
      ]),
    };
    mockRedis.pipeline.mockReturnValue(mockPipeline);

    const result = await getMultipleClaps(["google.com", "microsoft.com"]);
    expect(result).toEqual([
      { url: "google.com", claps: 10 },
      { url: "microsoft.com", claps: 20 },
    ]);
  });

  it("returns empty array for empty input", async () => {
    expect(await getMultipleClaps([])).toEqual([]);
  });

  it("deduplicates URLs", async () => {
    const mockPipeline = {
      hget: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, "10"]]),
    };
    mockRedis.pipeline.mockReturnValue(mockPipeline);

    const result = await getMultipleClaps(["google.com", "google.com"]);
    expect(result).toHaveLength(1);
  });

  it("normalizes URLs", async () => {
    const mockPipeline = {
      hget: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, "10"]]),
    };
    mockRedis.pipeline.mockReturnValue(mockPipeline);

    const result = await getMultipleClaps(["http://google.com"]);
    expect(result[0].url).toBe("google.com");
  });

  it("limits to 100 URLs", async () => {
    const urls = Array.from({ length: 200 }, (_, i) => `site${i}.com`);
    const mockPipeline = {
      hget: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(
        Array.from({ length: 100 }, () => [null, "0"]),
      ),
    };
    mockRedis.pipeline.mockReturnValue(mockPipeline);

    const result = await getMultipleClaps(urls);
    expect(result).toHaveLength(100);
  });

  it("returns 0 for URLs with null pipeline results", async () => {
    const mockPipeline = {
      hget: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([[null, null]]),
    };
    mockRedis.pipeline.mockReturnValue(mockPipeline);

    const result = await getMultipleClaps(["foo.com"]);
    expect(result).toEqual([{ url: "foo.com", claps: 0 }]);
  });

  it("handles null exec result", async () => {
    const mockPipeline = {
      hget: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue(null),
    };
    mockRedis.pipeline.mockReturnValue(mockPipeline);

    const result = await getMultipleClaps(["foo.com"]);
    expect(result).toEqual([{ url: "foo.com", claps: 0 }]);
  });
});
