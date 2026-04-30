import crypto from "crypto";
import { createSecurityError, sendSafeError } from "./errorHandler.js";
const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
function getCookieOptions() {
    return {
        httpOnly: false,
        sameSite: "none",
        secure: true,
        path: "/",
    };
}
function getAllowedOrigins() {
    const configured = [
        process.env.FRONTEND_ORIGIN,
        process.env.FRONTEND_URL,
        "http://localhost:3001",
    ]
        .filter((value) => typeof value === "string" && value.trim().length > 0)
        .map((value) => value.trim());
    return new Set(configured);
}
export function ensureCsrfCookie(req, res, next) {
    const token = typeof req.cookies?.[CSRF_COOKIE_NAME] === "string"
        ? req.cookies[CSRF_COOKIE_NAME].trim()
        : "";
    if (!token) {
        res.cookie(CSRF_COOKIE_NAME, crypto.randomBytes(32).toString("hex"), getCookieOptions());
    }
    next();
}
export function issueCsrfToken(_req, res) {
    const token = crypto.randomBytes(32).toString("hex");
    res.cookie(CSRF_COOKIE_NAME, token, getCookieOptions());
    return res.status(200).json({ csrfToken: token });
}
export function verifyCsrfToken(req, res, next) {
    if (SAFE_METHODS.has(req.method.toUpperCase())) {
        return next();
    }
    const origin = req.get("origin");
    const allowedOrigins = getAllowedOrigins();
    if (origin && allowedOrigins.size > 0 && !allowedOrigins.has(origin)) {
        return sendSafeError(res, createSecurityError("Invalid request origin."));
    }
    const cookieToken = typeof req.cookies?.[CSRF_COOKIE_NAME] === "string"
        ? req.cookies[CSRF_COOKIE_NAME].trim()
        : "";
    const headerToken = req.get(CSRF_HEADER_NAME)?.trim() || "";
    if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        return sendSafeError(res, createSecurityError("CSRF token validation failed."));
    }
    return next();
}
//# sourceMappingURL=csrf.js.map