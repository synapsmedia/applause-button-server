import { redis } from "../lib/redis.js";
import { clamp, normalizeUrl, unique } from "../lib/util.js";

const KEY_PREFIX = "applause:";

function key(url: string): string {
  return `${KEY_PREFIX}${url}`;
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
  const clapIncrement = clamp(clapCount, 1, 10);

  const lastIp = await redis.hget(k, "lastIp");

  if (lastIp && lastIp === sourceIp) {
    const current = await redis.hget(k, "claps");
    return current ? parseInt(current, 10) : 0;
  }

  const newTotal = await redis.hincrby(k, "claps", clapIncrement);
  await redis.hset(k, "lastIp", sourceIp);

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
