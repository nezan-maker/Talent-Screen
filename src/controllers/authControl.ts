import bcrypt from "bcrypt";
import User from "../models/User.js";
import {
  signupSchema,
  loginSchema,
  forgotSchema,
} from "../validations/authValidations.js";
import debug from "debug";
import z from "zod";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";

const controlDebug = debug("app:controller");
dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

export const signUp = async (req: any, res: any, next: any) => {
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
        .json({ error: "Input passwords must be the same" });
    }
    const hashedPassword = await bcrypt.hash(user_details.user_pass, 10);
    const newUser = new User({
      user_name: user_details.user_name,
      user_email: user_details.user_email,
      user_pass: hashedPassword,
    });
    await newUser.save();
    res.status(201).json({ success: "Sign up successful" });
    req.email = user_details.user_email;
    next();
  } catch (error) {
    controlDebug(error);
    if (error instanceof z.ZodError) {
      return res
        .status(401)
        .json({ error: "Input requirements not fulfilled" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
export const confirm = async (req: any, res: any) => {
  const { token } = req.body;
  const email = req.email;
  const user = await User.findOne({ user_email: email });
  if (!user) {
    return res.status(500).json({ error: "Internal server error" });
  }
  if (token !== user.sign_otp_token) {
    return res.status(401).json({ error: "Invalid one time password entered" });
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
  }
};
export const logIn = async (req: any, res: any) => {
  try {
    const reqBody = req.body;
    const user_details = loginSchema.parse(reqBody);
    const user = await User.findOne({ user_email: user_details.user_email });
    if (!user) {
      return res.status(401).json({
        error: "User is not found in the database.Consider creating an account",
      });
    }
    const check = await bcrypt.compare(user_details.user_pass, user.user_pass);
    if (!check) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(401)
        .json({ error: "Input requirements not fulfilled" });
    }
    controlDebug(error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const forgot = async (req: any, res: any, next: any) => {
  try {
    const reqBody = req.body;
    const forget_details = forgotSchema.parse(reqBody);
    const user = await User.findOne({ user_email: forget_details.user_email });
    if (!user) {
      return res.status(401).json({
        error: "User not found in the database consider creating account",
      });
    }
    let reset_pass_token = crypto
      .randomInt(1000000)
      .toString()
      .padStart(6, "0");
    reset_pass_token = await bcrypt.hash(reset_pass_token, 5);
    user.pass_token = reset_pass_token;
    await user.save();
    req.email = forget_details.user_email;
    next();
  } catch (error) {
    controlDebug(error);
    if (error instanceof z.ZodError) {
      return res
        .status(401)
        .json({ error: "Input requirements are not fulfilled" });
    }
    res.status(401).json({ error: "Internal server error" });
  }
};
export const verifyCode = async () => {};
