import bcrypt from "bcrypt";
import User from "../models/User.js";
import {
  signupSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
} from "../validations/authValidations.js";
import debug from "debug";
import z from "zod";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import crypto from "crypto";
import type { Request, Response} from "express";
import type { JwtPayload } from "jsonwebtoken";
const controlDebug = debug("app:controller");
export interface I_Request extends Request {
  email?: string;
}
const ACCESS_SECRET = env.ACCESS_SECRET;
const REFRESH_SECRET = env.REFRESH_SECRET;

export const signUp = async (req: I_Request, res: Response) => {
  try {
    const reqBody = req.body;
    const user_details = signupSchema.parse(reqBody);
    const oldUser = await User.findOne({ user_email: user_details.user_email });
    if (oldUser) {
      return res
        .status(401)
        .json({ message: "You already have an account please sign in" });
    }
    if (user_details.user_pass !== user_details.user_pass_conf) {
      return res
        .status(401)
        .json({ input_error: "Input passwords must be the same" });
    }
    const hashedPassword = await bcrypt.hash(user_details.user_pass, 10);
    const otpToken = crypto.randomInt(1000000).toString().padStart(6, "0");
    const newUser = new User({
      user_name: user_details.user_name,
      user_email: user_details.user_email,
      user_pass: hashedPassword,
      sign_otp_token: otpToken,
    });
    await newUser.save();
    let rec_info = { user_id: newUser._id };
    if (!env.ACCESS_SECRET)
      return res.status(500).json({ server_error: "Internal server error" });
    const reference_token = jwt.sign(rec_info, env.ACCESS_SECRET, {
      expiresIn: "10m",
    });
    res.cookie("reference_token", reference_token, {
      maxAge: 10 * 60 * 1000,
      httpOnly: true,
    });
    res.status(201).json({ success: "Sign up successful", token: otpToken });
  } catch (error) {
    controlDebug(error);
    if (error instanceof z.ZodError) {
      return res
        .status(401)
        .json({ input_error: "Input requirements not fulfilled" });
    }
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export const confirm = async (req: I_Request, res: Response) => {
  try {
    const { token } = req.body;
    const detail_cookie = req.cookies.reference_token;
    if (!env.ACCESS_SECRET)
      return res.status(500).json({ server_error: "Internal server error" });
    const payload = jwt.verify(detail_cookie, env.ACCESS_SECRET);

    if (!payload) {
      return res.status(500).json({ server_error: "Internal server error" });
    }
    if (typeof payload == "string")
      return res.status(500).json({ server_error: "Internal server errror" });
    const user = await User.findOne({ _id: payload.id });
    if (!user) {
      return res.status(500).json({ server_error: "Internal server error" });
    }
    if (token !== user.sign_otp_token) {
      return res
        .status(401)
        .json({ auth_error: "Invalid one time password entered" });
    }
    user.isVerified = true;
    const user_cookie_details = { userId: user._id };
    if (ACCESS_SECRET && REFRESH_SECRET) {
      const access_token = jwt.sign(user_cookie_details, ACCESS_SECRET, {
        algorithm: "HS256",
      });
      const refresh_token = jwt.sign(user_cookie_details, REFRESH_SECRET, {
        algorithm: "HS256",
      });

      res.cookie("access_token", access_token, {
        httpOnly: true,
        maxAge: 20 * 60 * 60,
      });
      user.refresh_token = refresh_token;
      await user.save();
      res.status(200).json({ success: "Confirmation successful" });
    }
  } catch (error) {
    controlDebug(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export const logIn = async (req: Request, res: Response) => {
  try {
    const reqBody = req.body;
    const user_details = loginSchema.parse(reqBody);
    const user = await User.findOne({ user_email: user_details.user_email });
    if (!user) {
      return res.status(404).json({
        data_error:
          "User is not found in the database.Consider creating an account",
      });
    }
    if (!user.isVerified) {
      return res
        .status(401)
        .json({ auth_error: "Account not verified please confirm by email" });
    }
    const check = await bcrypt.compare(user_details.user_pass, user.user_pass);
    if (!check) {
      return res.status(401).json({ auth_error: "Invalid credentials" });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(401)
        .json({ input_error: "Input requirements not fulfilled" });
    }
    controlDebug(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export const forgot = async (req: I_Request, res: Response) => {
  try {
    const reqBody = req.body;
    const forget_details = forgotSchema.parse(reqBody);
    const user = await User.findOne({ user_email: forget_details.user_email });
    if (!user) {
      return res.status(404).json({
        data_error: "User not found in the database consider creating account",
      });
    }
    let rec_info = { user_id: user._id };
    if (!env.ACCESS_SECRET)
      return res.status(500).json({ server_error: "Internal server error" });
    const reference_token = jwt.sign(rec_info, env.ACCESS_SECRET, {
      expiresIn: "10m",
    });
    res.cookie("reference_token", reference_token, {
      maxAge: 10 * 60 * 1000,
      httpOnly: true,
    });
    let reset_pass_token = crypto
      .randomInt(1000000)
      .toString()
      .padStart(6, "0");
    reset_pass_token = await bcrypt.hash(reset_pass_token, 5);
    user.pass_token = reset_pass_token;
    await user.save();
  } catch (error) {
    controlDebug(error);
    if (error instanceof z.ZodError) {
      return res
        .status(401)
        .json({ input_error: "Input requirements are not fulfilled" });
    }
    res.status(401).json({ server_error: "Internal server error" });
  }
};
export const verifyCode = async (req: I_Request, res: Response) => {
  try {
    const { token } = req.body;
    const detail_cookie = req.cookies.reference_token;
    if (!env.ACCESS_SECRET)
      return res.status(500).json({ server_error: "Internal server error" });
    const payload = jwt.verify(detail_cookie, env.ACCESS_SECRET);

    if (!payload) {
      return res.status(500).json({ server_error: "Internal server error" });
    }
    if (typeof payload == "string")
      return res.status(500).json({ server_error: "Internal server errror" });
    const user = await User.findOne({ _id: payload.id });
    if (!user) {
      return res.status(500).json({ server_error: "Internal server error" });
    }
    if (!user.pass_token) {
      return res.status(500).json({ server_error: "Internal server error" });
    }
    const check = await bcrypt.compare(token, user.pass_token);
    if (!check)
      return res.status(401).json({ input_error: "Invalid one time password" });
    const user_cookie_details = { userId: user._id };
    if (ACCESS_SECRET) {
      const access_token = jwt.sign(user_cookie_details, ACCESS_SECRET, {
        algorithm: "HS256",
      });
      res.cookie("reset_token", access_token, {
        httpOnly: true,
        maxAge: 5 * 60 * 60,
      });
    }
  } catch (error) {
    controlDebug(error);
    if (error instanceof z.ZodError) {
      return res
        .status(401)
        .json({ input_error: "Input requirements not fulfilled" });
    }
    res.status(401).json({ server_error: "Internal server error" });
  }
};
export const reset = async (req: any, res: any) => {
  try {
    const reset_info = req.cookies.reset_token;
    const reqBody = req.body;
    const passwords = resetSchema.parse(reqBody);
    if (passwords.user_pass !== passwords.user_pass_conf) {
      return res
        .status(401)
        .json({ input_error: "Passwords must be the same" });
    }
    if (!reset_info) {
      return res.json({
        expiration_error: "Reset password handlers expired try again later",
      });
    }
    if (ACCESS_SECRET) {
      const reset = jwt.verify(reset_info, ACCESS_SECRET);
      if (!reset) {
        controlDebug("There is an error in controllers!");
        return res.status(500).json({ server_error: "Internal server error" });
      }
      if (typeof reset == "object") {
        const userId = reset.userId;
        const user = await User.findOne({ _id: userId });
        if (!user) {
          return res
            .status(500)
            .json({ server_error: "Internal server error" });
        }
        const hashedPassword = await bcrypt.hash(passwords.user_pass, 10);
        user.user_pass == hashedPassword;
        await user.save();
        res.status(201).json({ success: "Password reset successful" });
      }
    }
  } catch (error) {
    controlDebug(error);
    if (error instanceof z.ZodError) {
      return res
        .status(401)
        .json({ input_error: "Input requirements not fulfilled" });
    }
    res.status(401).json({ server_error: "Internal server error" });
  }
};
