import bcrypt from "bcrypt";
import User from "../models/User.js";
import {
  signupSchema,
  loginSchema,
  forgotSchema,
  resetSchema,
  verifyCSchema,
} from "../validations/authValidations.js";
import debug from "debug";
import z from "zod";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import type { Request, Response } from "express";
export const controlDebug = debug("app:controller");
export interface I_Request extends Request {
  email?: string;
}
const ACCESS_SECRET = env.ACCESS_SECRET;
const REFRESH_SECRET = env.REFRESH_SECRET;
interface Reset {
  user_pass: string;
  user_pass_conf: string;
}
interface SignUp {
  user_name: string;
  user_email: string;
  user_pass: string;
  user_pass_conf: string;
}
interface Login {
  user_email: string;
  user_pass: string;
  user_pass_conf: string;
}
interface Forgot {
  user_email: string;
}

export const signUp = async (req: I_Request, res: Response) => {
  try {
    const { reqBody }: { reqBody: SignUp } = req.body;
    const user_details = signupSchema.parse(reqBody);
    const oldUser = await User.findOne({ user_email: user_details.user_email });
    if (!env.ACCESS_SECRET) {
      throw new Error("Could not load necessary environment variables");
    }
    if (oldUser) {
      return res
        .status(401)
        .json({ message: "You already have an account please sign in" });
    }
    if (user_details.user_pass !== user_details.user_pass_conf) {
      return res
        .status(400)
        .json({ input_error: "Passwords must be the same" });
    }
    const hashedPassword = await bcrypt.hash(user_details.user_pass, 10);
    const otpToken = crypto.randomInt(1000000).toString().padStart(6, "0");
    const newUser = new User({
      user_name: user_details.user_name,
      user_email: user_details.user_email,
      user_pass: hashedPassword,
      sign_otp_token: otpToken,
    });
    const randomId = crypto.randomBytes(16).toString("hex");
    newUser.confirmation_link_id = randomId;
    const confirmation_link = "http://localhost:3000/confirm-link/" + randomId;
    await newUser.save();
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: env.USER_EMAIL,
        pass: env.USER_PASS,
      },
    });

    transporter.sendMail({
      from: env.USER_EMAIL,
      to: newUser.user_email,
      text: `This is your token ${otpToken}`,
      html: `<!doctype html>
<html lang="en" style="margin: 0; padding: 0; background-color: #f8fafc; background: #f8fafc;">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Confirm your WiseRank account</title>
    
  <style>
@media only screen and (max-width: 640px) {
  .wr-wrapper {
    padding: 14px 8px 24px;
  }

  .wr-hero {
    padding: 24px 20px 20px;
    border-radius: 18px 18px 0 0;
  }

  .wr-title {
    font-size: 27px;
  }

  .wr-code {
    font-size: 24px;
    letter-spacing: 0.14em;
  }

  .wr-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .wr-section-last {
    border-radius: 0 0 18px 18px;
  }

  .wr-surface,
  .wr-step-card,
  .wr-list-card {
    padding: 16px;
  }

  .wr-inline-stat-cell,
  .wr-step-cell {
    display: block !important;
    width: 100% !important;
    padding-right: 0 !important;
    padding-bottom: 10px !important;
  }

  .wr-inline-stat-cell-last,
  .wr-step-cell-last {
    padding-bottom: 0 !important;
  }

  .wr-list-row td {
    display: block !important;
    width: 100% !important;
    text-align: left !important;
  }
}
</style>
  </head>
  <body class="wr-body" style="margin: 0; padding: 0; background-color: #f8fafc; background: #f8fafc; font-family: Segoe UI, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; background: radial-gradient(circle at top, rgba(16, 185, 129, 0.12), transparent 34%), #f8fafc; color: #0f172a;">
    <div class="wr-preheader" style="font-family: Segoe UI, Arial, sans-serif; display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all;">Use this code to confirm your WiseRank account and finish setting up your recruiter workspace.</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-layout" bgcolor="#f8fafc" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; background-color: #f8fafc;">
      <tr>
        <td align="center" class="wr-wrapper" style="font-family: Segoe UI, Arial, sans-serif; padding: 24px 14px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-shell" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; max-width: 640px;">
            <tr>
              <td class="wr-hero" style="font-family: Segoe UI, Arial, sans-serif; padding: 28px 28px 24px; border-radius: 22px 22px 0 0; background-color: #0f172a; background: radial-gradient(circle at 92% 14%, rgba(110, 231, 183, 0.22), transparent 22%), linear-gradient(135deg, #13253b 0%, #0f172a 58%, #08111c 100%); color: #f8fafc;">
                <table role="presentation" cellpadding="0" cellspacing="0" class="wr-brand-table" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; margin-bottom: 18px;">
  <tr>
    <td class="wr-brand-mark-cell" width="48" valign="middle" style="font-family: Segoe UI, Arial, sans-serif; width: 48px; vertical-align: middle;">
      <!--[if mso]>
      <div style="width:46px;height:46px;line-height:46px;text-align:center;border-radius:14px;background:#0f172a;color:#ffffff;font-family:Segoe UI,Arial,sans-serif;font-size:20px;font-weight:800;">W</div>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width="46"
        height="46"
        class="wr-brand-svg"
        aria-hidden="true"
       style="display: block; width: 46px; height: 46px;">
        <defs>
          <linearGradient id="wrBrandTile" x1="8" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stop-color="#13253B" />
            <stop offset="0.55" stop-color="#0F172A" />
            <stop offset="1" stop-color="#08111C" />
          </linearGradient>
          <radialGradient id="wrBrandGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(46 14) rotate(139) scale(31 28)">
            <stop stop-color="#6EE7B7" stop-opacity="0.95" />
            <stop offset="1" stop-color="#6EE7B7" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="wrBrandRing" x1="12" y1="16" x2="50" y2="48" gradientUnits="userSpaceOnUse">
            <stop stop-color="#A7F3D0" stop-opacity="0.25" />
            <stop offset="0.55" stop-color="#34D399" stop-opacity="0.85" />
            <stop offset="1" stop-color="#ECFDF5" stop-opacity="0.28" />
          </linearGradient>
          <linearGradient id="wrBrandSweep" x1="14" y1="24" x2="51" y2="35" gradientUnits="userSpaceOnUse">
            <stop stop-color="#34D399" stop-opacity="0.18" />
            <stop offset="0.55" stop-color="#A7F3D0" stop-opacity="0.95" />
            <stop offset="1" stop-color="#F8FAFC" stop-opacity="0.22" />
          </linearGradient>
          <linearGradient id="wrBrandEdge" x1="10" y1="8" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stop-color="#86EFAC" stop-opacity="0.55" />
            <stop offset="1" stop-color="#F8FAFC" stop-opacity="0.1" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#wrBrandTile)" />
        <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#wrBrandGlow)" />
        <rect x="4.5" y="4.5" width="55" height="55" rx="17.5" stroke="url(#wrBrandEdge)" />
        <circle cx="32" cy="33" r="18.5" stroke="url(#wrBrandRing)" stroke-width="2.5" />
        <path
          d="M14 35.5C18.2 27.1667 24.2 23 32 23C39.8 23 45.8 27.1667 50 35.5"
          stroke="url(#wrBrandSweep)"
          stroke-width="3.2"
          stroke-linecap="round"
        />
        <path
          d="M16.5 20.5L24 42L32 28.5L40 42L47.5 20.5"
          stroke="#F8FAFC"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="32" cy="15.5" r="5.5" fill="#34D399" />
        <path
          d="M29.5 15.7L31.2 17.5L34.7 13.6"
          stroke="#052E26"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <!--<![endif]-->
    </td>
    <td class="wr-brand-copy-cell" valign="middle" style="font-family: Segoe UI, Arial, sans-serif; padding-left: 12px; vertical-align: middle;">
      <div class="wr-brand-title" style="font-family: Segoe UI, Arial, sans-serif; font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: #f8fafc;">WiseRank</div>
      <div class="wr-brand-subtitle" style="font-family: Segoe UI, Arial, sans-serif; margin-top: 3px; font-size: 12px; color: rgba(248, 250, 252, 0.72);">Recruiter Workspace</div>
    </td>
  </tr>
</table>

                <div class="wr-kicker" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; margin-bottom: 14px; padding: 7px 12px; border: 1px solid rgba(167, 243, 208, 0.16); border-radius: 999px; background-color: rgba(16, 185, 129, 0.14); background: rgba(16, 185, 129, 0.14); color: #a7f3d0; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">Account Verification</div>
                <h1 class="wr-title" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 30px; line-height: 1.14; letter-spacing: -0.04em; color: #f8fafc;">Confirm your email and unlock WiseRank</h1>
                <p class="wr-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 15px; line-height: 1.65; color: rgba(241, 245, 249, 0.84);">
                  Hi ${newUser.user_name}, use this 6-digit code to activate the recruiter workspace linked
                  to ${newUser.user_email}
                </p>

                <div class="wr-code-panel wr-code-panel-dark" style="font-family: Segoe UI, Arial, sans-serif; margin-top: 18px; padding: 18px 20px; border-radius: 18px; border: 1px solid rgba(255, 255, 255, 0.12); background-color: rgba(255, 255, 255, 0.08); background: rgba(255, 255, 255, 0.08);">
                  <p class="wr-label wr-label-inverse" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(248, 250, 252, 0.74);">6-digit code</p>
                  <p class="wr-code wr-code-inverse" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-family: Consolas, Courier New, monospace; font-size: 30px; font-weight: 700; letter-spacing: 0.2em; color: #ffffff;">${newUser.sign_otp_token}</p>
                  <p class="wr-helper wr-helper-inverse" style="font-family: Segoe UI, Arial, sans-serif; margin: 10px 0 0; font-size: 13px; line-height: 1.6; color: rgba(241, 245, 249, 0.76);">
                    Expires in 10 minutes. Enter it in the confirmation screen to finish setup.
                  </p>
                </div>

                <div class="wr-hero-actions" style="font-family: Segoe UI, Arial, sans-serif; margin-top: 18px;">
                  <a class="wr-button" href=${confirmation_link} target="_blank" rel="noreferrer" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; display: inline-block; padding: 13px 20px; border-radius: 10px; background-color: #10b981; background: #10b981; color: #ffffff !important; font-size: 14px; font-weight: 700; text-align: center;">
                    Open confirmation screen
                  </a>
                </div>

                <p class="wr-fallback-link" style="font-family: Segoe UI, Arial, sans-serif; margin: 12px 0 0; font-size: 12px; line-height: 1.6; color: rgba(241, 245, 249, 0.74); word-break: break-all;">
                  Button not working? Copy this link into your browser:<br />
                  <a class="wr-link-light" href=${confirmation_link} target="_blank" rel="noreferrer" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; color: #d1fae5 !important; font-weight: 700; text-decoration: underline;">https://app.rankwise.dev/register</a>
                </p>
              </td>
            </tr>

            <tr>
              <td class="wr-section wr-section-first" style="font-family: Segoe UI, Arial, sans-serif; padding: 0 24px 24px; background-color: #ffffff; background: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding-top: 24px;">
                <div class="wr-surface" style="font-family: Segoe UI, Arial, sans-serif; margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background-color: #ffffff; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                  <p class="wr-heading" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a;">Finish in 3 quick steps</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-step-table" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%;">
                    <tr>
                      <td class="wr-step-cell" style="font-family: Segoe UI, Arial, sans-serif; width: 33.33%; padding-right: 10px; vertical-align: top;">
                        <div class="wr-step-card" style="font-family: Segoe UI, Arial, sans-serif; padding: 16px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; background: #ffffff;">
                          <span class="wr-step-number" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background-color: rgba(16, 185, 129, 0.12); background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">1</span>
                          <p class="wr-step-title" style="font-family: Segoe UI, Arial, sans-serif; margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #0f172a;">Open the confirmation screen</p>
                          <p class="wr-step-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.65; color: #64748b;">Use the button above to go straight into the account setup flow.</p>
                        </div>
                      </td>
                      <td class="wr-step-cell" style="font-family: Segoe UI, Arial, sans-serif; width: 33.33%; padding-right: 10px; vertical-align: top;">
                        <div class="wr-step-card" style="font-family: Segoe UI, Arial, sans-serif; padding: 16px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; background: #ffffff;">
                          <span class="wr-step-number" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background-color: rgba(16, 185, 129, 0.12); background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">2</span>
                          <p class="wr-step-title" style="font-family: Segoe UI, Arial, sans-serif; margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #0f172a;">Paste the code</p>
                          <p class="wr-step-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.65; color: #64748b;">Enter the 6-digit code exactly as shown so we can verify the email owner.</p>
                        </div>
                      </td>
                      <td class="wr-step-cell wr-step-cell-last" style="font-family: Segoe UI, Arial, sans-serif; width: 33.33%; padding-right: 10px; vertical-align: top; padding-right: 0;">
                        <div class="wr-step-card" style="font-family: Segoe UI, Arial, sans-serif; padding: 16px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; background: #ffffff;">
                          <span class="wr-step-number" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background-color: rgba(16, 185, 129, 0.12); background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">3</span>
                          <p class="wr-step-title" style="font-family: Segoe UI, Arial, sans-serif; margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #0f172a;">Start using the workspace</p>
                          <p class="wr-step-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.65; color: #64748b;">Once confirmed, your recruiter dashboard becomes active right away.</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>

                <div class="wr-surface wr-surface-muted" style="font-family: Segoe UI, Arial, sans-serif; margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background-color: #ffffff; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); background-color: #f3fbf7; background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.02) 100%); border-color: rgba(16, 185, 129, 0.18);">
                  <p class="wr-heading" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a;">Why you received this</p>
                  <p class="wr-text" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 15px; line-height: 1.68; color: #475569;">
                    A WiseRank account was created using ${newUser.user_email}. If that was not you,
                    you can ignore this email and the workspace will stay unverified.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td class="wr-section wr-section-last" style="font-family: Segoe UI, Arial, sans-serif; padding: 0 24px 24px; background-color: #ffffff; background: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding-bottom: 28px; border-bottom: 1px solid #e2e8f0; border-radius: 0 0 22px 22px;">
                <div class="wr-surface" style="font-family: Segoe UI, Arial, sans-serif; margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background-color: #ffffff; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                  <p class="wr-heading" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a;">Need a hand?</p>
                  <p class="wr-text" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 15px; line-height: 1.68; color: #475569;">
                    Reach out at <a class="wr-link" href="mailto:hello@rankwise.io" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; color: #059669 !important; font-weight: 700; text-decoration: underline;">hello@rankwise.io</a> if
                    you need help completing verification or securing your account.
                  </p>
                </div>

                <div class="wr-divider" style="font-family: Segoe UI, Arial, sans-serif; height: 1px; background-color: #e2e8f0; background: #e2e8f0; line-height: 1px; font-size: 1px;">&nbsp;</div>

                <div class="wr-footer" style="font-family: Segoe UI, Arial, sans-serif; padding: 18px 10px 0; text-align: center;">
                  <p class="wr-footer-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 12px; line-height: 1.8; color: #64748b;">
                    Security note: verification codes should only be used on WiseRank screens you
                    opened intentionally.
                  </p>
                  <p class="wr-footer-links" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 12px; line-height: 1.8; color: #64748b; margin-top: 8px;">
                    WiseRank &middot; Kigali, Rwanda &middot; &copy; 2026
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
  </body>
</html>
`,
    });
    let rec_info = { user_id: newUser._id };
    if (!env.ACCESS_SECRET)
      return res.status(500).json({ server_error: "Internal server error" });
    const signup_reference_token = jwt.sign(rec_info, env.ACCESS_SECRET, {
      expiresIn: "10m",
      algorithm: "HS256",
    });
    res.cookie("signup_reference_token", signup_reference_token, {
      maxAge: 10 * 60 * 1000,
      httpOnly: true,
      sameSite: true,
    });
    res.status(201).json({ success: "Sign up successful" });
  } catch (error) {
    controlDebug("Error sign up controller");
    console.error(error);
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
    const signup_reference_token = req.cookies.signup_reference_token;
    if (!signup_reference_token) {
      res
        .status(401)
        .json({ expired_error: "Required cookie corrupted or expired" });
    }
    if (!env.ACCESS_SECRET)
      return res.status(500).json({ server_error: "Internal server error" });
    const payload = jwt.verify(signup_reference_token, env.ACCESS_SECRET, {
      algorithms: ["HS256"],
    });

    if (!payload) {
      return res.status(500).json({ server_error: "Internal server error" });
    }
    if (typeof payload == "string")
      return res.status(500).json({ server_error: "Internal server errror" });
    const user = await User.findOne({ _id: payload.user_id });
    if (!user) {
      return res.status(500).json({ server_error: "Internal server error" });
    }
    if (token !== user.sign_otp_token) {
      return res
        .status(401)
        .json({ auth_error: "Invalid one time password entered" });
    }
    user.isVerified = true;
    let user_first_name = user.user_name.split(" ")[0];
    const user_cookie_details = { userId: user._id };
    if (ACCESS_SECRET && REFRESH_SECRET) {
      const access_token = jwt.sign(user_cookie_details, ACCESS_SECRET, {
        algorithm: "HS256",
        expiresIn: "1h",
      });
      const refresh_token = jwt.sign(user_cookie_details, REFRESH_SECRET, {
        algorithm: "HS256",
        expiresIn: "14d",
      });

      res.cookie("access_token", access_token, {
        httpOnly: true,
        maxAge: 60 * 60 * 1000,
        sameSite: true,
      });
      user.refresh_token = refresh_token;
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: env.USER_EMAIL,
          pass: env.USER_PASS,
        },
      });
      transporter.sendMail({
        from: env.USER_EMAIL,
        to: user.user_email,
        text: `Welcome to WiseRank`,
        html: `<!doctype html>
<html lang="en" style="margin: 0; padding: 0; background-color: #f8fafc; background: #f8fafc;">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Welcome to WiseRank</title>
    
  <style>
@media only screen and (max-width: 640px) {
  .wr-wrapper {
    padding: 14px 8px 24px;
  }

  .wr-hero {
    padding: 24px 20px 20px;
    border-radius: 18px 18px 0 0;
  }

  .wr-title {
    font-size: 27px;
  }

  .wr-code {
    font-size: 24px;
    letter-spacing: 0.14em;
  }

  .wr-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .wr-section-last {
    border-radius: 0 0 18px 18px;
  }

  .wr-surface,
  .wr-step-card,
  .wr-list-card {
    padding: 16px;
  }

  .wr-inline-stat-cell,
  .wr-step-cell {
    display: block !important;
    width: 100% !important;
    padding-right: 0 !important;
    padding-bottom: 10px !important;
  }

  .wr-inline-stat-cell-last,
  .wr-step-cell-last {
    padding-bottom: 0 !important;
  }

  .wr-list-row td {
    display: block !important;
    width: 100% !important;
    text-align: left !important;
  }
}
</style>
  </head>
  <body class="wr-body" style="margin: 0; padding: 0; background-color: #f8fafc; background: #f8fafc; font-family: Segoe UI, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; background: radial-gradient(circle at top, rgba(16, 185, 129, 0.12), transparent 34%), #f8fafc; color: #0f172a;">
    <div class="wr-preheader" style="font-family: Segoe UI, Arial, sans-serif; display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all;">Your WiseRank workspace is ready. Start creating roles and screening candidates with explainable AI.</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-layout" bgcolor="#f8fafc" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; background-color: #f8fafc;">
      <tr>
        <td align="center" class="wr-wrapper" style="font-family: Segoe UI, Arial, sans-serif; padding: 24px 14px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-shell" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; max-width: 640px;">
            <tr>
              <td class="wr-hero" style="font-family: Segoe UI, Arial, sans-serif; padding: 28px 28px 24px; border-radius: 22px 22px 0 0; background-color: #0f172a; background: radial-gradient(circle at 92% 14%, rgba(110, 231, 183, 0.22), transparent 22%), linear-gradient(135deg, #13253b 0%, #0f172a 58%, #08111c 100%); color: #f8fafc;">
                <table role="presentation" cellpadding="0" cellspacing="0" class="wr-brand-table" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; margin-bottom: 18px;">
  <tr>
    <td class="wr-brand-mark-cell" width="48" valign="middle" style="font-family: Segoe UI, Arial, sans-serif; width: 48px; vertical-align: middle;">
      <!--[if mso]>
      <div style="width:46px;height:46px;line-height:46px;text-align:center;border-radius:14px;background:#0f172a;color:#ffffff;font-family:Segoe UI,Arial,sans-serif;font-size:20px;font-weight:800;">W</div>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width="46"
        height="46"
        class="wr-brand-svg"
        aria-hidden="true"
       style="display: block; width: 46px; height: 46px;">
        <defs>
          <linearGradient id="wrBrandTile" x1="8" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stop-color="#13253B" />
            <stop offset="0.55" stop-color="#0F172A" />
            <stop offset="1" stop-color="#08111C" />
          </linearGradient>
          <radialGradient id="wrBrandGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(46 14) rotate(139) scale(31 28)">
            <stop stop-color="#6EE7B7" stop-opacity="0.95" />
            <stop offset="1" stop-color="#6EE7B7" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="wrBrandRing" x1="12" y1="16" x2="50" y2="48" gradientUnits="userSpaceOnUse">
            <stop stop-color="#A7F3D0" stop-opacity="0.25" />
            <stop offset="0.55" stop-color="#34D399" stop-opacity="0.85" />
            <stop offset="1" stop-color="#ECFDF5" stop-opacity="0.28" />
          </linearGradient>
          <linearGradient id="wrBrandSweep" x1="14" y1="24" x2="51" y2="35" gradientUnits="userSpaceOnUse">
            <stop stop-color="#34D399" stop-opacity="0.18" />
            <stop offset="0.55" stop-color="#A7F3D0" stop-opacity="0.95" />
            <stop offset="1" stop-color="#F8FAFC" stop-opacity="0.22" />
          </linearGradient>
          <linearGradient id="wrBrandEdge" x1="10" y1="8" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stop-color="#86EFAC" stop-opacity="0.55" />
            <stop offset="1" stop-color="#F8FAFC" stop-opacity="0.1" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#wrBrandTile)" />
        <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#wrBrandGlow)" />
        <rect x="4.5" y="4.5" width="55" height="55" rx="17.5" stroke="url(#wrBrandEdge)" />
        <circle cx="32" cy="33" r="18.5" stroke="url(#wrBrandRing)" stroke-width="2.5" />
        <path
          d="M14 35.5C18.2 27.1667 24.2 23 32 23C39.8 23 45.8 27.1667 50 35.5"
          stroke="url(#wrBrandSweep)"
          stroke-width="3.2"
          stroke-linecap="round"
        />
        <path
          d="M16.5 20.5L24 42L32 28.5L40 42L47.5 20.5"
          stroke="#F8FAFC"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="32" cy="15.5" r="5.5" fill="#34D399" />
        <path
          d="M29.5 15.7L31.2 17.5L34.7 13.6"
          stroke="#052E26"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <!--<![endif]-->
    </td>
    <td class="wr-brand-copy-cell" valign="middle" style="font-family: Segoe UI, Arial, sans-serif; padding-left: 12px; vertical-align: middle;">
      <div class="wr-brand-title" style="font-family: Segoe UI, Arial, sans-serif; font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: #f8fafc;">WiseRank</div>
      <div class="wr-brand-subtitle" style="font-family: Segoe UI, Arial, sans-serif; margin-top: 3px; font-size: 12px; color: rgba(248, 250, 252, 0.72);">Recruiter Workspace</div>
    </td>
  </tr>
</table>

                <div class="wr-kicker" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; margin-bottom: 14px; padding: 7px 12px; border: 1px solid rgba(167, 243, 208, 0.16); border-radius: 999px; background-color: rgba(16, 185, 129, 0.14); background: rgba(16, 185, 129, 0.14); color: #a7f3d0; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">Workspace Ready</div>
                <h1 class="wr-title" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 30px; line-height: 1.14; letter-spacing: -0.04em; color: #f8fafc;">Welcome aboard, ${user_first_name}</h1>
                <p class="wr-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 15px; line-height: 1.65; color: rgba(241, 245, 249, 0.84);">
                  WiseRank Recruiter Workspace is ready. You can now post roles, review applicants, and move
                  faster with explainable AI-assisted shortlists.
                </p>

                <div class="wr-hero-actions" style="font-family: Segoe UI, Arial, sans-serif; margin-top: 18px;">
                  <a class="wr-button" href="https://app.rankwise.dev/dashboard" target="_blank" rel="noreferrer" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; display: inline-block; padding: 13px 20px; border-radius: 10px; background-color: #10b981; background: #10b981; color: #ffffff !important; font-size: 14px; font-weight: 700; text-align: center;">
                    Open dashboard
                  </a>
                </div>
              </td>
            </tr>

            <tr>
              <td class="wr-section wr-section-first" style="font-family: Segoe UI, Arial, sans-serif; padding: 0 24px 24px; background-color: #ffffff; background: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding-top: 24px;">
                <div class="wr-surface" style="font-family: Segoe UI, Arial, sans-serif; margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background-color: #ffffff; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                  <p class="wr-heading" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a;">Start here</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-check-table" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%;">
                    <tr>
                      <td class="wr-check-cell" style="font-family: Segoe UI, Arial, sans-serif; padding-bottom: 12px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-check-row" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%;">
                          <tr>
                            <td class="wr-check-mark-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; width: 34px; padding-right: 10px; vertical-align: top;"><span class="wr-check-mark" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background-color: rgba(16, 185, 129, 0.12); background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">1</span></td>
                            <td class="wr-check-copy-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; vertical-align: top;">
                              <p class="wr-check-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.65; color: #475569;">
                                <strong style="font-family: Segoe UI, Arial, sans-serif;">Create your first role.</strong> Capture the job title, must-haves, deal-breakers, and shortlist size.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="wr-check-cell" style="font-family: Segoe UI, Arial, sans-serif; padding-bottom: 12px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-check-row" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%;">
                          <tr>
                            <td class="wr-check-mark-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; width: 34px; padding-right: 10px; vertical-align: top;"><span class="wr-check-mark" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background-color: rgba(16, 185, 129, 0.12); background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">2</span></td>
                            <td class="wr-check-copy-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; vertical-align: top;">
                              <p class="wr-check-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.65; color: #475569;">
                                <strong style="font-family: Segoe UI, Arial, sans-serif;">Add your screening criteria.</strong> Make the AI review align with how your team actually hires.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="wr-check-cell" style="font-family: Segoe UI, Arial, sans-serif; padding-bottom: 12px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-check-row" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%;">
                          <tr>
                            <td class="wr-check-mark-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; width: 34px; padding-right: 10px; vertical-align: top;"><span class="wr-check-mark" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background-color: rgba(16, 185, 129, 0.12); background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">3</span></td>
                            <td class="wr-check-copy-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; vertical-align: top;">
                              <p class="wr-check-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.65; color: #475569;">
                                <strong style="font-family: Segoe UI, Arial, sans-serif;">Review shortlist reasoning.</strong> Compare top candidates with clearer context before you move to interviews.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>

                <div class="wr-surface wr-surface-muted" style="font-family: Segoe UI, Arial, sans-serif; margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background-color: #ffffff; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); background-color: #f3fbf7; background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.02) 100%); border-color: rgba(16, 185, 129, 0.18);">
                  <p class="wr-heading" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a;">Helpful shortcuts</p>
                  <p class="wr-text" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 15px; line-height: 1.68; color: #475569;">
                    Jump straight to your <a class="wr-link" href="https://app.rankwise.dev/dashboard" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; color: #059669 !important; font-weight: 700; text-decoration: underline;">dashboard</a>,
                    create a <a class="wr-link" href="https://app.rankwise.dev/dashboard/jobs/new" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; color: #059669 !important; font-weight: 700; text-decoration: underline;">new role</a>, or reach the team at
                    <a class="wr-link" href="mailto:hello@rankwise.io" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; color: #059669 !important; font-weight: 700; text-decoration: underline;">hello@rankwise.io</a>.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td class="wr-section wr-section-last" style="font-family: Segoe UI, Arial, sans-serif; padding: 0 24px 24px; background-color: #ffffff; background: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding-bottom: 28px; border-bottom: 1px solid #e2e8f0; border-radius: 0 0 22px 22px;">
                <div class="wr-surface" style="font-family: Segoe UI, Arial, sans-serif; margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background-color: #ffffff; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                  <p class="wr-heading" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a;">What WiseRank is optimized for</p>
                  <p class="wr-text" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 15px; line-height: 1.68; color: #475569;">
                    Recruiter clarity, visible scoring logic, and calmer hiring decisions. The product
                    and these emails should both feel direct, lightweight, and easy to act on.
                  </p>
                </div>

                <div class="wr-divider" style="font-family: Segoe UI, Arial, sans-serif; height: 1px; background-color: #e2e8f0; background: #e2e8f0; line-height: 1px; font-size: 1px;">&nbsp;</div>

                <div class="wr-footer" style="font-family: Segoe UI, Arial, sans-serif; padding: 18px 10px 0; text-align: center;">
                  <p class="wr-footer-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 12px; line-height: 1.8; color: #64748b;">Thanks for choosing WiseRank.</p>
                  <p class="wr-footer-links" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 12px; line-height: 1.8; color: #64748b; margin-top: 8px;">
                    WiseRank &middot; Kigali, Rwanda &middot; &copy; 2026
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
  </body>
</html>
`,
      });
      await user.save();
      res.status(200).json({ success: "Confirmation successful" });
    }
  } catch (error) {
    controlDebug("Error in post request confirm controller");
    console.error(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export const confirm_get = async (req: I_Request, res: Response) => {
  try {
    let conf_id;
    if (req.params) {
      conf_id = req.params.confirmation_link_id as string;
    }
    const signup_reference_token = req.cookies.signup_reference_token;
    if (!signup_reference_token) {
      return res
        .status(401)
        .json({ expired_error: "Required handler expired" });
    }
    if (!env.ACCESS_SECRET) {
      throw new Error("Could not load environment variables");
    }
    let payload = jwt.verify(signup_reference_token, env.ACCESS_SECRET, {
      algorithms: ["HS256"],
    }) as jwt.JwtPayload;
    if (!conf_id) {
      return res
        .status(400)
        .json({ data_error: "Url incorrect check the url and try again" });
    }
    if (conf_id !== payload.user_id) {
      return res.status(401).json({
        data_error: "Required handler dependencies expired or missing",
      });
    }
    const user = await User.findOne({ confirmation_link_id: conf_id });
    if (user) {
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
        let user_first_name = user.user_name.split(" ")[0];
        user.refresh_token = refresh_token;
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: env.USER_EMAIL,
            pass: env.USER_PASS,
          },
        });
        transporter.sendMail({
          from: env.USER_EMAIL,
          to: user.user_email,
          text: `Welcome to WiseRank`,
          html: `<!doctype html>
<html lang="en" style="margin: 0; padding: 0; background-color: #f8fafc; background: #f8fafc;">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Welcome to WiseRank</title>
    
  <style>
@media only screen and (max-width: 640px) {
  .wr-wrapper {
    padding: 14px 8px 24px;
  }

  .wr-hero {
    padding: 24px 20px 20px;
    border-radius: 18px 18px 0 0;
  }

  .wr-title {
    font-size: 27px;
  }

  .wr-code {
    font-size: 24px;
    letter-spacing: 0.14em;
  }

  .wr-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .wr-section-last {
    border-radius: 0 0 18px 18px;
  }

  .wr-surface,
  .wr-step-card,
  .wr-list-card {
    padding: 16px;
  }

  .wr-inline-stat-cell,
  .wr-step-cell {
    display: block !important;
    width: 100% !important;
    padding-right: 0 !important;
    padding-bottom: 10px !important;
  }

  .wr-inline-stat-cell-last,
  .wr-step-cell-last {
    padding-bottom: 0 !important;
  }

  .wr-list-row td {
    display: block !important;
    width: 100% !important;
    text-align: left !important;
  }
}
</style>
  </head>
  <body class="wr-body" style="margin: 0; padding: 0; background-color: #f8fafc; background: #f8fafc; font-family: Segoe UI, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; background: radial-gradient(circle at top, rgba(16, 185, 129, 0.12), transparent 34%), #f8fafc; color: #0f172a;">
    <div class="wr-preheader" style="font-family: Segoe UI, Arial, sans-serif; display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all;">Your WiseRank workspace is ready. Start creating roles and screening candidates with explainable AI.</div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-layout" bgcolor="#f8fafc" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; background-color: #f8fafc;">
      <tr>
        <td align="center" class="wr-wrapper" style="font-family: Segoe UI, Arial, sans-serif; padding: 24px 14px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-shell" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; max-width: 640px;">
            <tr>
              <td class="wr-hero" style="font-family: Segoe UI, Arial, sans-serif; padding: 28px 28px 24px; border-radius: 22px 22px 0 0; background-color: #0f172a; background: radial-gradient(circle at 92% 14%, rgba(110, 231, 183, 0.22), transparent 22%), linear-gradient(135deg, #13253b 0%, #0f172a 58%, #08111c 100%); color: #f8fafc;">
                <table role="presentation" cellpadding="0" cellspacing="0" class="wr-brand-table" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; margin-bottom: 18px;">
  <tr>
    <td class="wr-brand-mark-cell" width="48" valign="middle" style="font-family: Segoe UI, Arial, sans-serif; width: 48px; vertical-align: middle;">
      <!--[if mso]>
      <div style="width:46px;height:46px;line-height:46px;text-align:center;border-radius:14px;background:#0f172a;color:#ffffff;font-family:Segoe UI,Arial,sans-serif;font-size:20px;font-weight:800;">W</div>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width="46"
        height="46"
        class="wr-brand-svg"
        aria-hidden="true"
       style="display: block; width: 46px; height: 46px;">
        <defs>
          <linearGradient id="wrBrandTile" x1="8" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stop-color="#13253B" />
            <stop offset="0.55" stop-color="#0F172A" />
            <stop offset="1" stop-color="#08111C" />
          </linearGradient>
          <radialGradient id="wrBrandGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(46 14) rotate(139) scale(31 28)">
            <stop stop-color="#6EE7B7" stop-opacity="0.95" />
            <stop offset="1" stop-color="#6EE7B7" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="wrBrandRing" x1="12" y1="16" x2="50" y2="48" gradientUnits="userSpaceOnUse">
            <stop stop-color="#A7F3D0" stop-opacity="0.25" />
            <stop offset="0.55" stop-color="#34D399" stop-opacity="0.85" />
            <stop offset="1" stop-color="#ECFDF5" stop-opacity="0.28" />
          </linearGradient>
          <linearGradient id="wrBrandSweep" x1="14" y1="24" x2="51" y2="35" gradientUnits="userSpaceOnUse">
            <stop stop-color="#34D399" stop-opacity="0.18" />
            <stop offset="0.55" stop-color="#A7F3D0" stop-opacity="0.95" />
            <stop offset="1" stop-color="#F8FAFC" stop-opacity="0.22" />
          </linearGradient>
          <linearGradient id="wrBrandEdge" x1="10" y1="8" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stop-color="#86EFAC" stop-opacity="0.55" />
            <stop offset="1" stop-color="#F8FAFC" stop-opacity="0.1" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#wrBrandTile)" />
        <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#wrBrandGlow)" />
        <rect x="4.5" y="4.5" width="55" height="55" rx="17.5" stroke="url(#wrBrandEdge)" />
        <circle cx="32" cy="33" r="18.5" stroke="url(#wrBrandRing)" stroke-width="2.5" />
        <path
          d="M14 35.5C18.2 27.1667 24.2 23 32 23C39.8 23 45.8 27.1667 50 35.5"
          stroke="url(#wrBrandSweep)"
          stroke-width="3.2"
          stroke-linecap="round"
        />
        <path
          d="M16.5 20.5L24 42L32 28.5L40 42L47.5 20.5"
          stroke="#F8FAFC"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="32" cy="15.5" r="5.5" fill="#34D399" />
        <path
          d="M29.5 15.7L31.2 17.5L34.7 13.6"
          stroke="#052E26"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <!--<![endif]-->
    </td>
    <td class="wr-brand-copy-cell" valign="middle" style="font-family: Segoe UI, Arial, sans-serif; padding-left: 12px; vertical-align: middle;">
      <div class="wr-brand-title" style="font-family: Segoe UI, Arial, sans-serif; font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: #f8fafc;">WiseRank</div>
      <div class="wr-brand-subtitle" style="font-family: Segoe UI, Arial, sans-serif; margin-top: 3px; font-size: 12px; color: rgba(248, 250, 252, 0.72);">Recruiter Workspace</div>
    </td>
  </tr>
</table>

                <div class="wr-kicker" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; margin-bottom: 14px; padding: 7px 12px; border: 1px solid rgba(167, 243, 208, 0.16); border-radius: 999px; background-color: rgba(16, 185, 129, 0.14); background: rgba(16, 185, 129, 0.14); color: #a7f3d0; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">Workspace Ready</div>
                <h1 class="wr-title" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 30px; line-height: 1.14; letter-spacing: -0.04em; color: #f8fafc;">Welcome aboard, ${user_first_name}</h1>
                <p class="wr-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 15px; line-height: 1.65; color: rgba(241, 245, 249, 0.84);">
                  WiseRank Recruiter Workspace is ready. You can now post roles, review applicants, and move
                  faster with explainable AI-assisted shortlists.
                </p>

                <div class="wr-hero-actions" style="font-family: Segoe UI, Arial, sans-serif; margin-top: 18px;">
                  <a class="wr-button" href="https://app.rankwise.dev/dashboard" target="_blank" rel="noreferrer" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; display: inline-block; padding: 13px 20px; border-radius: 10px; background-color: #10b981; background: #10b981; color: #ffffff !important; font-size: 14px; font-weight: 700; text-align: center;">
                    Open dashboard
                  </a>
                </div>
              </td>
            </tr>

            <tr>
              <td class="wr-section wr-section-first" style="font-family: Segoe UI, Arial, sans-serif; padding: 0 24px 24px; background-color: #ffffff; background: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding-top: 24px;">
                <div class="wr-surface" style="font-family: Segoe UI, Arial, sans-serif; margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background-color: #ffffff; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                  <p class="wr-heading" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a;">Start here</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-check-table" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%;">
                    <tr>
                      <td class="wr-check-cell" style="font-family: Segoe UI, Arial, sans-serif; padding-bottom: 12px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-check-row" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%;">
                          <tr>
                            <td class="wr-check-mark-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; width: 34px; padding-right: 10px; vertical-align: top;"><span class="wr-check-mark" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background-color: rgba(16, 185, 129, 0.12); background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">1</span></td>
                            <td class="wr-check-copy-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; vertical-align: top;">
                              <p class="wr-check-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.65; color: #475569;">
                                <strong style="font-family: Segoe UI, Arial, sans-serif;">Create your first role.</strong> Capture the job title, must-haves, deal-breakers, and shortlist size.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="wr-check-cell" style="font-family: Segoe UI, Arial, sans-serif; padding-bottom: 12px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-check-row" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%;">
                          <tr>
                            <td class="wr-check-mark-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; width: 34px; padding-right: 10px; vertical-align: top;"><span class="wr-check-mark" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background-color: rgba(16, 185, 129, 0.12); background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">2</span></td>
                            <td class="wr-check-copy-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; vertical-align: top;">
                              <p class="wr-check-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.65; color: #475569;">
                                <strong style="font-family: Segoe UI, Arial, sans-serif;">Add your screening criteria.</strong> Make the AI review align with how your team actually hires.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td class="wr-check-cell" style="font-family: Segoe UI, Arial, sans-serif; padding-bottom: 12px;">
                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-check-row" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%;">
                          <tr>
                            <td class="wr-check-mark-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; width: 34px; padding-right: 10px; vertical-align: top;"><span class="wr-check-mark" style="font-family: Segoe UI, Arial, sans-serif; display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background-color: rgba(16, 185, 129, 0.12); background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">3</span></td>
                            <td class="wr-check-copy-cell" valign="top" style="font-family: Segoe UI, Arial, sans-serif; vertical-align: top;">
                              <p class="wr-check-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 14px; line-height: 1.65; color: #475569;">
                                <strong style="font-family: Segoe UI, Arial, sans-serif;">Review shortlist reasoning.</strong> Compare top candidates with clearer context before you move to interviews.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>

                <div class="wr-surface wr-surface-muted" style="font-family: Segoe UI, Arial, sans-serif; margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background-color: #ffffff; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); background-color: #f3fbf7; background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.02) 100%); border-color: rgba(16, 185, 129, 0.18);">
                  <p class="wr-heading" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a;">Helpful shortcuts</p>
                  <p class="wr-text" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 15px; line-height: 1.68; color: #475569;">
                    Jump straight to your <a class="wr-link" href="https://app.rankwise.dev/dashboard" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; color: #059669 !important; font-weight: 700; text-decoration: underline;">dashboard</a>,
                    create a <a class="wr-link" href="https://app.rankwise.dev/dashboard/jobs/new" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; color: #059669 !important; font-weight: 700; text-decoration: underline;">new role</a>, or reach the team at
                    <a class="wr-link" href="mailto:hello@rankwise.io" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; color: #059669 !important; font-weight: 700; text-decoration: underline;">hello@rankwise.io</a>.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td class="wr-section wr-section-last" style="font-family: Segoe UI, Arial, sans-serif; padding: 0 24px 24px; background-color: #ffffff; background: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; padding-bottom: 28px; border-bottom: 1px solid #e2e8f0; border-radius: 0 0 22px 22px;">
                <div class="wr-surface" style="font-family: Segoe UI, Arial, sans-serif; margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background-color: #ffffff; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                  <p class="wr-heading" style="font-family: Segoe UI, Arial, sans-serif; margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a;">What WiseRank is optimized for</p>
                  <p class="wr-text" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 15px; line-height: 1.68; color: #475569;">
                    Recruiter clarity, visible scoring logic, and calmer hiring decisions. The product
                    and these emails should both feel direct, lightweight, and easy to act on.
                  </p>
                </div>

                <div class="wr-divider" style="font-family: Segoe UI, Arial, sans-serif; height: 1px; background-color: #e2e8f0; background: #e2e8f0; line-height: 1px; font-size: 1px;">&nbsp;</div>

                <div class="wr-footer" style="font-family: Segoe UI, Arial, sans-serif; padding: 18px 10px 0; text-align: center;">
                  <p class="wr-footer-copy" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 12px; line-height: 1.8; color: #64748b;">Thanks for choosing WiseRank.</p>
                  <p class="wr-footer-links" style="font-family: Segoe UI, Arial, sans-serif; margin: 0; font-size: 12px; line-height: 1.8; color: #64748b; margin-top: 8px;">
                    WiseRank &middot; Kigali, Rwanda &middot; &copy; 2026
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
  </body>
</html>
`,
        });
        await user.save();
        res.status(200).json({ success: "Confirmation successful" });
      }
    }
  } catch (error) {
    controlDebug("Error in get reuest confirm  controller");
    console.error(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export const logIn = async (req: Request, res: Response) => {
  try {
    const { reqBody }: { reqBody: Login } = req.body;
    const user_details = loginSchema.parse(reqBody);
    const user = await User.findOne({ user_email: user_details.user_email });
    if (!user) {
      return res.status(404).json({
        data_error: "User is not found.Kindly consider creating an account",
      });
    }
    if (user_details.user_pass !== user_details.user_pass_conf) {
      return res
        .status(400)
        .json({ input_error: "Passwords must be the same" });
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
    res.status(200).json({ success: "Login successful" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ input_error: "Input requirements not fulfilled" });
    }
    controlDebug("Error in login controller");
    console.error(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};

export const forgot = async (req: I_Request, res: Response) => {
  try {
    const { reqBody }: { reqBody: Forgot } = req.body;
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
    const recovery_reference_token = jwt.sign(rec_info, env.ACCESS_SECRET, {
      expiresIn: "10m",
    });
    res.cookie("recovery_reference_token", recovery_reference_token, {
      maxAge: 10 * 60 * 1000,
      httpOnly: true,
      sameSite: true,
    });
    let reset_pass_token = crypto
      .randomInt(1000000)
      .toString()
      .padStart(6, "0");
    reset_pass_token = await bcrypt.hash(reset_pass_token, 5);
    user.pass_token = reset_pass_token;
    res.status(200).json({ success: "OTP token sent" });
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: env.USER_EMAIL,
        pass: env.USER_PASS,
      },
    });

    transporter.sendMail({
      from: env.USER_EMAIL,
      to: user.user_email,
      text: `Here is your password resest token ${reset_pass_token}`,
      html: `<!doctype html>
<html
  lang="en"
  style="margin: 0; padding: 0; background-color: #f8fafc; background: #f8fafc"
>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Reset your WiseRank password</title>

    <style>
      @media only screen and (max-width: 640px) {
        .wr-wrapper {
          padding: 14px 8px 24px;
        }

        .wr-hero {
          padding: 24px 20px 20px;
          border-radius: 18px 18px 0 0;
        }

        .wr-title {
          font-size: 27px;
        }

        .wr-code {
          font-size: 24px;
          letter-spacing: 0.14em;
        }

        .wr-section {
          padding-left: 16px;
          padding-right: 16px;
        }

        .wr-section-last {
          border-radius: 0 0 18px 18px;
        }

        .wr-surface,
        .wr-step-card,
        .wr-list-card {
          padding: 16px;
        }

        .wr-inline-stat-cell,
        .wr-step-cell {
          display: block !important;
          width: 100% !important;
          padding-right: 0 !important;
          padding-bottom: 10px !important;
        }

        .wr-inline-stat-cell-last,
        .wr-step-cell-last {
          padding-bottom: 0 !important;
        }

        .wr-list-row td {
          display: block !important;
          width: 100% !important;
          text-align: left !important;
        }
      }
    </style>
  </head>
  <body
    class="wr-body"
    style="
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      background: #f8fafc;
      font-family:
        Segoe UI,
        Arial,
        sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      background:
        radial-gradient(
          circle at top,
          rgba(16, 185, 129, 0.12),
          transparent 34%
        ),
        #f8fafc;
      color: #0f172a;
    "
  >
    <div
      class="wr-preheader"
      style="
        font-family:
          Segoe UI,
          Arial,
          sans-serif;
        display: none !important;
        visibility: hidden;
        opacity: 0;
        color: transparent;
        height: 0;
        width: 0;
        overflow: hidden;
        mso-hide: all;
      "
    >
      A password reset was requested for your WiseRank account. Verify the
      request and choose a new password.
    </div>

    <table
      role="presentation"
      width="100%"
      cellpadding="0"
      cellspacing="0"
      class="wr-layout"
      bgcolor="#f8fafc"
      style="
        font-family:
          Segoe UI,
          Arial,
          sans-serif;
        border-collapse: collapse;
        border-spacing: 0;
        mso-table-lspace: 0;
        mso-table-rspace: 0;
        width: 100%;
        background-color: #f8fafc;
      "
    >
      <tr>
        <td
          align="center"
          class="wr-wrapper"
          style="
            font-family:
              Segoe UI,
              Arial,
              sans-serif;
            padding: 24px 14px 36px;
          "
        >
          <table
            role="presentation"
            width="100%"
            cellpadding="0"
            cellspacing="0"
            class="wr-shell"
            style="
              font-family:
                Segoe UI,
                Arial,
                sans-serif;
              border-collapse: collapse;
              border-spacing: 0;
              mso-table-lspace: 0;
              mso-table-rspace: 0;
              width: 100%;
              max-width: 640px;
            "
          >
            <tr>
              <td
                class="wr-hero"
                style="
                  font-family:
                    Segoe UI,
                    Arial,
                    sans-serif;
                  padding: 28px 28px 24px;
                  border-radius: 22px 22px 0 0;
                  background-color: #0f172a;
                  background:
                    radial-gradient(
                      circle at 92% 14%,
                      rgba(110, 231, 183, 0.22),
                      transparent 22%
                    ),
                    linear-gradient(
                      135deg,
                      #13253b 0%,
                      #0f172a 58%,
                      #08111c 100%
                    );
                  color: #f8fafc;
                "
              >
                <table
                  role="presentation"
                  cellpadding="0"
                  cellspacing="0"
                  class="wr-brand-table"
                  style="
                    font-family:
                      Segoe UI,
                      Arial,
                      sans-serif;
                    border-collapse: collapse;
                    border-spacing: 0;
                    mso-table-lspace: 0;
                    mso-table-rspace: 0;
                    margin-bottom: 18px;
                  "
                >
                  <tr>
                    <td
                      class="wr-brand-mark-cell"
                      width="48"
                      valign="middle"
                      style="
                        font-family:
                          Segoe UI,
                          Arial,
                          sans-serif;
                        width: 48px;
                        vertical-align: middle;
                      "
                    >
                      <!--[if mso]>
                        <div
                          style="
                            width: 46px;
                            height: 46px;
                            line-height: 46px;
                            text-align: center;
                            border-radius: 14px;
                            background: #0f172a;
                            color: #ffffff;
                            font-family:
                              Segoe UI,
                              Arial,
                              sans-serif;
                            font-size: 20px;
                            font-weight: 800;
                          "
                        >
                          W
                        </div>
                      <![endif]-->
                      <!--[if !mso]><!-- -->
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 64 64"
                        width="46"
                        height="46"
                        class="wr-brand-svg"
                        aria-hidden="true"
                        style="display: block; width: 46px; height: 46px"
                      >
                        <defs>
                          <linearGradient
                            id="wrBrandTile"
                            x1="8"
                            y1="6"
                            x2="58"
                            y2="58"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stop-color="#13253B" />
                            <stop offset="0.55" stop-color="#0F172A" />
                            <stop offset="1" stop-color="#08111C" />
                          </linearGradient>
                          <radialGradient
                            id="wrBrandGlow"
                            cx="0"
                            cy="0"
                            r="1"
                            gradientUnits="userSpaceOnUse"
                            gradientTransform="translate(46 14) rotate(139) scale(31 28)"
                          >
                            <stop stop-color="#6EE7B7" stop-opacity="0.95" />
                            <stop
                              offset="1"
                              stop-color="#6EE7B7"
                              stop-opacity="0"
                            />
                          </radialGradient>
                          <linearGradient
                            id="wrBrandRing"
                            x1="12"
                            y1="16"
                            x2="50"
                            y2="48"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stop-color="#A7F3D0" stop-opacity="0.25" />
                            <stop
                              offset="0.55"
                              stop-color="#34D399"
                              stop-opacity="0.85"
                            />
                            <stop
                              offset="1"
                              stop-color="#ECFDF5"
                              stop-opacity="0.28"
                            />
                          </linearGradient>
                          <linearGradient
                            id="wrBrandSweep"
                            x1="14"
                            y1="24"
                            x2="51"
                            y2="35"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stop-color="#34D399" stop-opacity="0.18" />
                            <stop
                              offset="0.55"
                              stop-color="#A7F3D0"
                              stop-opacity="0.95"
                            />
                            <stop
                              offset="1"
                              stop-color="#F8FAFC"
                              stop-opacity="0.22"
                            />
                          </linearGradient>
                          <linearGradient
                            id="wrBrandEdge"
                            x1="10"
                            y1="8"
                            x2="58"
                            y2="58"
                            gradientUnits="userSpaceOnUse"
                          >
                            <stop stop-color="#86EFAC" stop-opacity="0.55" />
                            <stop
                              offset="1"
                              stop-color="#F8FAFC"
                              stop-opacity="0.1"
                            />
                          </linearGradient>
                        </defs>
                        <rect
                          x="4"
                          y="4"
                          width="56"
                          height="56"
                          rx="18"
                          fill="url(#wrBrandTile)"
                        />
                        <rect
                          x="4"
                          y="4"
                          width="56"
                          height="56"
                          rx="18"
                          fill="url(#wrBrandGlow)"
                        />
                        <rect
                          x="4.5"
                          y="4.5"
                          width="55"
                          height="55"
                          rx="17.5"
                          stroke="url(#wrBrandEdge)"
                        />
                        <circle
                          cx="32"
                          cy="33"
                          r="18.5"
                          stroke="url(#wrBrandRing)"
                          stroke-width="2.5"
                        />
                        <path
                          d="M14 35.5C18.2 27.1667 24.2 23 32 23C39.8 23 45.8 27.1667 50 35.5"
                          stroke="url(#wrBrandSweep)"
                          stroke-width="3.2"
                          stroke-linecap="round"
                        />
                        <path
                          d="M16.5 20.5L24 42L32 28.5L40 42L47.5 20.5"
                          stroke="#F8FAFC"
                          stroke-width="5"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                        <circle cx="32" cy="15.5" r="5.5" fill="#34D399" />
                        <path
                          d="M29.5 15.7L31.2 17.5L34.7 13.6"
                          stroke="#052E26"
                          stroke-width="2.2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      <!--<![endif]-->
                    </td>
                    <td
                      class="wr-brand-copy-cell"
                      valign="middle"
                      style="
                        font-family:
                          Segoe UI,
                          Arial,
                          sans-serif;
                        padding-left: 12px;
                        vertical-align: middle;
                      "
                    >
                      <div
                        class="wr-brand-title"
                        style="
                          font-family:
                            Segoe UI,
                            Arial,
                            sans-serif;
                          font-size: 18px;
                          font-weight: 800;
                          letter-spacing: -0.03em;
                          color: #f8fafc;
                        "
                      >
                        WiseRank
                      </div>
                      <div
                        class="wr-brand-subtitle"
                        style="
                          font-family:
                            Segoe UI,
                            Arial,
                            sans-serif;
                          margin-top: 3px;
                          font-size: 12px;
                          color: rgba(248, 250, 252, 0.72);
                        "
                      >
                        Recruiter Workspace
                      </div>
                    </td>
                  </tr>
                </table>

                <div
                  class="wr-kicker"
                  style="
                    font-family:
                      Segoe UI,
                      Arial,
                      sans-serif;
                    display: inline-block;
                    margin-bottom: 14px;
                    padding: 7px 12px;
                    border: 1px solid rgba(167, 243, 208, 0.16);
                    border-radius: 999px;
                    background-color: rgba(16, 185, 129, 0.14);
                    background: rgba(16, 185, 129, 0.14);
                    color: #a7f3d0;
                    font-size: 11px;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                  "
                >
                  Recovery Flow
                </div>
                <h1
                  class="wr-title"
                  style="
                    font-family:
                      Segoe UI,
                      Arial,
                      sans-serif;
                    margin: 0 0 10px;
                    font-size: 30px;
                    line-height: 1.14;
                    letter-spacing: -0.04em;
                    color: #f8fafc;
                  "
                >
                  Reset your password
                </h1>
                <p
                  class="wr-copy"
                  style="
                    font-family:
                      Segoe UI,
                      Arial,
                      sans-serif;
                    margin: 0;
                    font-size: 15px;
                    line-height: 1.65;
                    color: rgba(241, 245, 249, 0.84);
                  "
                >
                  Hi ${user.user_name}, we received a reset request for the WiseRank
                  workspace connected to ${user.user_email}. Use this code if it was
                  you.
                </p>

                <div
                  class="wr-code-panel wr-code-panel-dark"
                  style="
                    font-family:
                      Segoe UI,
                      Arial,
                      sans-serif;
                    margin-top: 18px;
                    padding: 18px 20px;
                    border-radius: 18px;
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    background-color: rgba(255, 255, 255, 0.08);
                    background: rgba(255, 255, 255, 0.08);
                  "
                >
                  <p
                    class="wr-label wr-label-inverse"
                    style="
                      font-family:
                        Segoe UI,
                        Arial,
                        sans-serif;
                      margin: 0 0 10px;
                      font-size: 11px;
                      font-weight: 800;
                      letter-spacing: 0.06em;
                      text-transform: uppercase;
                      color: rgba(248, 250, 252, 0.74);
                    "
                  >
                    Reset code
                  </p>
                  <p
                    class="wr-code wr-code-inverse"
                    style="
                      font-family:
                        Segoe UI,
                        Arial,
                        sans-serif;
                      margin: 0;
                      font-family:
                        Consolas,
                        Courier New,
                        monospace;
                      font-size: 30px;
                      font-weight: 700;
                      letter-spacing: 0.2em;
                      color: #ffffff;
                    "
                  >
                    ${user.pass_token}
                  </p>
                  <p
                    class="wr-helper wr-helper-inverse"
                    style="
                      font-family:
                        Segoe UI,
                        Arial,
                        sans-serif;
                      margin: 10px 0 0;
                      font-size: 13px;
                      line-height: 1.6;
                      color: rgba(241, 245, 249, 0.76);
                    "
                  >
                    Expires in 10 minutes. Verify the code first, then choose a
                    new password.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td
                class="wr-section wr-section-first"
                style="
                  font-family:
                    Segoe UI,
                    Arial,
                    sans-serif;
                  padding: 0 24px 24px;
                  background-color: #ffffff;
                  background: #ffffff;
                  border-left: 1px solid #e2e8f0;
                  border-right: 1px solid #e2e8f0;
                  padding-top: 24px;
                "
              >
                <div
                  class="wr-surface"
                  style="
                    font-family:
                      Segoe UI,
                      Arial,
                      sans-serif;
                    margin-bottom: 16px;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    background-color: #ffffff;
                    background: linear-gradient(
                      180deg,
                      #ffffff 0%,
                      #f8fafc 100%
                    );
                  "
                >
                  <p
                    class="wr-heading"
                    style="
                      font-family:
                        Segoe UI,
                        Arial,
                        sans-serif;
                      margin: 0 0 10px;
                      font-size: 21px;
                      line-height: 1.28;
                      letter-spacing: -0.03em;
                      color: #0f172a;
                    "
                  >
                    Reset in 3 quick steps
                  </p>
                  <table
                    role="presentation"
                    width="100%"
                    cellpadding="0"
                    cellspacing="0"
                    class="wr-step-table"
                    style="
                      font-family:
                        Segoe UI,
                        Arial,
                        sans-serif;
                      border-collapse: collapse;
                      border-spacing: 0;
                      mso-table-lspace: 0;
                      mso-table-rspace: 0;
                      width: 100%;
                    "
                  >
                    <tr>
                      <td
                        class="wr-step-cell"
                        style="
                          font-family:
                            Segoe UI,
                            Arial,
                            sans-serif;
                          width: 33.33%;
                          padding-right: 10px;
                          vertical-align: top;
                        "
                      >
                        <div
                          class="wr-step-card"
                          style="
                            font-family:
                              Segoe UI,
                              Arial,
                              sans-serif;
                            padding: 16px;
                            border: 1px solid #e2e8f0;
                            border-radius: 16px;
                            background-color: #ffffff;
                            background: #ffffff;
                          "
                        >
                          <span
                            class="wr-step-number"
                            style="
                              font-family:
                                Segoe UI,
                                Arial,
                                sans-serif;
                              display: inline-block;
                              width: 28px;
                              height: 28px;
                              line-height: 28px;
                              text-align: center;
                              border-radius: 999px;
                              background-color: rgba(16, 185, 129, 0.12);
                              background: rgba(16, 185, 129, 0.12);
                              color: #059669;
                              font-size: 13px;
                              font-weight: 800;
                            "
                            >1</span
                          >
                          <p
                            class="wr-step-title"
                            style="
                              font-family:
                                Segoe UI,
                                Arial,
                                sans-serif;
                              margin: 12px 0 8px;
                              font-size: 15px;
                              font-weight: 700;
                              color: #0f172a;
                            "
                          >
                            Open the reset screen
                          </p>
                          <p
                            class="wr-step-copy"
                            style="
                              font-family:
                                Segoe UI,
                                Arial,
                                sans-serif;
                              margin: 0;
                              font-size: 14px;
                              line-height: 1.65;
                              color: #64748b;
                            "
                          >
                            Use the button above to continue in the secured
                            recovery flow.
                          </p>
                        </div>
                      </td>
                      <td
                        class="wr-step-cell"
                        style="
                          font-family:
                            Segoe UI,
                            Arial,
                            sans-serif;
                          width: 33.33%;
                          padding-right: 10px;
                          vertical-align: top;
                        "
                      >
                        <div
                          class="wr-step-card"
                          style="
                            font-family:
                              Segoe UI,
                              Arial,
                              sans-serif;
                            padding: 16px;
                            border: 1px solid #e2e8f0;
                            border-radius: 16px;
                            background-color: #ffffff;
                            background: #ffffff;
                          "
                        >
                          <span
                            class="wr-step-number"
                            style="
                              font-family:
                                Segoe UI,
                                Arial,
                                sans-serif;
                              display: inline-block;
                              width: 28px;
                              height: 28px;
                              line-height: 28px;
                              text-align: center;
                              border-radius: 999px;
                              background-color: rgba(16, 185, 129, 0.12);
                              background: rgba(16, 185, 129, 0.12);
                              color: #059669;
                              font-size: 13px;
                              font-weight: 800;
                            "
                            >2</span
                          >
                          <p
                            class="wr-step-title"
                            style="
                              font-family:
                                Segoe UI,
                                Arial,
                                sans-serif;
                              margin: 12px 0 8px;
                              font-size: 15px;
                              font-weight: 700;
                              color: #0f172a;
                            "
                          >
                            Enter the code
                          </p>
                          <p
                            class="wr-step-copy"
                            style="
                              font-family:
                                Segoe UI,
                                Arial,
                                sans-serif;
                              margin: 0;
                              font-size: 14px;
                              line-height: 1.65;
                              color: #64748b;
                            "
                          >
                            Paste the one-time code exactly as shown to verify
                            the request.
                          </p>
                        </div>
                      </td>
                      <td
                        class="wr-step-cell wr-step-cell-last"
                        style="
                          font-family:
                            Segoe UI,
                            Arial,
                            sans-serif;
                          width: 33.33%;
                          padding-right: 10px;
                          vertical-align: top;
                          padding-right: 0;
                        "
                      >
                        <div
                          class="wr-step-card"
                          style="
                            font-family:
                              Segoe UI,
                              Arial,
                              sans-serif;
                            padding: 16px;
                            border: 1px solid #e2e8f0;
                            border-radius: 16px;
                            background-color: #ffffff;
                            background: #ffffff;
                          "
                        >
                          <span
                            class="wr-step-number"
                            style="
                              font-family:
                                Segoe UI,
                                Arial,
                                sans-serif;
                              display: inline-block;
                              width: 28px;
                              height: 28px;
                              line-height: 28px;
                              text-align: center;
                              border-radius: 999px;
                              background-color: rgba(16, 185, 129, 0.12);
                              background: rgba(16, 185, 129, 0.12);
                              color: #059669;
                              font-size: 13px;
                              font-weight: 800;
                            "
                            >3</span
                          >
                          <p
                            class="wr-step-title"
                            style="
                              font-family:
                                Segoe UI,
                                Arial,
                                sans-serif;
                              margin: 12px 0 8px;
                              font-size: 15px;
                              font-weight: 700;
                              color: #0f172a;
                            "
                          >
                            Choose a stronger password
                          </p>
                          <p
                            class="wr-step-copy"
                            style="
                              font-family:
                                Segoe UI,
                                Arial,
                                sans-serif;
                              margin: 0;
                              font-size: 14px;
                              line-height: 1.65;
                              color: #64748b;
                            "
                          >
                            Use uppercase, lowercase, a number, and a symbol to
                            keep access protected.
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>

                <div
                  class="wr-surface wr-surface-muted"
                  style="
                    font-family:
                      Segoe UI,
                      Arial,
                      sans-serif;
                    margin-bottom: 16px;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    background-color: #ffffff;
                    background: linear-gradient(
                      180deg,
                      #ffffff 0%,
                      #f8fafc 100%
                    );
                    background-color: #f3fbf7;
                    background: linear-gradient(
                      180deg,
                      rgba(16, 185, 129, 0.08) 0%,
                      rgba(15, 23, 42, 0.02) 100%
                    );
                    border-color: rgba(16, 185, 129, 0.18);
                  "
                >
                  <p
                    class="wr-heading"
                    style="
                      font-family:
                        Segoe UI,
                        Arial,
                        sans-serif;
                      margin: 0 0 10px;
                      font-size: 21px;
                      line-height: 1.28;
                      letter-spacing: -0.03em;
                      color: #0f172a;
                    "
                  >
                    Did not request this?
                  </p>
                  <p
                    class="wr-text"
                    style="
                      font-family:
                        Segoe UI,
                        Arial,
                        sans-serif;
                      margin: 0;
                      font-size: 15px;
                      line-height: 1.68;
                      color: #475569;
                    "
                  >
                    You can safely ignore this email. Your current password
                    stays active until the reset flow is fully completed.
                  </p>
                </div>
              </td>
            </tr>

            <tr>
              <td
                class="wr-section wr-section-last"
                style="
                  font-family:
                    Segoe UI,
                    Arial,
                    sans-serif;
                  padding: 0 24px 24px;
                  background-color: #ffffff;
                  background: #ffffff;
                  border-left: 1px solid #e2e8f0;
                  border-right: 1px solid #e2e8f0;
                  padding-bottom: 28px;
                  border-bottom: 1px solid #e2e8f0;
                  border-radius: 0 0 22px 22px;
                "
              >
                <div
                  class="wr-surface"
                  style="
                    font-family:
                      Segoe UI,
                      Arial,
                      sans-serif;
                    margin-bottom: 16px;
                    padding: 20px;
                    border: 1px solid #e2e8f0;
                    border-radius: 18px;
                    background-color: #ffffff;
                    background: linear-gradient(
                      180deg,
                      #ffffff 0%,
                      #f8fafc 100%
                    );
                  "
                >
                  <p
                    class="wr-heading"
                    style="
                      font-family:
                        Segoe UI,
                        Arial,
                        sans-serif;
                      margin: 0 0 10px;
                      font-size: 21px;
                      line-height: 1.28;
                      letter-spacing: -0.03em;
                      color: #0f172a;
                    "
                  >
                    Need help?
                  </p>
                  <p
                    class="wr-text"
                    style="
                      font-family:
                        Segoe UI,
                        Arial,
                        sans-serif;
                      margin: 0;
                      font-size: 15px;
                      line-height: 1.68;
                      color: #475569;
                    "
                  >
                    Contact
                    <a
                      class="wr-link"
                      href="mailto:hello@rankwise.io"
                      style="
                        font-family:
                          Segoe UI,
                          Arial,
                          sans-serif;
                        color: inherit;
                        text-decoration: none;
                        color: #059669 !important;
                        font-weight: 700;
                        text-decoration: underline;
                      "
                      >hello@rankwise.io</a
                    >
                    if you need help securing the account or completing the
                    reset.
                  </p>
                </div>

                <div
                  class="wr-divider"
                  style="
                    font-family:
                      Segoe UI,
                      Arial,
                      sans-serif;
                    height: 1px;
                    background-color: #e2e8f0;
                    background: #e2e8f0;
                    line-height: 1px;
                    font-size: 1px;
                  "
                >
                  &nbsp;
                </div>

                <div
                  class="wr-footer"
                  style="
                    font-family:
                      Segoe UI,
                      Arial,
                      sans-serif;
                    padding: 18px 10px 0;
                    text-align: center;
                  "
                >
                  <p
                    class="wr-footer-copy"
                    style="
                      font-family:
                        Segoe UI,
                        Arial,
                        sans-serif;
                      margin: 0;
                      font-size: 12px;
                      line-height: 1.8;
                      color: #64748b;
                    "
                  >
                    Security note: only use password reset codes on WiseRank
                    pages you trust.
                  </p>
                  <p
                    class="wr-footer-links"
                    style="
                      font-family:
                        Segoe UI,
                        Arial,
                        sans-serif;
                      margin: 0;
                      font-size: 12px;
                      line-height: 1.8;
                      color: #64748b;
                      margin-top: 8px;
                    "
                  >
                    WiseRank &middot; Kigali, Rwanda &middot; &copy; 2026
                  </p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`,
    });
    await user.save();
    res.status(200).json({
      success: "Password token for verification generated successfully",
    });
  } catch (error) {
    controlDebug("Error in forgot password controller");
    console.error(error);
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ input_error: "Input requirements are not fulfilled" });
    }
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export const verifyCode = async (req: I_Request, res: Response) => {
  try {
    const { token } = req.body;
    const validate_result_token = verifyCSchema.parse(token);
    let used_token = validate_result_token.token;

    const recovery_reference_token = req.cookies.recovery_reference_token;
    if (!env.ACCESS_SECRET)
      return res.status(500).json({ server_error: "Internal server error" });
    const payload = jwt.verify(recovery_reference_token, env.ACCESS_SECRET, {
      algorithms: ["HS256"],
    });

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
    const check = await bcrypt.compare(used_token, user.pass_token);
    if (!check)
      return res.status(401).json({ input_error: "Invalid one time password" });
    const user_cookie_details = { userId: user._id };
    if (ACCESS_SECRET) {
      const reset_reference_token = jwt.sign(
        user_cookie_details,
        ACCESS_SECRET,
        {
          algorithm: "HS256",
        },
      );
      res.cookie("reset_reference_token", reset_reference_token, {
        httpOnly: true,
        maxAge: 10 * 60 * 1000,
      });
      res.status(200).json({ success: "Token verification successful" });
    }
  } catch (error) {
    controlDebug("Error in verify code controller");
    console.error(error);
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
    const reset_info = req.cookies.reset_reference_token;
    const { reqBody }: { reqBody: Reset } = req.body;
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
    controlDebug("Error in reset password controller");
    console.error(error);
    if (error instanceof z.ZodError) {
      return res
        .status(401)
        .json({ input_error: "Input requirements not fulfilled" });
    }
    res.status(401).json({ server_error: "Internal server error" });
  }
};
