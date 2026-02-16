import { describe, it, expect } from "vitest";
import { normalizeUrl, clamp, unique, getSourceUrl } from "./util.js";

describe("normalizeUrl", () => {
  it("removes http://", () => {
    expect(normalizeUrl("http://foo.com")).toBe("foo.com");
  });

  it("removes https://", () => {
    expect(normalizeUrl("https://foo.com")).toBe("foo.com");
  });

  it("removes query strings", () => {
    expect(normalizeUrl("foo.com?bar=baz")).toBe("foo.com");
  });

  it("removes both protocol and query strings", () => {
    expect(normalizeUrl("https://foo.com/page?bar=baz")).toBe("foo.com/page");
  });

  it("returns plain URLs unchanged", () => {
    expect(normalizeUrl("foo.com/page")).toBe("foo.com/page");
  });
});

describe("clamp", () => {
  it("clamps to lower bound", () => {
    expect(clamp(-5, 1, 10)).toBe(1);
  });

  it("clamps to upper bound", () => {
    expect(clamp(100, 1, 10)).toBe(10);
  });

  it("returns value within range", () => {
    expect(clamp(5, 1, 10)).toBe(5);
  });
});

describe("unique", () => {
  it("removes duplicates", () => {
    expect(unique(["a", "b", "a", "c"])).toEqual(["a", "b", "c"]);
  });

  it("returns empty array for empty input", () => {
    expect(unique([])).toEqual([]);
  });
});

describe("getSourceUrl", () => {
  it("returns normalized url from query param", () => {
    const req = {
      query: { url: "http://foo.com/page?x=1" },
      headers: { referer: "http://bar.com" },
    } as any;
    expect(getSourceUrl(req)).toBe("foo.com/page");
  });

  it("returns normalized url from referer header when no query param", () => {
    const req = {
      query: {},
      headers: { referer: "https://bar.com/post?y=2" },
    } as any;
    expect(getSourceUrl(req)).toBe("bar.com/post");
  });

  it("prefers query param over referer", () => {
    const req = {
      query: { url: "foo.com" },
      headers: { referer: "bar.com" },
    } as any;
    expect(getSourceUrl(req)).toBe("foo.com");
  });

  it("throws when neither url param nor referer is present", () => {
    const req = { query: {}, headers: {} } as any;
    expect(() => getSourceUrl(req)).toThrow("no referer or url specified");
  });

  it("ignores empty string url param and falls back to referer", () => {
    const req = {
      query: { url: "" },
      headers: { referer: "baz.com" },
    } as any;
    expect(getSourceUrl(req)).toBe("baz.com");
  });

  it("ignores empty string referer", () => {
    const req = {
      query: {},
      headers: { referer: "" },
    } as any;
    expect(() => getSourceUrl(req)).toThrow("no referer or url specified");
  });

  it("ignores non-string url param", () => {
    const req = {
      query: { url: 123 },
      headers: { referer: "fallback.com" },
    } as any;
    expect(getSourceUrl(req)).toBe("fallback.com");
  });
});
