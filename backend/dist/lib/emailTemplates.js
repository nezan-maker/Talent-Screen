import env from "../config/env.js";
const BRAND = {
    productName: "Talvo",
    title: "Talvo Recruiter Workspace",
    colors: {
        primary: "#111827",
        accent: "#F97316",
        accentHover: "#FB7A2A",
        success: "#10b981",
        danger: "#ef4444",
        bg: "#F4F5F7",
        card: "#FFFFFF",
        border: "#E9EDF2",
        text: "#111827",
        muted: "#6B7280",
    },
};
function escapeHtml(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
function trimText(value) {
    return String(value ?? "").trim();
}
function normalizeBaseUrl(value) {
    const trimmed = trimText(value);
    if (!trimmed) {
        return "http://localhost:3000";
    }
    return trimmed.replace(/\/+$/, "");
}
function getFrontendBaseUrl() {
    return normalizeBaseUrl(env.FRONTEND_ORIGIN);
}
function buildFrontendUrl(pathname, params) {
    const url = new URL(pathname, `${getFrontendBaseUrl()}/`);
    if (params) {
        for (const [key, value] of Object.entries(params)) {
            const normalizedValue = trimText(value);
            if (!normalizedValue) {
                continue;
            }
            url.searchParams.set(key, normalizedValue);
        }
    }
    return url.toString();
}
function renderActionButton(link, color) {
    return `
    <a
      href="${escapeHtml(link.href)}"
      target="_blank"
      rel="noreferrer"
      style="
        display:inline-block;
        padding:12px 18px;
        border-radius:12px;
        background:${color};
        color:#ffffff;
        font-size:14px;
        font-weight:700;
        text-decoration:none;
        letter-spacing:0.01em;
      "
    >
      ${escapeHtml(link.label)}
    </a>
  `;
}
function renderEmailLayout(input) {
    const toneColor = input.toneColor || BRAND.colors.accent;
    const codeBlock = input.codeLabel && input.codeValue
        ? `
    <div style="margin:18px 0 0;border:1px solid ${BRAND.colors.border};border-radius:14px;background:#f8fafc;padding:16px;">
      <div style="font-size:12px;color:${BRAND.colors.muted};font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">
        ${escapeHtml(input.codeLabel)}
      </div>
      <div style="margin-top:8px;font-size:26px;font-weight:800;letter-spacing:0.14em;color:${BRAND.colors.primary};">
        ${escapeHtml(input.codeValue)}
      </div>
    </div>`
        : "";
    const secondaryBlock = input.secondaryAction
        ? `
    <p style="margin:16px 0 0;font-size:13px;color:${BRAND.colors.muted};line-height:1.6;">
      Alternative link:
      <a
        href="${escapeHtml(input.secondaryAction.href)}"
        target="_blank"
        rel="noreferrer"
        style="color:${BRAND.colors.primary};font-weight:700;text-decoration:underline;word-break:break-all;"
      >
        ${escapeHtml(input.secondaryAction.label)}
      </a>
    </p>`
        : "";
    return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BRAND.colors.bg};font-family:Segoe UI,Arial,sans-serif;color:${BRAND.colors.text};">
    <div style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">
      ${escapeHtml(input.preheader)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.colors.bg};padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:${BRAND.colors.card};border:1px solid ${BRAND.colors.border};border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:18px 24px;background:linear-gradient(135deg,${BRAND.colors.primary} 0%,#1f2937 100%);color:#ffffff;">
                <div style="font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-weight:700;opacity:0.86;">
                  ${escapeHtml(BRAND.productName)}
                </div>
                <div style="margin-top:4px;font-size:20px;line-height:1.35;font-weight:800;">
                  ${escapeHtml(BRAND.title)}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <div style="display:inline-block;border-radius:999px;background:${toneColor}1a;color:${toneColor};padding:6px 10px;font-size:12px;font-weight:700;letter-spacing:0.03em;">
                  Update
                </div>
                <h1 style="margin:14px 0 0;font-size:28px;line-height:1.2;color:${BRAND.colors.primary};letter-spacing:-0.02em;">
                  ${escapeHtml(input.title)}
                </h1>
                <p style="margin:14px 0 0;font-size:15px;line-height:1.7;color:${BRAND.colors.text};">
                  ${escapeHtml(input.greeting)}
                </p>
                <p style="margin:10px 0 0;font-size:15px;line-height:1.7;color:${BRAND.colors.text};">
                  ${escapeHtml(input.intro)}
                </p>
                ${codeBlock}
                <p style="margin:14px 0 0;font-size:14px;line-height:1.7;color:${BRAND.colors.muted};">
                  ${escapeHtml(input.details)}
                </p>
                <div style="margin:20px 0 0;">
                  ${renderActionButton(input.primaryAction, toneColor)}
                </div>
                ${secondaryBlock}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;border-top:1px solid ${BRAND.colors.border};font-size:12px;line-height:1.65;color:${BRAND.colors.muted};">
                ${escapeHtml(input.footerNote)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}
export function buildSignupVerificationEmail(input) {
    const confirmScreenUrl = buildFrontendUrl("/register", {
        email: input.userEmail,
        signup_token: input.signupToken,
    });
    const quickConfirmUrl = buildFrontendUrl("/register", {
        email: input.userEmail,
        signup_token: input.signupToken,
        confirmation_link_id: input.confirmationLinkId,
    });
    const subject = "Confirm your Talvo account";
    const text = [
        `Hi ${input.userName},`,
        "",
        `Your Talvo verification code is ${input.otpCode}.`,
        "This code expires in 10 minutes.",
        "",
        `Confirm instantly: ${quickConfirmUrl}`,
        `Open confirmation screen: ${confirmScreenUrl}`,
        "",
        "If you did not create this account, you can ignore this email.",
    ].join("\n");
    const html = renderEmailLayout({
        preheader: "Use this OTP or one-click confirmation link to activate your Talvo account.",
        title: "Confirm your account",
        greeting: `Hi ${input.userName},`,
        intro: "Welcome to Talvo. Confirm your email address so your recruiter workspace is fully active.",
        details: "Use the one-time code below or open the confirmation link. For security, the verification expires in 10 minutes.",
        codeLabel: "Verification code",
        codeValue: input.otpCode,
        primaryAction: {
            label: "Confirm with link",
            href: quickConfirmUrl,
        },
        secondaryAction: {
            label: confirmScreenUrl,
            href: confirmScreenUrl,
        },
        footerNote: "If you did not create this account, no action is needed and the verification code will expire automatically.",
    });
    return {
        subject,
        text,
        html,
    };
}
export function buildPasswordRecoveryEmail(input) {
    const resetScreenUrl = buildFrontendUrl("/forgot-password", {
        email: input.userEmail,
    });
    const quickVerifyUrl = buildFrontendUrl("/forgot-password", {
        email: input.userEmail,
        reset_code: input.otpCode,
        recovery_token: input.recoveryToken,
    });
    const subject = "Reset your Talvo password";
    const text = [
        `Hi ${input.userName},`,
        "",
        `Your Talvo password reset code is ${input.otpCode}.`,
        "This code expires in 10 minutes.",
        "",
        `Quick reset link: ${quickVerifyUrl}`,
        `Open reset screen: ${resetScreenUrl}`,
        "",
        "If you did not request a password reset, you can ignore this email.",
    ].join("\n");
    const html = renderEmailLayout({
        preheader: "Use this OTP or quick verification link to recover your Talvo account.",
        title: "Password recovery",
        greeting: `Hi ${input.userName},`,
        intro: "We received a request to reset your Talvo password. Complete verification to continue.",
        details: "Use the one-time code below in the reset screen, or use the quick verification link. The code expires in 10 minutes.",
        codeLabel: "Reset code",
        codeValue: input.otpCode,
        primaryAction: {
            label: "Use quick reset link",
            href: quickVerifyUrl,
        },
        secondaryAction: {
            label: resetScreenUrl,
            href: resetScreenUrl,
        },
        footerNote: "If you did not request this reset, your current password remains unchanged. For help, contact your administrator.",
    });
    return {
        subject,
        text,
        html,
    };
}
export function buildShortlistedApplicantEmail(input) {
    const contactUrl = buildFrontendUrl("/contact");
    const subject = `Interview shortlist update for ${input.jobTitle}`;
    const text = [
        `Hi ${input.applicantName},`,
        "",
        `Congratulations. You have been shortlisted for an interview for the ${input.jobTitle} role.`,
        "Our recruiting team will contact you with interview scheduling details.",
        "",
        `Questions? Contact us: ${contactUrl}`,
    ].join("\n");
    const html = renderEmailLayout({
        preheader: "You have been shortlisted for interview.",
        title: "You have been shortlisted",
        greeting: `Hi ${input.applicantName},`,
        intro: `Great news. You have been shortlisted for an interview for the ${input.jobTitle} role.`,
        details: "Our recruiting team is preparing the next steps and will share interview scheduling details soon.",
        primaryAction: {
            label: "Contact recruiting team",
            href: contactUrl,
        },
        footerNote: "Thank you for your interest in Talvo. We appreciate the time you invested in your application.",
        toneColor: BRAND.colors.success,
    });
    return {
        subject,
        text,
        html,
    };
}
export function buildRejectedApplicantEmail(input) {
    const jobsUrl = buildFrontendUrl("/");
    const subject = `Application update for ${input.jobTitle}`;
    const text = [
        `Hi ${input.applicantName},`,
        "",
        `Thank you for applying for the ${input.jobTitle} role.`,
        "After review, we will not proceed with your application for this position.",
        "We appreciate your time and encourage you to apply for future openings.",
        "",
        `Explore future opportunities: ${jobsUrl}`,
    ].join("\n");
    const html = renderEmailLayout({
        preheader: "Application update from Talvo recruiting.",
        title: "Application update",
        greeting: `Hi ${input.applicantName},`,
        intro: `Thank you for applying for the ${input.jobTitle} role.`,
        details: "After careful review, we will not proceed with your application for this position. We truly appreciate your interest and time.",
        primaryAction: {
            label: "Explore future opportunities",
            href: jobsUrl,
        },
        footerNote: "We are grateful for your interest in Talvo and encourage you to apply for future roles that match your experience.",
        toneColor: BRAND.colors.danger,
    });
    return {
        subject,
        text,
        html,
    };
}
//# sourceMappingURL=emailTemplates.js.map