import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { z } from "zod";
import env from "../config/env.js";
import {
  buildPasswordRecoveryEmail,
  buildSignupVerificationEmail,
} from "../lib/emailTemplates.js";
import { sendMailIfConfigured } from "../lib/mailer.js";
import User from "../models/User.js";
import {
  inferDefaultCompanyName,
  mapUserToFrontend,
} from "../utils/frontendMappers.js";

const passwordSchema = z
  .string()
  .min(8)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+/);

const signupPayloadSchema = z.object({
  user_name: z.string().trim().min(3),
  user_email: z.string().trim().email(),
  company_name: z.string().trim().min(2).optional(),
  user_pass: passwordSchema,
  user_pass_conf: passwordSchema,
});

const loginPayloadSchema = z.object({
  user_email: z.string().trim().email(),
  user_pass: passwordSchema,
});

const forgotPayloadSchema = z.object({
  user_email: z.string().trim().email(),
});

const confirmPayloadSchema = z.object({
  token: z.string().trim().regex(/^\d{6}$/),
});

const verifyCodePayloadSchema = z.object({
  token: z.string().trim().regex(/^\d{6}$/)
});

const resetPayloadSchema = z.object({
  user_pass: passwordSchema,
  user_pass_conf: passwordSchema,
});

type SessionPayload = {
  email?: string;
  userId?: string;
  user_id?: string;
};

function getPayload<T>(body: unknown): T {
  if (
    body &&
    typeof body === "object" &&
    "reqBody" in body &&
    body.reqBody &&
    typeof body.reqBody === "object"
  ) {
    return body.reqBody as T;
  }

  return body as T;
}

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    maxAge,
    secure:true,
    sameSite: "none" as const,
    path:"/"
  };
}

function getAccessSecret() {
  if (!env.ACCESS_SECRET) {
    throw new Error("ACCESS_SECRET is missing");
  }

  return env.ACCESS_SECRET;
}

function clearSessionCookies(res: Response) {
  for (const name of [
    "access_token",
    "signup_reference_token",
    "recovery_reference_token",
    "reset_reference_token",
  ]) {
    res.clearCookie(name, { sameSite: "none", secure:true,httpOnly: true ,path:"/"});
  }
}

function signSignupToken(userId: string) {
  const secret = getAccessSecret();
  return jwt.sign({ user_id: userId }, secret, {
    algorithm: "HS256",
    expiresIn: "10m",
  });
}

function signAccessToken(user: any) {
  const secret = getAccessSecret();
  return jwt.sign(
    {
      email: user.user_email,
      userId: user._id.toString(),
    },
    secret,
    {
      algorithm: "HS256",
      expiresIn: "1h",
    },
  );
}

function signRecoveryToken(userId: string) {
  const secret = getAccessSecret();
  return jwt.sign({ user_id: userId }, secret, {
    algorithm: "HS256",
    expiresIn: "10m",
  });
}

function signResetToken(userId: string) {
  const secret = getAccessSecret();
  return jwt.sign({ userId }, secret, {
    algorithm: "HS256",
    expiresIn: "10m",
  });
}

function verifyToken<T>(token: string): T {
  const secret = getAccessSecret();
  return jwt.verify(token, secret) as T;
}

async function establishSession(res: Response, user: any) {
  const accessToken = signAccessToken(user);
  user.refresh_token = accessToken;
  await user.save();
  res.cookie("access_token", accessToken, getCookieOptions(60 * 60 * 1000));
}

function extractVerifyToken(body: any) {
  if (typeof body?.token === "string") {
    return body.token;
  }

  if (body?.token && typeof body.token.token === "string") {
    return body.token.token;
  }

  return "";
}

function toStringValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim();
  }

  return "";
}

async function finalizeConfirmation(res: Response, user: any) {
  user.isVerified = true;
  user.sign_otp_token = null;
  await establishSession(res, user);
  res.clearCookie("signup_reference_token", {
    sameSite: "none",
    secure:true,
    path:"/",
    httpOnly: true,
  });
  await user.save();
  return res.status(200).json({
    success: "Confirmation successful",
    user: mapUserToFrontend(user),
  });
}

