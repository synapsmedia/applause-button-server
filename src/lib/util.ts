import type { Request } from "express";

export function normalizeUrl(url: string): string {
  url = url.replace(/^https?:\/\//, "");
  const idx = url.indexOf("?");
  if (idx !== -1) {
    url = url.substring(0, idx);
  }
  return url;
}

export function clamp(value: number, lower: number, upper: number): number {
  return Math.max(lower, Math.min(value, upper));
}

export function unique(items: string[]): string[] {
  return [...new Set(items)];
}

export function getSourceUrl(req: Request): string {
  const urlParam = req.query.url;
  if (typeof urlParam === "string" && urlParam.length > 0) {
    return normalizeUrl(urlParam);
  }

  const referer = req.headers.referer;
  if (typeof referer === "string" && referer.length > 0) {
    return normalizeUrl(referer);
  }

  throw new Error("no referer or url specified");
}
