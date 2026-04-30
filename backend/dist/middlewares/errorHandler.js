import multer from "multer";
import { ZodError } from "zod";
export class HttpError extends Error {
    statusCode;
    code;
    constructor(statusCode, message, options = {}) {
        super(message);
        this.name = "HttpError";
        this.statusCode = statusCode;
        this.code = options.code ?? "server_error";
    }
}
export function createValidationError(message = "Validation failed. Please check the submitted fields.") {
    return new HttpError(400, message, { code: "validation_error" });
}
export function createAuthenticationError(message = "You are not authorized to perform this action.") {
    return new HttpError(401, message, { code: "auth_error" });
}
export function createRateLimitError(message = "Too many requests. Please try again shortly.") {
    return new HttpError(429, message, { code: "rate_limit_error" });
}
export function createUploadError(message = "The uploaded file is invalid.", statusCode = 400) {
    return new HttpError(statusCode, message, { code: "upload_error" });
}
export function createSecurityError(message = "Request could not be verified.") {
    return new HttpError(403, message, { code: "security_error" });
}
export function createServerError(message = "Internal server error") {
    return new HttpError(500, message, { code: "server_error" });
}
function normalizeUploadError(error) {
    if (error.code === "LIMIT_FILE_SIZE") {
        return createUploadError("Uploaded file is too large.", 413);
    }
    if (error.code === "LIMIT_UNEXPECTED_FILE") {
        return createUploadError("Unexpected file upload field.");
    }
    return createUploadError("The uploaded file is invalid.");
}
export function normalizeError(error) {
    if (error instanceof HttpError) {
        return error;
    }
    if (error instanceof ZodError) {
        return createValidationError();
    }
    if (error instanceof multer.MulterError) {
        return normalizeUploadError(error);
    }
    if (error instanceof Error) {
        return createServerError();
    }
    return createServerError();
}
export function sendSafeError(res, error, extra = {}) {
    return res.status(error.statusCode).json({
        error: error.code,
        message: error.message,
        ...extra,
    });
}
export function logInternalError(error, req) {
    if (req) {
        console.error(`Error on ${req.method} ${req.originalUrl}:`, error);
        return;
    }
    console.error("Unhandled application error:", error);
}
export function forwardError(error, _req, _res, next) {
    next(error);
}
export const errorHandler = (error, req, res, next) => {
    if (res.headersSent) {
        return next(error);
    }
    logInternalError(error, req);
    return sendSafeError(res, normalizeError(error));
};
//# sourceMappingURL=errorHandler.js.map