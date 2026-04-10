import type { Response, NextFunction } from "express";
import type { I_Request } from "../controllers/authControl.js";
import env from "../config/env.js";
import jwt from "jsonwebtoken";
const ACCESS_SECRET = env.ACCESS_SECRET;
const middleAuth = async (
  req: I_Request,
  res: Response,
  next: NextFunction,
) => {
  const identity_cookie: string = req.cookies.access_token;
  if (!identity_cookie) {
    return res.status(401).json({
      user_error:
        "You currently do not have an account please create an account or sign in if you have an account already",
    });
  }
  if (!ACCESS_SECRET) {
    return res.status(500).json({ error: "Internal server error" });
  }
  const user_details = jwt.verify(identity_cookie, ACCESS_SECRET);
};
