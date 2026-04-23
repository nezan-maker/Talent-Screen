import nodemailer from "nodemailer";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import env from "../config/env.js";
import { controlDebug } from "./authControl.js";
const emailingController = async (req, res) => {
    try {
        const { job_title } = req.body;
        if (!job_title) {
            return res.status(400).json({ data_error: "No job name provided" });
        }
        const shortlisted_applicants = await Applicant.find({
            shortlisted: true,
            job_title,
        });
        if (!shortlisted_applicants) {
            return res
                .status(400)
                .json({ data_error: "No shortlisted appplicants for this job yet " });
        }
        for (let appL_index = 0; appL_index < shortlisted_applicants.length; appL_index++) {
            let current_json = shortlisted_applicants[appL_index];
            if (!current_json) {
                throw new Error("Could not get applicant email ");
            }
            let applicant_first_name = current_json.applicant_name.split(" ")[0];
            let job_title = current_json.job_title;
            let sendEmail = current_json.applicant_email;
            let job = await Job.findOne({ job_title });
            if (!job) {
                throw new Error("Could not get the job details from the database");
            }
            let job_location = job.job_location;
            let company_name = job.company_name;
            let current_stage = job.job_state;
            const transporter = nodemailer.createTransport({
                host: "smtp.gmail.com",
                port: 587,
                auth: {
                    user: env.USER_EMAIL,
                    pass: env.USER_PASS,
                },
            });
            transporter.sendMail({
                from: env.USER_EMAIL,
                to: sendEmail,
                text: `Dear ${applicant_first_name} you have been shortlisted`,
                html: `<!doctype html>
<html lang="en" style="margin: 0; padding: 0; background-color: #f8fafc;">
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
  <body style="margin: 0; padding: 0; font-family: Segoe UI, Arial, sans-serif; background-color: #f8fafc; background: radial-gradient(circle at top, rgba(16, 185, 129, 0.12), transparent 34%), #f8fafc; color: #0f172a;">

    <!-- Preheader -->
    <div style="display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; mso-hide: all;">
      Congratulations — you have been shortlisted for the Senior Frontend Engineer role at WiseRank. Here is what happens next.
    </div>

    <!-- Layout -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f8fafc" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; background-color: #f8fafc;">
      <tr>
        <td align="center" class="wr-wrapper" style="padding: 24px 14px 36px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; width: 100%; max-width: 640px;">

            <!-- ── HERO ── -->
            <tr>
              <td class="wr-hero" style="padding: 28px 28px 24px; border-radius: 22px 22px 0 0; background-color: #0f172a; background: radial-gradient(circle at 92% 14%, rgba(110, 231, 183, 0.22), transparent 22%), linear-gradient(135deg, #13253b 0%, #0f172a 58%, #08111c 100%); color: #f8fafc;">

                <!-- Brand lockup -->
                <table role="presentation" cellpadding="0" cellspacing="0" style="font-family: Segoe UI, Arial, sans-serif; border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; margin-bottom: 18px;">
                  <tr>
                    <td width="48" valign="middle" style="width: 48px; vertical-align: middle;">
                      <!--[if mso]>
                      <div style="width:46px;height:46px;line-height:46px;text-align:center;border-radius:14px;background:#0f172a;color:#ffffff;font-family:Segoe UI,Arial,sans-serif;font-size:20px;font-weight:800;">W</div>
                      <![endif]-->
                      <!--[if !mso]><!-- -->
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="46" height="46" aria-hidden="true" style="display: block; width: 46px; height: 46px;">
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
                        <path d="M14 35.5C18.2 27.1667 24.2 23 32 23C39.8 23 45.8 27.1667 50 35.5" stroke="url(#wrBrandSweep)" stroke-width="3.2" stroke-linecap="round" />
                        <path d="M16.5 20.5L24 42L32 28.5L40 42L47.5 20.5" stroke="#F8FAFC" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" />
                        <circle cx="32" cy="15.5" r="5.5" fill="#34D399" />
                        <path d="M29.5 15.7L31.2 17.5L34.7 13.6" stroke="#052E26" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      <!--<![endif]-->
                    </td>
                    <td valign="middle" style="padding-left: 12px; vertical-align: middle;">
                      <div style="font-size: 18px; font-weight: 800; letter-spacing: -0.03em; color: #f8fafc;">WiseRank</div>
                      <div style="margin-top: 3px; font-size: 12px; color: rgba(248, 250, 252, 0.72);">Recruiter Workspace</div>
                    </td>
                  </tr>
                </table>

                <!-- Kicker -->
                <div style="display: inline-block; margin-bottom: 14px; padding: 7px 12px; border: 1px solid rgba(167, 243, 208, 0.16); border-radius: 999px; background: rgba(16, 185, 129, 0.14); color: #a7f3d0; font-size: 11px; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">
                  Application Update
                </div>

                <h1 style="margin: 0 0 10px; font-size: 30px; line-height: 1.14; letter-spacing: -0.04em; color: #f8fafc; font-family: Segoe UI, Arial, sans-serif;">
                  You have been shortlisted, ${applicant_first_name}
                </h1>
                <p style="margin: 0; font-size: 15px; line-height: 1.65; color: rgba(241, 245, 249, 0.84);">
                  Your application for <strong style="color: #f8fafc;">{{jobTitle}}</strong> at <strong style="color: #f8fafc;">${company_name}</strong> stood out. The hiring team has moved you forward — read on to see what comes next.
                </p>



              </td>
            </tr>

            <!-- ── ROLE DETAIL CARD ── -->
            <tr>
              <td class="wr-section wr-section-first" style="padding: 24px 24px 0; background-color: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">

                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                  <p style="margin: 0 0 10px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a; font-weight: 700;">Role details</p>

                  <!-- Detail rows -->
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; font-family: Segoe UI, Arial, sans-serif;">
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; width: 120px;" valign="top">Role</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #0f172a; font-weight: 600;" valign="top">${job_title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;" valign="top">Company</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #0f172a; font-weight: 600;" valign="top">${company_name}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;" valign="top">Location</td>
                      <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 15px; color: #0f172a; font-weight: 600;" valign="top">${job_location}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0; font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;" valign="top">Stage</td>
                      <td style="padding: 10px 0;" valign="top">
                        <span style="display: inline-block; padding: 5px 12px; border-radius: 999px; background: rgba(16, 185, 129, 0.1); color: #059669; font-size: 13px; font-weight: 800;">${current_stage}</span>
                      </td>
                    </tr>
                  </table>
                </div>

              </td>
            </tr>

            <!-- ── WHAT HAPPENS NEXT ── -->
            <tr>
              <td class="wr-section" style="padding: 16px 24px 0; background-color: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;">

                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                  <p style="margin: 0 0 16px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a; font-weight: 700;">What happens next</p>

                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; font-family: Segoe UI, Arial, sans-serif; width: 100%;">
                    <tr>
                      <!-- Step 1 -->
                      <td class="wr-step-cell" valign="top" style="width: 33.33%; padding-right: 10px; vertical-align: top;">
                        <div class="wr-step-card" style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
                          <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">1</span>
                          <p style="margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #0f172a;">Recruiter review</p>
                          <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #64748b;">The hiring team reviews your full profile and confirms interview availability.</p>
                        </div>
                      </td>
                      <!-- Step 2 -->
                      <td class="wr-step-cell" valign="top" style="width: 33.33%; padding-right: 10px; vertical-align: top;">
                        <div class="wr-step-card" style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
                          <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">2</span>
                          <p style="margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #0f172a;">Interview invite</p>
                          <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #64748b;">You will receive a calendar invite or a link to book your interview slot.</p>
                        </div>
                      </td>
                      <!-- Step 3 -->
                      <td class="wr-step-cell wr-step-cell-last" valign="top" style="width: 33.33%; vertical-align: top;">
                        <div class="wr-step-card" style="padding: 16px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
                          <span style="display: inline-block; width: 28px; height: 28px; line-height: 28px; text-align: center; border-radius: 999px; background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">3</span>
                          <p style="margin: 12px 0 8px; font-size: 15px; font-weight: 700; color: #0f172a;">Meet the team</p>
                          <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #64748b;">Join the interview and show us what you can do. We keep it focused and practical.</p>
                        </div>
                      </td>
                    </tr>
                  </table>
                </div>

              </td>
            </tr>

            <!-- ── BOTTOM SECTION ── -->
            <tr>
              <td class="wr-section wr-section-last" style="padding: 16px 24px 28px; background-color: #ffffff; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 0 0 22px 22px;">

                <!-- Muted note -->
                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid rgba(16, 185, 129, 0.18); border-radius: 18px; background: linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, rgba(15, 23, 42, 0.02) 100%);">
                  <p style="margin: 0 0 6px; font-size: 11px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: #059669;">A note from the team</p>
                  <p style="margin: 0; font-size: 15px; line-height: 1.68; color: #475569;">
                    We run a focused, transparent process. If your availability changes or you have questions before the interview, just reply to this email and we will get back to you promptly.
                  </p>
                </div>

                <!-- Interview prep checklist -->
                <div style="margin-bottom: 16px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 18px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                  <p style="margin: 0 0 14px; font-size: 21px; line-height: 1.28; letter-spacing: -0.03em; color: #0f172a; font-weight: 700;">Prepare for your interview</p>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0; font-family: Segoe UI, Arial, sans-serif;">
                    <tr>
                      <td style="padding-bottom: 12px;" valign="top">
                        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse: collapse; border-spacing: 0; mso-table-lspace: 0; mso-table-rspace: 0;">
                          <tr>
                            <td valign="top" style="width: 34px; padding-right: 10px;">
                              <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">1</span>
                            </td>
                            <td valign="top">
                              <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #475569;"><strong style="color: #0f172a;">Re-read the job description.</strong> Refresh your memory on the must-haves and deal-breakers so you can speak to them directly.</p>
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
                              <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">2</span>
                            </td>
                            <td valign="top">
                              <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #475569;"><strong style="color: #0f172a;">Check your contact details.</strong> Make sure the email and phone number on your application are current so the invite reaches you without delay.</p>
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
                              <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; border-radius: 999px; background: rgba(16, 185, 129, 0.12); color: #059669; font-size: 13px; font-weight: 800;">3</span>
                            </td>
                            <td valign="top">
                              <p style="margin: 0; font-size: 14px; line-height: 1.65; color: #475569;"><strong style="color: #0f172a;">Block time in your calendar.</strong> Keep the next few days free around your preferred slots so you can respond to the interview invite quickly.</p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </div>

                <!-- Divider -->
                <div style="height: 1px; background: #e2e8f0; line-height: 1px; font-size: 1px; margin-bottom: 0;">&nbsp;</div>

                <!-- Footer -->
                <div style="padding: 18px 10px 0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; line-height: 1.8; color: #64748b;">
                    Questions about your application? Reach us at
                    <a href="mailto:hello@rankwise.io" style="color: #059669 !important; font-weight: 700; text-decoration: underline;">hello@rankwise.io</a>
                  </p>
                  <p style="margin: 8px 0 0; font-size: 12px; line-height: 1.8; color: #64748b;">
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
    }
    catch (error) {
        controlDebug("Error in Emailing Controller");
        console.error(error);
        res.status(500).json({ server_error: "Internal server error" });
    }
};
export default emailingController;
//# sourceMappingURL=shortListEmails.js.map