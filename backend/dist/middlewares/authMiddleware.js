import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import { isMongoTransientError, withMongoTransientRetry, } from "../utils/mongoErrors.js";
function getAccessSecret() {
    if (!env.ACCESS_SECRET) {
        throw new Error("ACCESS_SECRET is missing");
    }
    return env.ACCESS_SECRET;
}
async function resolveUserFromRequest(req) {
    const devAuth = req.headers["x-dev-auth"];
    const devAuthEnabled = (typeof devAuth === "string" && devAuth.toLowerCase() === "true") ||
        (Array.isArray(devAuth) &&
            devAuth.some((value) => value.toLowerCase() === "true"));
    // Explicit dev-auth bypass for local testing with tools like Thunder Client.
    if (devAuthEnabled) {
        return {
            _id: "mock_user_id",
            user_name: "Dev User",
            user_email: "dev@example.com",
            company_name: "Dev Company",
            isVerified: true,
        };
    }
    const token = req.cookies?.access_token;
    if (!token) {
        return null;
    }
    const payload = jwt.verify(token, getAccessSecret());
    const userId = payload.userId ?? payload.user_id;
    if (!userId) {
        return null;
    }
    const user = await withMongoTransientRetry(() => User.findById(userId).lean());
    if (!user) {
        return null;
    }
    req.currentUserId = user._id;
    req.currentUser = {
        _id: user._id,
        user_name: user.user_name,
        user_email: user.user_email,
        company_name: user.company_name,
        isVerified: Boolean(user.isVerified),
    };
    return req.currentUser;
}
export const middleAuth = async (req, res, next) => {
    try {
        const user = await resolveUserFromRequest(req);
        if (!user) {
            return res.status(401).json({
                user_error: "You currently do not have an active session. Please sign in first.",
            });
        }
        return next();
    }
    catch (error) {
        console.error("Authentication failed:", error);
        if (isMongoTransientError(error)) {
            return res.status(503).json({
                server_error: "Database connection is temporarily unavailable. Please retry in a moment.",
            });
        }
        return res
            .status(401)
            .json({ auth_error: "Session expired or invalid. Please sign in again." });
    }
};
export const optionalAuth = async (req, _res, next) => {
    try {
        await resolveUserFromRequest(req);
    }
    catch {
        // Optional auth intentionally ignores token errors.
    }
    return next();
};
//# sourceMappingURL=authMiddleware.js.map