import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { createRateLimitError, sendSafeError } from "./errorHandler.js";

type RateLimitOptions = {
  windowMs: number;
  maxRequests: number;
  keyPrefix?: string;
  message?: string;
};

function getRetryAfterSeconds(resetTime?: Date) {
  if (!resetTime) {
    return undefined;
  }

  return Math.max(Math.ceil((resetTime.getTime() - Date.now()) / 1000), 1);
}

export function createRateLimit(options: RateLimitOptions) {
  const {
    windowMs,
    maxRequests,
    keyPrefix = "global",
    message = "Too many requests. Please try again shortly.",
  } = options;

  return rateLimit({
    windowMs,
    limit: maxRequests,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) =>
      `${keyPrefix}:${ipKeyGenerator(req.ip || req.socket.remoteAddress || "unknown")}`,
    handler: (req, res) => {
      const requestWithRateLimit = req as typeof req & {
        rateLimit?: {
          resetTime?: Date;
        };
      };
      const retryAfterSeconds = getRetryAfterSeconds(
        requestWithRateLimit.rateLimit?.resetTime,
      );
      if (retryAfterSeconds) {
        res.setHeader("Retry-After", String(retryAfterSeconds));
      }

      return sendSafeError(res, createRateLimitError(message), {
        retryAfterSeconds: retryAfterSeconds ?? 0,
      });
    },
  });
}
