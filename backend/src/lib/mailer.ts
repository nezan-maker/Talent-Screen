import nodemailer from "nodemailer";
import env from "../config/env.js";

export type MailPayload = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export function emailDeliveryConfigured() {
  return Boolean(env.USER_EMAIL && env.USER_PASS);
}

export async function sendMailIfConfigured(payload: MailPayload) {
  if (!emailDeliveryConfigured()) {
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: env.USER_EMAIL,
        pass: env.USER_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Talvo" <${env.USER_EMAIL}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text,
      ...(payload.html ? { html: payload.html } : {}),
    });
    return true;
  } catch (error) {
    console.error("Email delivery skipped:", error);
    return false;
  }
}
