import type { Request, Response, NextFunction } from "express";

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  message?: string;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitEntry>();

function getClientIdentifier(req: Request) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0]?.trim() || req.ip || "unknown";
  }

  return req.ip || "unknown";
}

function cleanupExpiredEntries(now: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyPrefix = "global",
    message = "Too many requests. Please try again shortly.",
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    cleanupExpiredEntries(now);

    const clientKey = `${keyPrefix}:${req.method}:${req.path}:${getClientIdentifier(req)}`;
    const currentEntry = store.get(clientKey);

    if (!currentEntry || currentEntry.resetAt <= now) {
      store.set(clientKey, {
        count: 1,
        resetAt: now + windowMs,
      });

      res.setHeader("X-RateLimit-Limit", String(maxRequests));
      res.setHeader("X-RateLimit-Remaining", String(maxRequests - 1));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil((now + windowMs) / 1000)));
      return next();
    }

    currentEntry.count += 1;
    store.set(clientKey, currentEntry);

    const remaining = Math.max(maxRequests - currentEntry.count, 0);
    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(currentEntry.resetAt / 1000)));

    if (currentEntry.count > maxRequests) {
      return res.status(429).json({
        rate_error: message,
      });
    }

    return next();
  };
}
