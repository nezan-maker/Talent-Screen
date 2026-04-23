import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
export const middleAuth = async (req, res, next) => {
    try {
        const identityCookie = req.cookies.access_token;
        if (!identityCookie) {
            return res.status(401).json({
                user_error: "You currently do not have an account please create an account or sign in if you have an account already",
            });
        }
        if (!env.ACCESS_SECRET) {
            return res.status(500).json({ server_error: "Internal server error" });
        }
        const payload = jwt.verify(identityCookie, env.ACCESS_SECRET);
        const userId = payload.userId ?? payload.user_id;
        const userEmail = payload.email;
        const user = userId
            ? await User.findById(userId)
            : userEmail
                ? await User.findOne({ user_email: userEmail })
                : null;
        if (!user) {
            return res.status(404).json({
                data_error: "User could not be found.Token corrupted or expired",
            });
        }
        req.currentUserId = user._id.toString();
        req.currentUserEmail = user.user_email;
        next();
    }
    catch (error) {
        return res.status(401).json({
            user_error: "You currently do not have an account please create an account or sign in if you have an account already",
        });
    }
};
//# sourceMappingURL=authMiddleware.js.map