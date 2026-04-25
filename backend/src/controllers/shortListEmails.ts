import nodemailer from "nodemailer";
import type { Request, Response } from "express";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import env from "../config/env.js";
import { controlDebug } from "./authControl.js";
import User from "../models/User.js";

const emailingController = async (req: Request, res: Response) => {
  try {
    const shortlisted_array = req.shortlisted;
    const rejected_array = req.rejected;
    for (const shortlisted of shortlisted_array) {
      let job = await Job.findOne({ job_title: shortlisted.job_title });
      if (!job) {
        throw new Error("Could not get the job details from the database");
      }
      let job_location = job.job_location;
      let company_name = job.company_name;
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: {
          user: env.USER_EMAIL,
          pass: env.USER_PASS,
        },
      });
      transporter.sendMail({
        from: env.USER_PASS,
        to: shortlisted.email,
        subject: "Application Results",
        text: "You have been shortlisted",
        html: `<!doctype html>
<html lang="en" style="margin: 0; padding: 0; background-color: #fdf8f4;">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>You have been shortlisted — WiseRank</title>
    <style>
@media only screen and (max-width: 640px) {
  .wr-wrapper { padding: 14px 8px 24px; }
  .wr-hero { padding: 24px 20px 20px; border-radius: 18px 18px 0 0; }
  .wr-title { font-size: 27px; }
  .wr-section { padding-left: 16px; padding-right: 16px; }
  .wr-section-last { border-radius: 0 0 18px 18px; }
  .wr-surface, .wr-step-card { padding: 16px; }
  .wr-step-cell {
    display: block !important;
    width: 100% !important;
    padding-right: 0 !important;
    padding-bottom: 10px !important;
  }
  .wr-step-cell-last { padding-bottom: 0 !important; }
}
    </style>
  </head>
  <body style="margin: 0; padding: 0; font-family: Segoe UI, Arial, sans-serif; background-color: #fdf8f4; background: radial-gradient(circle at top, rgba(251, 146, 60, 0.12), transparent 34%), #fdf8f4; color: #1a0f05;">

    <!-- Preheader -->
    <div style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all;">
      Congratulations — you have been shortlisted for the Senior Frontend Engineer role at WiseRank. Here is what happens next.
    </div>

    <!-- Layout -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#fdf8f4" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; background-color: #fdf8f4;">
      <tr>
        <td align="center" class="wr-wrapper" style="padding: 24px 14px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; max-width: 640px;">

            <!-- ── HERO ── -->
            <tr>
              <td class="wr-hero" style="padding: 28px 28px 24px; border-radius: 22px 22px 0 0; background-color: #1a0f05; background: radial-gradient(circle at 92% 14%, rgba(251, 191, 120, 0.24), transparent 22%), linear-gradient(135deg, #2d1a08 0%, #1a0f05 58%, #0d0602 100%); color: #fdf8f4;">

                <!-- Brand lockup -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; margin-bottom: 18px;">
                  <tr>
                    <td width="48" valign="middle" style="width: 48px; vertical-align: middle;">
                      <!--[if !mso]><!-- -->
                        <img src="https://res.cloudinary.com/da7sdnt5z/image/upload/v1777007048/icon_cifdka.png" height="46" width="46">
                      <!--<![endif]-->
                    </td>
                    <td valign="middle" style="padding-left: 12px; vertical-align: middle;">
                      <div style="font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: #fdf8f4;">WiseRank</div>
                      <div style="margin-top: 3px; font-size: 12px; color: rgba(253, 248, 244, 0.72);">Recruiter Workspace</div>
                    </td>
                  </tr>
                </table>

                <!-- Kicker -->
                <div style="display: inline-block; margin-bottom: 14px; padding: 7px 12px; border: 1px solid rgba(254, 215, 168, 0.18); border-radius: 999px; background: rgba(251, 146, 60, 0.16); color: #fed7a8; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                  Application Update
                </div>

                <h1 style="margin: 0 0 10px; font-size: 30px; line-height: 1.14; letter-spacing: -0.04em; color: #fdf8f4; font-family: Segoe UI, Arial, sans-serif;">
                  You have been shortlisted, ${shortlisted.first_name}
                </h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.65; color: rgba(253, 248, 244, 0.84);">
                  Your application for <strong style="color: #fdf8f4;">{{jobTitle}}</strong> at <strong style="color: #fdf8f4;">${company_name}</strong> stood out. The hiring team has moved you forward — read on to see what comes next.
                </p>

              </td>
            </tr>

            <!-- ── ROLE DETAIL CARD ── -->
            <tr>
              <td class="wr-section wr-section-first" style="padding: 24px 24px 0; background-color: #ffffff; border-left: 1px solid #f0e6da; border-right: 1px solid #f0e6da;">

                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #f0e6da; border-radius: 18px; background: linear-gradient(180deg, #ffffff 0%, #fdf8f4 100%);">
                  <p style="margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #1a0f05; font-weight: 700;">Role details</p>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; font-family: Segoe UI, Arial, sans-serif;">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 13px; font-weight: 700; color: #b8966e; text-transform: uppercase; letter-spacing: 0.05em; width: 120px;" valign="top">Role</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 15px; color: #1a0f05; font-weight: 600;" valign="top">${shortlisted.job_title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 13px; font-weight: 700; color: #b8966e; text-transform: uppercase; letter-spacing: 0.05em;" valign="top">Company</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 15px; color: #1a0f05; font-weight: 600;" valign="top">${company_name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 13px; font-weight: 700; color: #b8966e; text-transform: uppercase; letter-spacing: 0.05em;" valign="top">Location</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 15px; color: #1a0f05; font-weight: 600;" valign="top">${job_location}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #b8966e; text-transform: uppercase; letter-spacing: 0.05em;" valign="top">Stage</td>
                      <td style="padding: 10px 0;" valign="top">
                        <span style="display: inline-block; padding: 5px 12px; border-radius: 999px; background: rgba(251, 146, 60, 0.12); color: #c2520f; font-size: 13px; font-weight: 800;">Shortlisted</span>
                      </td>
                    </tr>
                  </table>
                </div>

              </td>
            </tr>

            <!-- ── WHAT HAPPENS NEXT ── -->
            <tr>
              <td class="wr-section" style="padding: 16px 24px 0; background-color: #ffffff; border-left: 1px solid #f0e6da; border-right: 1px solid #f0e6da;">

                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #f0e6da; border-radius: 18px; background: linear-gradient(180deg, #ffffff 0%, #fdf8f4 100%);">
                  <p style="margin: 0 0 16px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #1a0f05; font-weight: 700;">What happens next</p>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; font-family: Segoe UI, Arial, sans-serif; width: 100%;">
                    <tr>
                      <td class="wr-step-cell" valign="top" style="width: 33.33%; padding-right: 10px; vertical-align: top;">
                        <div class="wr-step-card" style="padding: 16px; border: 1px solid #f0e6da; border-radius: 16px; background: #ffffff;">
                          <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">1</span>
                          <p style="margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #1a0f05;">Recruiter review</p>
                          <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #7a5c42;">The hiring team reviews your full profile and confirms interview availability.</p>
                        </div>
                      </td>
                      <td class="wr-step-cell" valign="top" style="width: 33.33%; padding-right: 10px; vertical-align: top;">
                        <div class="wr-step-card" style="padding: 16px; border: 1px solid #f0e6da; border-radius: 16px; background: #ffffff;">
                          <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">2</span>
                          <p style="margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #1a0f05;">Interview invite</p>
                          <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #7a5c42;">You will receive a calendar invite or a link to book your interview slot.</p>
                        </div>
                      </td>
                      <td class="wr-step-cell wr-step-cell-last" valign="top" style="width: 33.33%; vertical-align: top;">
                        <div class="wr-step-card" style="padding: 16px; border: 1px solid #f0e6da; border-radius: 16px; background: #ffffff;">
                          <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">3</span>
                          <p style="margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #1a0f05;">Meet the team</p>
                          <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #7a5c42;">Join the interview and show us what you can do. We keep it focused and practical.</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>

              </td>
            </tr>

            <!-- ── BOTTOM SECTION ── -->
            <tr>
              <td class="wr-section wr-section-last" style="padding: 16px 24px 28px; background-color: #ffffff; border-left: 1px solid #f0e6da; border-right: 1px solid #f0e6da; border-bottom: 1px solid #f0e6da; border-radius: 0 0 22px 22px;">

                <!-- Muted note -->
                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid rgba(251, 146, 60, 0.2); border-radius: 18px; background: linear-gradient(180deg, rgba(251, 146, 60, 0.08) 0%, rgba(26, 15, 5, 0.02) 100%);">
                  <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #c2520f;">A note from the team</p>
                  <p style="margin: 0; font-size: 15px; line-height: 1.68; color: #5c3d20;">
                    We run a focused, transparent process. If your availability changes or you have questions before the interview, just reply to this email and we will get back to you promptly.
                  </p>
                </div>

                <!-- Interview prep checklist -->
                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #f0e6da; border-radius: 18px; background: linear-gradient(180deg, #ffffff 0%, #fdf8f4 100%);">
                  <p style="margin: 0 0 14px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #1a0f05; font-weight: 700;">Prepare for your interview</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; font-family: Segoe UI, Arial, sans-serif;">
                    <tr>
                      <td style="padding-bottom: 12px;" valign="top">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0;">
                          <tr>
                            <td valign="top" style="width: 34px; padding-right: 10px;">
                              <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">1</span>
                            </td>
                            <td valign="top">
                              <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #5c3d20;"><strong style="color: #1a0f05;">Re-read the job description.</strong> Refresh your memory on the must-haves and deal-breakers so you can speak to them directly.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 12px;" valign="top">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0;">
                          <tr>
                            <td valign="top" style="width: 34px; padding-right: 10px;">
                              <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">2</span>
                            </td>
                            <td valign="top">
                              <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #5c3d20;"><strong style="color: #1a0f05;">Check your contact details.</strong> Make sure the email and phone number on your application are current so the invite reaches you without delay.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td valign="top">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0;">
                          <tr>
                            <td valign="top" style="width: 34px; padding-right: 10px;">
                              <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">3</span>
                            </td>
                            <td valign="top">
                              <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #5c3d20;"><strong style="color: #1a0f05;">Block time in your calendar.</strong> Keep the next few days free around your preferred slots so you can respond to the interview invite quickly.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Divider -->
                <div style="height: 1px; background: #f0e6da; line-height: 1px; font-size: 1px; margin-bottom: 0;">&nbsp;</div>

                <!-- Footer -->
                <div style="padding: 18px 10px 0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; line-height: 1.8; color: #7a5c42;">
                    Questions about your application? Reach us at
                    <a href="mailto:hello@rankwise.io" style="color: #c2520f !important; font-weight: 700; text-decoration: underline;">hello@rankwise.io</a>
                  </p>
                  <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.8; color: #7a5c42;">
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
</html>`,
      });
    }
    for (const rejected of shortlisted_array) {
      let job = await Job.findOne({ job_title: rejected.job_title });
      if (!job) {
        throw new Error("Could not get the job details from the database");
      }
      let job_location = job.job_location;
      let company_name = job.company_name;
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        auth: {
          user: env.USER_EMAIL,
          pass: env.USER_PASS,
        },
      });
      transporter.sendMail({
        from: env.USER_PASS,
        to: rejected.email,
        subject: "Application Results",
        text: "You have been shortlisted",
        html: `<!doctype html>
<html lang="en" style="margin: 0; padding: 0; background-color: #fdf8f4;">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Your application — WiseRank</title>
    <style>
@media only screen and (max-width: 640px) {
  .wr-wrapper { padding: 14px 8px 24px; }
  .wr-hero { padding: 24px 20px 20px; border-radius: 18px 18px 0 0; }
  .wr-title { font-size: 27px; }
  .wr-section { padding-left: 16px; padding-right: 16px; }
  .wr-section-last { border-radius: 0 0 18px 18px; }
  .wr-surface, .wr-step-card { padding: 16px; }
  .wr-tip-cell {
    display: block !important;
    width: 100% !important;
    padding-right: 0 !important;
    padding-bottom: 10px !important;
  }
  .wr-tip-cell-last { padding-bottom: 0 !important; }
}
    </style>
  </head>
  <body style="margin: 0; padding: 0; font-family: Segoe UI, Arial, sans-serif; background-color: #fdf8f4; background: radial-gradient(circle at top, rgba(251, 146, 60, 0.10), transparent 34%), #fdf8f4; color: #1a0f05;">

    <!-- Preheader -->
    <div style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all;">
      Thank you for applying — we have carefully reviewed your application and will not be moving forward at this time.
    </div>

    <!-- Layout -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#fdf8f4" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; background-color: #fdf8f4;">
      <tr>
        <td align="center" class="wr-wrapper" style="padding: 24px 14px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; max-width: 640px;">

            <!-- ── HERO ── -->
            <tr>
              <td class="wr-hero" style="padding: 28px 28px 24px; border-radius: 22px 22px 0 0; background-color: #1a0f05; background: radial-gradient(circle at 92% 14%, rgba(251, 191, 120, 0.24), transparent 22%), linear-gradient(135deg, #2d1a08 0%, #1a0f05 58%, #0d0602 100%); color: #fdf8f4;">

                <!-- Brand lockup -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; margin-bottom: 18px;">
                  <tr>
                    <td width="48" valign="middle" style="width: 48px; vertical-align: middle;">
                      <!--[if !mso]><!-- -->
                      <img src="https://res.cloudinary.com/da7sdnt5z/image/upload/v1777007048/icon_cifdka.png" width="46" height="46"/>
                      <!--<![endif]-->
                    </td>
                    <td valign="middle" style="padding-left: 12px; vertical-align: middle;">
                      <div style="font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: #fdf8f4;">WiseRank</div>
                      <div style="margin-top: 3px; font-size: 12px; color: rgba(253, 248, 244, 0.60);">Recruiter Workspace</div>
                    </td>
                  </tr>
                </table>

                <!-- Kicker -->
                <div style="display: inline-block; margin-bottom: 14px; padding: 7px 12px; border: 1px solid rgba(254, 215, 168, 0.18); border-radius: 999px; background: rgba(251, 146, 60, 0.16); color: #fed7a8; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                  Application Update
                </div>

                <h1 style="margin: 0 0 10px; font-size: 30px; line-height: 1.14; letter-spacing: -0.04em; color: #fdf8f4; font-family: Segoe UI, Arial, sans-serif;">
                  Thank you for applying, ${rejected.first_name}
                </h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.65; color: rgba(253, 248, 244, 0.78);">
                  We sincerely appreciate your interest in <strong style="color: #fdf8f4;">{{jobTitle}}</strong> at <strong style="color: #fdf8f4;">${company_name}</strong>. After careful consideration, we will not be moving forward with your application at this time.
                </p>

              </td>
            </tr>

            <!-- ── ROLE DETAIL CARD ── -->
            <tr>
              <td class="wr-section wr-section-first" style="padding: 24px 24px 0; background-color: #ffffff; border-left: 1px solid #f0e6da; border-right: 1px solid #f0e6da;">

                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #f0e6da; border-radius: 18px; background: linear-gradient(180deg, #ffffff 0%, #fdf8f4 100%);">
                  <p style="margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #1a0f05; font-weight: 700;">Role details</p>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; font-family: Segoe UI, Arial, sans-serif;">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 13px; font-weight: 700; color: #b8966e; text-transform: uppercase; letter-spacing: 0.05em; width: 120px;" valign="top">Role</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 15px; color: #1a0f05; font-weight: 600;" valign="top">${rejected.job_title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 13px; font-weight: 700; color: #b8966e; text-transform: uppercase; letter-spacing: 0.05em;" valign="top">Company</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 15px; color: #1a0f05; font-weight: 600;" valign="top">${company_name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 13px; font-weight: 700; color: #b8966e; text-transform: uppercase; letter-spacing: 0.05em;" valign="top">Location</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f5ece3; font-size: 15px; color: #1a0f05; font-weight: 600;" valign="top">${job_location}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #b8966e; text-transform: uppercase; letter-spacing: 0.05em;" valign="top">Stage</td>
                      <td style="padding: 10px 0;" valign="top">
                        <span style="display: inline-block; padding: 5px 12px; border-radius: 999px; background: rgba(251, 146, 60, 0.10); color: #c2520f; font-size: 13px; font-weight: 800;">Not Selected</span>
                      </td>
                    </tr>
                  </table>
                </div>

              </td>
            </tr>

            <!-- ── A PERSONAL NOTE ── -->
            <tr>
              <td class="wr-section" style="padding: 16px 24px 0; background-color: #ffffff; border-left: 1px solid #f0e6da; border-right: 1px solid #f0e6da;">

                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid rgba(251, 146, 60, 0.20); border-radius: 18px; background: linear-gradient(180deg, rgba(251, 146, 60, 0.08) 0%, rgba(26, 15, 5, 0.02) 100%);">
                  <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #c2520f;">A note from the team</p>
                  <p style="margin: 0; font-size: 15px; line-height: 1.68; color: #5c3d20;">
                    This was a genuinely difficult decision — we received a strong pool of candidates. This outcome reflects the competitive nature of this particular role and not a judgment on your overall abilities or potential.
                  </p>
                </div>

              </td>
            </tr>

            <!-- ── WHAT YOU CAN DO NOW ── -->
            <tr>
              <td class="wr-section" style="padding: 16px 24px 0; background-color: #ffffff; border-left: 1px solid #f0e6da; border-right: 1px solid #f0e6da;">

                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #f0e6da; border-radius: 18px; background: linear-gradient(180deg, #ffffff 0%, #fdf8f4 100%);">
                  <p style="margin: 0 0 16px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #1a0f05; font-weight: 700;">What you can do now</p>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; font-family: Segoe UI, Arial, sans-serif; width: 100%;">
                    <tr>
                      <td class="wr-tip-cell" valign="top" style="width: 33.33%; padding-right: 10px; vertical-align: top;">
                        <div class="wr-step-card" style="padding: 16px; border: 1px solid #f0e6da; border-radius: 16px; background: #ffffff;">
                          <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">1</span>
                          <p style="margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #1a0f05;">Stay in our talent pool</p>
                          <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #7a5c42;">New roles open regularly. We will reach out when a position matches your profile.</p>
                        </div>
                      </td>
                      <td class="wr-tip-cell" valign="top" style="width: 33.33%; padding-right: 10px; vertical-align: top;">
                        <div class="wr-step-card" style="padding: 16px; border: 1px solid #f0e6da; border-radius: 16px; background: #ffffff;">
                          <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">2</span>
                          <p style="margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #1a0f05;">Request feedback</p>
                          <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #7a5c42;">Reply to this email to ask for specific feedback on your application. We do our best to respond.</p>
                        </div>
                      </td>
                      <td class="wr-tip-cell wr-tip-cell-last" valign="top" style="width: 33.33%; vertical-align: top;">
                        <div class="wr-step-card" style="padding: 16px; border: 1px solid #f0e6da; border-radius: 16px; background: #ffffff;">
                          <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">3</span>
                          <p style="margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #1a0f05;">Browse open roles</p>
                          <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #7a5c42;">Other positions may be a better fit right now. Visit our jobs board to explore.</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>

              </td>
            </tr>

            <!-- ── BOTTOM SECTION ── -->
            <tr>
              <td class="wr-section wr-section-last" style="padding: 16px 24px 28px; background-color: #ffffff; border-left: 1px solid #f0e6da; border-right: 1px solid #f0e6da; border-bottom: 1px solid #f0e6da; border-radius: 0 0 22px 22px;">

                <!-- Tips to strengthen future applications -->
                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #f0e6da; border-radius: 18px; background: linear-gradient(180deg, #ffffff 0%, #fdf8f4 100%);">
                  <p style="margin: 0 0 14px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #1a0f05; font-weight: 700;">Strengthen your next application</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; font-family: Segoe UI, Arial, sans-serif;">
                    <tr>
                      <td style="padding-bottom: 12px;" valign="top">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0;">
                          <tr>
                            <td valign="top" style="width: 34px; padding-right: 10px;">
                              <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">1</span>
                            </td>
                            <td valign="top">
                              <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #5c3d20;"><strong style="color: #1a0f05;">Tailor your CV to each role.</strong> Highlight achievements that directly match the responsibilities listed and use the same language as the job post.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom: 12px;" valign="top">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0;">
                          <tr>
                            <td valign="top" style="width: 34px; padding-right: 10px;">
                              <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">2</span>
                            </td>
                            <td valign="top">
                              <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #5c3d20;"><strong style="color: #1a0f05;">Lead with measurable impact.</strong> Hiring teams respond to concrete numbers — percentages, timelines, and outcomes tell a clearer story than responsibilities alone.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td valign="top">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0;">
                          <tr>
                            <td valign="top" style="width: 34px; padding-right: 10px;">
                              <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background: rgba(251, 146, 60, 0.14); color: #c2520f; font-size: 13px; font-weight: 800;">3</span>
                            </td>
                            <td valign="top">
                              <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #5c3d20;"><strong style="color: #1a0f05;">Keep applying.</strong> Recruitment outcomes depend on timing, team composition, and many factors outside your control. Persistence pays off.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Divider -->
                <div style="height: 1px; background: #f0e6da; line-height: 1px; font-size: 1px; margin-bottom: 0;">&nbsp;</div>

                <!-- Footer -->
                <div style="padding: 18px 10px 0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; line-height: 1.8; color: #7a5c42;">
                    Questions about your application? Reach us at
                    <a href="mailto:hello@rankwise.io" style="color: #c2520f !important; font-weight: 700; text-decoration: underline;">hello@rankwise.io</a>
                  </p>
                  <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.8; color: #7a5c42;">
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
</html>`,
      });
    }
  } catch (error) {
    controlDebug("Error in Emailing Controller");
    console.error(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export default emailingController;
