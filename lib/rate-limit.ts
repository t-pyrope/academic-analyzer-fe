import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
const ratelimiterCache = new Map<string, Ratelimit>();

const getRatelimiter = (limit: number, windowSec: number) => {
  const cacheKey = `${limit}:${windowSec}`;
  const existing = ratelimiterCache.get(cacheKey);

  if (existing) {
    return existing;
  }

  const ratelimiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: "ratelimit",
  });

  ratelimiterCache.set(cacheKey, ratelimiter);

  return ratelimiter;
};

export const rateLimit = async (key: string, limit = 5, windowSec = 60) => {
  const { success } = await getRatelimiter(limit, windowSec).limit(key);

  return success;
};
