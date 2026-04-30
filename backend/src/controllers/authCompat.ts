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
import { issueCsrfToken } from "../middlewares/csrf.js";

const passwordSchema = z
  .string()
  .min(8)
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).+/);

const signupPayloadSchema = z.object({
  user_name: z.string().trim().min(3),
  user_email: z.string().trim().email(),
  company_name: z.string().trim().min(2).optional(),
  user_pass: passwordSchema,
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

const onboardingPayloadSchema = z.object({
  company_name: z.string().trim().min(2),
  hiring_focus: z.string().trim().min(2),
  team_setup: z.string().trim().min(2),
  workflow_goal: z.string().trim().min(2),
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
    "csrf_token",
    "signup_reference_token",
    "recovery_reference_token",
    "reset_reference_token",
    "google_oauth_state",
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

async function issueSignupVerificationChallenge(res: Response, user: any) {
  const otpToken = crypto.randomInt(100000, 1000000).toString();
  user.sign_otp_token = otpToken;
  user.confirmation_link_id = crypto.randomBytes(16).toString("hex");
  await user.save();

  const signupReferenceToken = signSignupToken(user._id.toString());
  res.cookie(
    "signup_reference_token",
    signupReferenceToken,
    getCookieOptions(10 * 60 * 1000),
  );

  const verificationEmail = buildSignupVerificationEmail({
    userName: user.user_name,
    userEmail: user.user_email,
    otpCode: otpToken,
    signupToken: signupReferenceToken,
    confirmationLinkId: user.confirmation_link_id,
  });
  const emailSent = await sendMailIfConfigured({
    to: user.user_email,
    subject: verificationEmail.subject,
    text: verificationEmail.text,
    html: verificationEmail.html,
  });

  return {
    signupReferenceToken,
    otpToken,
    emailSent,
  };
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

function getRequestOrigin(req: Request) {
  const forwardedProto = toStringValue(req.headers["x-forwarded-proto"]);
  const protocol = forwardedProto || req.protocol || "http";
  const host = toStringValue(req.headers["x-forwarded-host"]) || req.get("host") || "";
  return `${protocol}://${host}`;
}

function getGoogleRedirectUri(req: Request) {
  return `${getRequestOrigin(req)}/auth/google/callback`;
}

function getGoogleAuthConfig() {
  const clientId = toStringValue(env.GOOGLE_CLIENT_ID);
  const clientSecret = toStringValue(env.GOOGLE_CLIENT_SECRET);
  return {
    clientId,
    clientSecret,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

function getFrontendRedirectUrl(path = "/dashboard") {
  const frontendUrl = toStringValue(env.FRONTEND_URL) || toStringValue(env.FRONTEND_ORIGIN);
  const base = frontendUrl || "http://localhost:3001";
  return `${base.replace(/\/+$/, "")}${path}`;
}

function setGoogleStateCookie(res: Response, value: string) {
  res.cookie(
    "google_oauth_state",
    value,
    getCookieOptions(10 * 60 * 1000),
  );
}

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
};

async function exchangeGoogleCodeForUser(req: Request, code: string) {
  const { clientId, clientSecret, isConfigured } = getGoogleAuthConfig();
  if (!isConfigured) {
    throw new Error("Google OAuth credentials are missing");
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(req),
      grant_type: "authorization_code",
    }).toString(),
  });

  if (!tokenResponse.ok) {
    throw new Error("Google token exchange failed");
  }

  const tokenData = (await tokenResponse.json()) as {
    access_token?: string;
    id_token?: string;
  };
  if (!toStringValue(tokenData.access_token)) {
    throw new Error("Google access token missing");
  }

  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    },
  );

  if (!profileResponse.ok) {
    throw new Error("Google profile lookup failed");
  }

  return (await profileResponse.json()) as GoogleUserInfo;
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

    const oldUser = await User.findOne({ user_email: payload.user_email });
    if (oldUser) {
      return res
        .status(409)
        .json({ message: "You already have an account please sign in" });
    }

    const newUser = await User.create({
      user_name: payload.user_name,
      user_email: payload.user_email,
      company_name:
        payload.company_name || inferDefaultCompanyName(payload.user_email),
      user_pass: await bcrypt.hash(payload.user_pass, 10),
      sign_otp_token: null,
      confirmation_link_id: "",
    });

    const { emailSent, otpToken } = await issueSignupVerificationChallenge(
      res,
      newUser,
    );

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

export const csrfToken = async (req: Request, res: Response) => {
  return issueCsrfToken(req, res);
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

export const googleStart = async (req: Request, res: Response) => {
  try {
    const { clientId, isConfigured } = getGoogleAuthConfig();
    if (!isConfigured) {
      return res.status(400).json({
        data_error: "Google OAuth is not configured yet",
      });
    }

    const state = crypto.randomBytes(24).toString("hex");
    setGoogleStateCookie(res, state);

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", getGoogleRedirectUri(req));
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "select_account");

    return res.redirect(authUrl.toString());
  } catch (error) {
    console.error("Error in googleStart:", error);
    return res.redirect(
      `${getFrontendRedirectUrl("/login")}?error=google_oauth_start_failed`,
    );
  }
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const code = toStringValue(req.query.code);
    const state = toStringValue(req.query.state);
    const cookieState = toStringValue(req.cookies?.google_oauth_state);

    if (!code || !state || !cookieState || state !== cookieState) {
      clearSessionCookies(res);
      return res.redirect(
        `${getFrontendRedirectUrl("/login")}?error=google_oauth_state_invalid`,
      );
    }

    const googleUser = await exchangeGoogleCodeForUser(req, code);
    const email = toStringValue(googleUser.email).toLowerCase();
    const googleId = toStringValue(googleUser.sub);
    const name = toStringValue(googleUser.name) || "Google User";

    if (!email || !googleId) {
      clearSessionCookies(res);
      return res.redirect(
        `${getFrontendRedirectUrl("/login")}?error=google_oauth_profile_invalid`,
      );
    }

    let user = await User.findOne({
      $or: [{ google_id: googleId }, { user_email: email }],
    });

    if (!user) {
      user = await User.create({
        user_name: name,
        user_email: email,
        company_name: inferDefaultCompanyName(email),
        user_pass: await bcrypt.hash(crypto.randomUUID(), 10),
        google_id: googleId,
        auth_provider: "google",
        isVerified: false,
        onboarding_completed: false,
        sign_otp_token: null,
        confirmation_link_id: "",
      });
    } else {
      let hasChanges = false;

      if (!toStringValue(user.google_id)) {
        user.google_id = googleId;
        hasChanges = true;
      }

      if (toStringValue(user.auth_provider) !== "google") {
        user.auth_provider = "google";
        hasChanges = true;
      }

      if (!toStringValue(user.user_name) && name) {
        user.user_name = name;
        hasChanges = true;
      }

      if (hasChanges) {
        await user.save();
      }
    }

    const { signupReferenceToken, otpToken, emailSent } =
      await issueSignupVerificationChallenge(res, user);
    res.clearCookie("google_oauth_state", {
      sameSite: "none",
      secure: true,
      httpOnly: true,
      path: "/",
    });

    const redirectUrl = new URL(getFrontendRedirectUrl("/register"));
    redirectUrl.searchParams.set("verify", "1");
    redirectUrl.searchParams.set("email", email);
    redirectUrl.searchParams.set("signup_token", signupReferenceToken);
    if (!emailSent) {
      redirectUrl.searchParams.set("confirm_otp", otpToken);
    }

    return res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error("Error in googleCallback:", error);
    clearSessionCookies(res);
    return res.redirect(
      `${getFrontendRedirectUrl("/login")}?error=google_oauth_failed`,
    );
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

export const completeOnboarding = async (req: Request, res: Response) => {
  try {
    const userId = req.currentUserId;
    if (!userId) {
      return res.status(401).json({ user_error: "Not authenticated" });
    }

    const payload = onboardingPayloadSchema.parse(getPayload(req.body));
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ data_error: "User could not be found" });
    }

    user.company_name = payload.company_name;
    user.onboarding_completed = true;
    user.onboarding_preferences = {
      hiring_focus: payload.hiring_focus,
      team_setup: payload.team_setup,
      workflow_goal: payload.workflow_goal,
    };
    await user.save();

    return res.status(200).json({
      success: "Onboarding completed successfully",
      user: mapUserToFrontend(user),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ input_error: "Input requirements not fulfilled" });
    }

    console.error("Error in completeOnboarding:", error);
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
