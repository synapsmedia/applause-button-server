import { hash } from "node:crypto";
import { redis } from "../lib/redis.js";
import { clamp, normalizeUrl, unique } from "../lib/util.js";

const KEY_PREFIX = "applause:";

const IP_TTL_SECONDS = 86400; // 1 day

function key(url: string): string {
  return `${KEY_PREFIX}${url}`;
}

function ipSetKey(url: string): string {
  return `${KEY_PREFIX}ips:${url}`;
}

function hashIp(ip: string): string {
  return hash("sha256", ip, "hex");
}

export async function getClaps(url: string): Promise<number> {
  const claps = await redis.hget(key(url), "claps");
  return claps ? parseInt(claps, 10) : 0;
}

export async function updateClaps(
  url: string,
  clapCount: number,
  sourceIp: string,
): Promise<number> {
  const k = key(url);
  const ik = ipSetKey(url);
  const clapIncrement = clamp(clapCount, 1, 10);
  const hashedIp = hashIp(sourceIp);

  const alreadyClapped = await redis.sismember(ik, hashedIp);

  if (alreadyClapped) {
    const current = await redis.hget(k, "claps");
    return current ? parseInt(current, 10) : 0;
  }

  const newTotal = await redis.hincrby(k, "claps", clapIncrement);
  await redis.sadd(ik, hashedIp);
  await redis.expire(ik, IP_TTL_SECONDS);

  return newTotal;
}

export interface ClapEntry {
  url: string;
  claps: number;
}

export async function getMultipleClaps(urls: string[]): Promise<ClapEntry[]> {
  const normalized = unique(urls.slice(0, 100).map(normalizeUrl));

  if (normalized.length === 0) {
    return [];
  }

  const pipeline = redis.pipeline();
  for (const url of normalized) {
    pipeline.hget(key(url), "claps");
  }

  const results = await pipeline.exec();

  return normalized.map((url, i) => {
    const result = results?.[i];
    const claps = result?.[1] ? parseInt(result[1] as string, 10) : 0;
    return { url, claps };
  });
}
