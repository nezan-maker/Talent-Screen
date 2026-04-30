import nodemailer from "nodemailer";
import env from "../config/env.js";
const MAIL_SEND_TIMEOUT_MS = 8_000;
export function emailDeliveryConfigured() {
    return Boolean(env.USER_EMAIL && env.USER_PASS);
}
export async function sendMailIfConfigured(payload) {
    if (!emailDeliveryConfigured()) {
        return false;
    }
    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            connectionTimeout: MAIL_SEND_TIMEOUT_MS,
            greetingTimeout: MAIL_SEND_TIMEOUT_MS,
            socketTimeout: MAIL_SEND_TIMEOUT_MS,
            auth: {
                user: env.USER_EMAIL,
                pass: env.USER_PASS,
            },
        });
        await Promise.race([
            transporter.sendMail({
                from: `"Talvo" <${env.USER_EMAIL}>`,
                to: payload.to,
                subject: payload.subject,
                text: payload.text,
                ...(payload.html ? { html: payload.html } : {}),
            }),
            new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error("Email send timeout exceeded"));
                }, MAIL_SEND_TIMEOUT_MS);
            }),
        ]);
        return true;
    }
    catch (error) {
        console.error("Email delivery skipped:", error);
        return false;
    }
}
//# sourceMappingURL=mailer.js.map