import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRedis = vi.hoisted(() => ({
  hget: vi.fn(),
  hset: vi.fn(),
  hincrby: vi.fn(),
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
    mockRedis.hget.mockResolvedValue(null);
    mockRedis.hincrby.mockResolvedValue(5);
    mockRedis.hset.mockResolvedValue("OK");

    expect(await updateClaps("foo.com", 5, "1.2.3.4")).toBe(5);
    expect(mockRedis.hincrby).toHaveBeenCalledWith("applause:foo.com", "claps", 5);
    expect(mockRedis.hset).toHaveBeenCalledWith("applause:foo.com", "lastIp", "1.2.3.4");
  });

  it("blocks duplicate claps from same IP", async () => {
    mockRedis.hget
      .mockResolvedValueOnce("1.2.3.4") // lastIp
      .mockResolvedValueOnce("10"); // current claps

    expect(await updateClaps("foo.com", 5, "1.2.3.4")).toBe(10);
    expect(mockRedis.hincrby).not.toHaveBeenCalled();
  });

  it("returns 0 when same IP and no claps stored", async () => {
    mockRedis.hget
      .mockResolvedValueOnce("1.2.3.4") // lastIp
      .mockResolvedValueOnce(null); // no claps

    expect(await updateClaps("foo.com", 5, "1.2.3.4")).toBe(0);
  });

  it("allows claps from different IP", async () => {
    mockRedis.hget.mockResolvedValueOnce("1.2.3.4");
    mockRedis.hincrby.mockResolvedValue(15);
    mockRedis.hset.mockResolvedValue("OK");

    expect(await updateClaps("foo.com", 5, "5.6.7.8")).toBe(15);
    expect(mockRedis.hincrby).toHaveBeenCalled();
  });

  it("clamps clap increment to max 10", async () => {
    mockRedis.hget.mockResolvedValue(null);
    mockRedis.hincrby.mockResolvedValue(10);
    mockRedis.hset.mockResolvedValue("OK");

    await updateClaps("foo.com", 100, "1.2.3.4");
    expect(mockRedis.hincrby).toHaveBeenCalledWith("applause:foo.com", "claps", 10);
  });

  it("clamps negative values to 1", async () => {
    mockRedis.hget.mockResolvedValue(null);
    mockRedis.hincrby.mockResolvedValue(1);
    mockRedis.hset.mockResolvedValue("OK");

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