export const signUp = async (req: Request, res: Response) => {
  try {
    const payload = signupPayloadSchema.parse(getPayload(req.body));
    if (payload.user_pass !== payload.user_pass_conf) {
      return res
        .status(400)
        .json({ input_error: "Passwords must be the same" });
    }

    const oldUser = await User.findOne({ user_email: payload.user_email });
    if (oldUser) {
      return res
        .status(409)
        .json({ message: "You already have an account please sign in" });
    }

    const otpToken = crypto.randomInt(100000, 1000000).toString();
    const newUser = await User.create({
      user_name: payload.user_name,
      user_email: payload.user_email,
      company_name:
        payload.company_name || inferDefaultCompanyName(payload.user_email),
      user_pass: await bcrypt.hash(payload.user_pass, 10),
      sign_otp_token: otpToken,
      confirmation_link_id: crypto.randomBytes(16).toString("hex"),
    });

    const signupReferenceToken = signSignupToken(newUser._id.toString());
    res.cookie(
      "signup_reference_token",
      signupReferenceToken,
      getCookieOptions(10 * 60 * 1000),
    );

    const verificationEmail = buildSignupVerificationEmail({
      userName: newUser.user_name,
      userEmail: newUser.user_email,
      otpCode: otpToken,
      signupToken: signupReferenceToken,
      confirmationLinkId: newUser.confirmation_link_id,
    });
    const emailSent = await sendMailIfConfigured({
      to: newUser.user_email,
      subject: verificationEmail.subject,
      text: verificationEmail.text,
      html: verificationEmail.html,
    });

    return res.status(201).json({
      success: "Sign up successful",
      verificationRequired: true,
      user: mapUserToFrontend(newUser),
      ...(emailSent ? {} : { devOtpToken: otpToken }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ input_error: "Input requirements not fulfilled" });
    }

    console.error("Error in signUp:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
};

export const confirm = async (req: Request, res: Response) => {
  try {
    const payload = confirmPayloadSchema.parse({
      token: extractVerifyToken(req.body),
    });
    const signupReferenceToken =
      toStringValue(req.cookies?.signup_reference_token);

    if (!signupReferenceToken) {
      return res
        .status(401)
        .json({ expired_error: "Required cookie corrupted or expired" });
    }

    const verifiedPayload = verifyToken<SessionPayload>(signupReferenceToken);
    const user = await User.findById(verifiedPayload.userId ?? verifiedPayload.user_id);

    if (!user) {
      return res.status(404).json({ data_error: "User could not be found" });
    }

    if (payload.token !== user.sign_otp_token) {
      return res
        .status(401)
        .json({ auth_error: "Invalid one time password entered" });
    }

    return finalizeConfirmation(res, user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ input_error: "Input requirements not fulfilled" });
    }

    console.error("Error in confirm:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
};

export const confirm_get = async (req: Request, res: Response) => {
  try {
    const signupReferenceToken =
      toStringValue(req.query?.signup_token) ||
      toStringValue(req.query?.signupToken) ||
      toStringValue(req.cookies?.signup_reference_token);
    const confirmationId = String(req.params.confirmation_link_id ?? "").trim();

    if (!signupReferenceToken || !confirmationId) {
      return res
        .status(401)
        .json({ expired_error: "Required handler expired" });
    }

    const verifiedPayload = verifyToken<SessionPayload>(signupReferenceToken);
    const user = await User.findById(verifiedPayload.userId ?? verifiedPayload.user_id);

    if (!user || user.confirmation_link_id !== confirmationId) {
      return res.status(401).json({
        data_error: "Required handler dependencies expired or missing",
      });
    }

    return finalizeConfirmation(res, user);
  } catch (error) {
    console.error("Error in confirm_get:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
};

export const logIn = async (req: Request, res: Response) => {
  try {
    const payload = loginPayloadSchema.parse(getPayload(req.body));
    const user = await User.findOne({ user_email: payload.user_email });

    if (!user) {
      return res.status(404).json({
        data_error: "User is not found.Kindly consider creating an account",
      });
    }

    if (!user.isVerified) {
      return res
        .status(401)
        .json({ auth_error: "Account not verified please confirm by email" });
    }

    const passwordMatches = await bcrypt.compare(
      payload.user_pass,
      user.user_pass,
    );

    if (!passwordMatches) {
      return res.status(401).json({ auth_error: "Invalid credentials" });
    }

    await establishSession(res, user);
    return res.status(200).json({
      success: "Login successful",
      user: mapUserToFrontend(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ input_error: "Input requirements not fulfilled" });
    }

    console.error("Error in logIn:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
};

export const forgot = async (req: Request, res: Response) => {
  try {
    const payload = forgotPayloadSchema.parse(getPayload(req.body));
    const user = await User.findOne({ user_email: payload.user_email });

    if (!user) {
      return res.status(404).json({
        data_error: "User not found in the database consider creating account",
      });
    }

    const otpToken = crypto.randomInt(100000, 1000000).toString();
    user.pass_token = await bcrypt.hash(otpToken, 10);
    await user.save();

    const recoveryReferenceToken = signRecoveryToken(user._id.toString());
    res.cookie(
      "recovery_reference_token",
      recoveryReferenceToken,
      getCookieOptions(10 * 60 * 1000),
    );

    const recoveryEmail = buildPasswordRecoveryEmail({
      userName: user.user_name,
      userEmail: user.user_email,
      otpCode: otpToken,
      recoveryToken: recoveryReferenceToken,
    });
    const emailSent = await sendMailIfConfigured({
      to: user.user_email,
      subject: recoveryEmail.subject,
      text: recoveryEmail.text,
      html: recoveryEmail.html,
    });

    return res.status(200).json({
      success: "Reset code generated successfully",
      ...(emailSent ? {} : { devResetToken: otpToken }),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ input_error: "Input requirements are not fulfilled" });
    }

    console.error("Error in forgot:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
};

export const verifyCode = async (req: Request, res: Response) => {
  try {
    const payload = verifyCodePayloadSchema.parse({
      token: extractVerifyToken(req.body),

    });
    const recoveryReferenceToken =
      toStringValue(req.cookies?.recovery_reference_token);

    if (!recoveryReferenceToken) {
      return res
        .status(401)
        .json({ expired_error: "Required cookie corrupted or expired" });
    }

    const verifiedPayload = verifyToken<SessionPayload>(recoveryReferenceToken);
    const user = await User.findById(verifiedPayload.userId ?? verifiedPayload.user_id);

    if (!user || !user.pass_token) {
      return res.status(404).json({ data_error: "User could not be found" });
    }

    const tokenMatches = await bcrypt.compare(payload.token, user.pass_token);
    if (!tokenMatches) {
      return res.status(401).json({ input_error: "Invalid one time password" });
    }

    res.cookie(
      "reset_reference_token",
      signResetToken(user._id.toString()),
      getCookieOptions(10 * 60 * 1000),
    );
    return res.status(200).json({ success: "Token verification successful" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(401)
        .json({ input_error: "Input requirements not fulfilled" });
    }

    console.error("Error in verifyCode:", error);
    return res.status(401).json({ server_error: "Internal server error" });
  }
};

export const reset = async (req: Request, res: Response) => {
  try {
    const payload = resetPayloadSchema.parse(getPayload(req.body));
    if (payload.user_pass !== payload.user_pass_conf) {
      return res
        .status(401)
        .json({ input_error: "Passwords must be the same" });
    }

    const resetReferenceToken = req.cookies.reset_reference_token;
    if (!resetReferenceToken) {
      return res.status(401).json({
        expiration_error: "Reset password handlers expired try again later",
      });
    }

    const verifiedPayload = verifyToken<SessionPayload>(resetReferenceToken);
    const user = await User.findById(verifiedPayload.userId ?? verifiedPayload.user_id);

    if (!user) {
      return res.status(404).json({ data_error: "User could not be found" });
    }

    user.user_pass = await bcrypt.hash(payload.user_pass, 10);
    user.pass_token = null;
    await user.save();

    res.clearCookie("recovery_reference_token", {
      sameSite: "none",
      secure:true,
      path:"/",
      httpOnly: true,
    });
    res.clearCookie("reset_reference_token", {
      sameSite: "none",
      secure:true,
      path:"/",
      httpOnly: true,
    });

    return res.status(200).json({ success: "Password reset successful" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(401)
        .json({ input_error: "Input requirements not fulfilled" });
    }

    console.error("Error in reset:", error);
    return res.status(401).json({ server_error: "Internal server error" });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    if (!req.currentUserId) {
      return res.status(401).json({ user_error: "Not authenticated" });
    }

    const user = await User.findById(req.currentUserId);
    if (!user) {
      return res.status(404).json({ data_error: "User could not be found" });
    }

    return res.status(200).json({ user: mapUserToFrontend(user) });
  } catch (error) {
    console.error("Error in me:", error);
    return res.status(500).json({ server_error: "Internal server error" });
  }
};

export const logout = async (_req: Request, res: Response) => {
  clearSessionCookies(res);
  return res.status(200).json({ success: "Logged out successfully" });
};
