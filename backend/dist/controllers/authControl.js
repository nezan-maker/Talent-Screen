import bcrypt from "bcrypt";
import User from "../models/User.js";
import { signupSchema, loginSchema, forgotSchema, resetSchema, verifyCSchema, } from "../validations/authValidations.js";
import debug from "debug";
import z from "zod";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
export const controlDebug = debug("app:controller");
const ACCESS_SECRET = env.ACCESS_SECRET;
const REFRESH_SECRET = env.REFRESH_SECRET;
export const signUp = async (req, res) => {
    try {
        const { user_name, user_email, user_pass, user_pass_conf, company_name } = req.body;
        console.log(company_name);
        let reqBody = {
            user_name,
            user_email,
            user_pass,
            user_pass_conf,
            company_name,
        };
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
            company_name: user_details.company_name,
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
            subject: "WiseRank Sign up Verification",
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
      <img src="data:image/png;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAEAAQADASIAAhEBAxEB/8QAHQAAAQQDAQEAAAAAAAAAAAAAAAQFBgcBAwgCCf/EAFAQAAEDAgIGBQUMBgcIAwEAAAEAAgMEBQYRBxIhMUFhEyJRcYEIFDKRoRUjRVJigqOxwcLR4UJEcoOS4hYkMzRDY6I1U2RlpLKz8AklJtL/xAAaAQACAwEBAAAAAAAAAAAAAAAAAwECBAUG/8QALhEAAgIBAwMEAQMEAwEAAAAAAAECAxEEEiEFMUETIjJRsTNhcUKBwdEGUpHw/9oADAMBAAIRAxEAPwDjJCEIAEIQgAQhCABCEIAEIQgAQhCABCEIAEIQgAQhCABCEIAEIQgAQhCABCEIAEIQgAQhCABCEIAEIQgAQhCABCFIcFYQvGK6zoqCLUp2HKapkGUcf4nkPZvQVnOMFuk+CPtaXODWglxOQAG0qc4X0XYmvLWTVELbZTO269SCHkcmb/XkrDo6DBujmEarPdG8au17gDJny4Rj25dqjeIMbXy7Ocxs5o6c7ooDkcubt5+rkmQqlPldjBLVWWfpLC+2OkOj3AVgaDfrq+snA60bpdQeDGdb2lK4b5o/th1bbhyKVw3SClZ/3O6yrskk5k5krfA1aVporuKlXKXzk2WXDpDpY9lPYg1vD34N+pqVx6Rc/gb/AKn+RVxA1L4GodMPozyor+iwosf5/BH/AFP8qVxY7z+Cf+o/lUBgal8DVR1Q+hEqofROYsbZ/Bf0/wDKlUWMs/g36f8AlULgbtS6Bio64fQiUYkwixaT8HfTfypVFinP4P8Apv5VFIGJdBGquuP0Ilgk0eJSf1H6X8kpjxCT+o/S/ko9DHuSyGNUcIiZSHxl+J/U/pfyXt1zpqhurUW5kjTvDsnfWE1xRckpji5KNqFOxoRXPCWj29tc244XoGuf6UjKcRP/AIo8nKDYm8nrD1wjfPhe8z0Eu8Qznpou7PY5veS5WY2HkvbY3McHMJa4biDkVGB1XULqn7ZM5Fx1o4xbg1zn3e2OdSA5Cspz0kJ+dvb3OAKiK71ir3GN0NZG2eJw1XAgHMdhG4qp9J2gy0XuGW7YKMNvrfSdR55QSnsH+7d/p5Deoz9nd0nWYWe23h/ZzEhK7vba+0XKa3XOklpKuB2rJFK3JzT+HYdxSRSdpNNZQIQhBIIQhAAhCEACEKQ4AwvU4rxBHQRa0dOzr1MwH9mz8TuH5FBWc1CLlLshz0Y4FqsV1vnFRrwWqF2UsoG2Q/EZz7TwVi4oxXR2WiGHsKRxwRQjUdNGNje0N7T2uP5ox1fqWyW9mFMPNbTxQs6OZ0Z9EfEB7TvJ596rpaqKc+6Ry25aiW+fbwjMj3ySOkkc573HNznHMk9pXlCFrHGW7SlcA3JLH6SXU43KGVkLKdqXwNSSAJfTjcqMzzFcDU4QN3JJANycKVjnOa1rS5xOQAG0lLbMs2KqdqcIGqWYawdGyJlRdgXPIzEAOQH7R7eSltNS01M0Np6eKIDgxgCzytXg83q+u01yca1u/BWtOzcl8DFPZqeCYZTQxyD5TQU0V9jjAMtGC0jaYydh7lX1ExNPWqrXtmtv4GiBiXQRrTCzI5EZHil8DNyGzfKR7hj5JXHDyWYI0thjVGzPKRpbDyWTDs3JeyHksuh2KMit41PiWpj5aeTpInap4jgU5SxpFOzepGRkRrSTgWyaRbOWTtbSXeBh83q2t6zOTvjMz4cOGS5GxVYLphm+T2e8UxgqoTt4te3g5p4tPA/au0nOfDIJI3FrhuIUc0q4KodImGy1nRwXmkaTSzHgfiO+Q72Hb2gnY7/TOoup7J/H8HHiFvuFJU0FdPQ1kL4KmCQxyxvGRa4HIgrQg9SnkEIQgAQhCAMtaXODWglxOQAG0q/LVTR6OdHjW6rfdiu2vPHpCN3cweGfeq80J2IXjGcVRMzWpre3zh+e4vz6g9e35pT/AKSLwbriWZrHZ09LnDF2Ej0j4n2AJlMN8uexztVL1LFV4XL/AMEbke+SR0kji57iS5xOZJPFeUIXSJBBKwShQTg2Qjal8A3JDDvS+nVWUmL4BuThANyQQcFKrDhu4VwbJI3zaE7dZ42nuCXJ4MlklHliOnG5WFoutLJ6iS6TMzbAdSIEbNfifAZetZtOG7ZSZF0XnD/jS7R6tynNoY2OgY1jQ0bdgGXFZrbOMI831vWOGmah54FaFT+kvSbebRime0WeKnjipC0SPlj1jI4gE8dg25dvNPtm0q2WowlNda8tgr6cBslG07ZHndqZ72n2bc+efazzUuk6pVRtUcqWO379skg0gYtosJ2c1U2rLVSZtpqfPbI7tPY0cT+Kq3BelHEtTiyjpbnJDU0lZUNhMTYWt6PWIALSNuwkb81A8U36vxHeZbncZNaR+xjB6MbeDWjsH5q19C+ATSiHEt6hInI1qOBw/swf8Rw7ewcN+/dfCS5O7LQaXp+jb1CTk/z9L+Pssa6U4bMJmjIP2O71inCd4wC/IgEFZfSQO2huoe1qqpGDRavNKjLxwJ6dqcIGJM2F0Z+MO0JXTlDNTmpLKFsMeYWZY8kRSZLE0maqK5yIZ2pvqBvS+odvTfUO3qyHwG+o4pJHUPpahsrOG8do7EpqDvTdUOVka4FYeUvguKsoWY3tMPvrA1le1o9Nm5sh5t9E8suxc9rtWgfBVQVFqrGNlp6iNzSx20OBGTm+IXJGP8OzYWxbXWWXWLIZM4Xn9OI7WH1b+YKjGD1fStTvh6cu6GFCEIOsCEIQBdmiiIWDRdcb8QGz1TnuY7k3qMH8Wt61BySTmTmSrCxQ33L0U2O2t6rpGQh47eprO/1ZKvFt0yxHJya3ulKf2wWCUEoWgeCwSgld1eTXoQw/hfClBiDEFrp7hiKuhbUONTGHto2uGbWMadgcARm7fnmAclSc1BZZeMXJnDUCd7TSVFdUtp6WIySO4DgO09gX0txHhrD+I7c63X2z0VwpXN1ejnhDtUfJO9p5jIhcsaQ9G9Do5xG6htbXm31jTPTySHWflnkWE8dX6iOOaT66fgTqk6oblyQXDOGaW3hs1QG1FTv1iOq08h9v1KVNcyJhfI9rGgZlzjkAmS8XmktEAdMdeZw6kTTtd+A5qGXG81t0lznk1YwerE3Y0fieaphy5Zx9k7Xlk6rcWUUBMdGw1Lx+lnkz18VKMAXl92t0zZ9Rs0MnotGQ1Tu9uapuAqRYVu8tnubKpgLmEasrM/Sb+KrOtNcGHqXT1fp3CHy7oedMWADemPv1njzuUbR08I/WGgbx8oD1jZvyVDuBa4tcCCDkQeC69t1bTXClZU0kokjdxG8HsI4FR+56P8J3K8G61dqa6oc7WkDXuayR3a5oOR+3jmkKWOGcPpvW3pIunUJtLt9r9iuNDOAPP3xYivUH9UadakgeP7Uj9Nw+KOA492+71hjGxsaxjQ1rRk1oGQA7AvFRNFTxGWV4a0e1Vbyzk63WW667dL+y+jXXVRpgwsyLnHcexbKW4xyZCQah9YUeqKx1VUGQ7BuaOwLfC9W28Ha0+hUKVGXck4cCMwQQjWAOYTPS1Lo9gOzsS+OZsgzB29iq1gxXVWUPcuwsbNzWHzbN6d8BWD+kN66GZzm0sLeknLd5HBo7/qBV1UFvoaCnEFHSwwRgZarGgZ9/b4qUsnf6T02evq9Vvav/AHJzpNKkM8iuzSNg6iuVpqK+gp2QXCBhkHRtyEoG0tIHHsKoeaXmpwX1WhnpJ7Zc57M1zvTfUP3rdPIkFRIrIpCJqdM6KVsrD1mnMKuPKeszKm3WvE9OzrMPm0xA2ljs3MJ7jrD5ynlQ9IccUovOi280bhrOigfIwcdaP3wfVkpaOnoZuu1M5YQhCoerBCEIAvrTF71Q2enb6IEnsDB9qrclWNpqOfuT+++4q5W+j9NHJ036aBYJQSsJxoBfUzCV3pb/AIWtd7oSDTV9JFUR5cA5oOXhnl4L5ZErujyIcQz3TRI6zVZPSWmqeyDM7TA8lzT4P6QdwCz6hZjkZVLDwXyql8qmgldoxmv1LTiaqtEglA/y3kMf4DNrjyaraSK+2ylvVkrrRXM16Wtp5KeZvax7S0+wrKnhjbIKyLiz5pSVU9XUPqKiR0krzm5xSuBy13611VhxDcLJWjKpoKmSnl2b3McWkjkcs08Yfw7cbiGv1RBCf05Bln3DeVsbSRybXGC93BqgO5OVFHNO8MgifK7sY0k+xTOx4StVMGunY6qk7ZD1f4R9uamdtghgYGQxRxM+KxoA9iRKxeDl26yP9KILh62YpppRLQUdTETvDsmh3eHKdW9uK3MAqLRTOPa2oDfxT3SjcnakG5IlLPg5eorq1DzZBNkZlo8VPb7xaadp51DXfgmausOKnv6WrttVKRuDAHgdwbmrVpRuTrSt3Km/HgKNNVS8wikUM6Oemf0dRDLC/wCK9pafat8UnNXzUwQTxdFUQxzMO9r2hw9RUXvGCbJV6z6eN1FKeMR6v8J2erJSrMmr089iuI5VvjnLTmDtSu+YXutq1pAzzqnH+JENw5t3j6k22iCa5XOlt9PtlqZWxM73HJX7iZVNva0X9oboPN8KCvkZqy1zy/5jdjftPipstFvpYqGgp6KAZRQRtjYOTRkFvUHtdJp46amNUeyQlvFZFb7TV105Aip4XSOz7AM8lybLLzV8afbpJRYMFFCetWTBsmXCNu0+3VHiueJZuak4nWLFO1QX9P8Ak9zS79qQzyIll5pHNLzVsHNjE8zyc0qs+VRQV1M7a17dUjvBCaZ5EvwzJ/evmfapfY1VrDOUEIQlHrQQhCAL300/BP777irklWLppP8Asn999xVyuhR8EcrT/poFglBKE0eb7bSyV1fBSRenK8NB7OfgurPJtuseHMdUVuadSjrovMiOGtvYe/WAHziue9F9D010nrXDNtOzVb+078gfWrCrrm+yUUl3ifqS0g6WJ3Y8Hq/6slnteXgxXWuNsUvB3ghMeAMQ0+LMFWfElNqiO40kc5aD6DiOs35rsx4J8WR8HZOWvKSwTQ2/SY3E7afWF2ha85jqtljAY7IduWoe8lRGj4LpHygLGLvo/nqmMzntrxVNPHUGx47tU5/NXIF5xpBSF1Naw2eYbDKdrG93b9XemRzI831DT2S1DS5zyWE2eClh6apmjhjG9z3AD2pDUY8stKdWnE1W4cWN1W+s/gqhqblWXCfpqyokmf8AKOwdw3DwWyF6v6S8iY6GK+TyWe7SVXk/1W3U0Q/zHOf9WSzHpFxCT1X0rO6H8SolgqyV+J8SUNhtrNapq5QwE7mDe555AAk9y7bwFgLDeDbbFTWugidUNaOlrJGAzSu4ku4DkNgVJKMfBqo6fG3ssI5hpNJWJGEEvpH8nQ/gVILXpauUZHnlqpJh/lPdGfbrLoHHGBsO4ut8tPcqGJtQWnoquNgE0TuBDuI5HYVyDiaz12GsQ1lkuLdWopZCwkbnje1w5EZEd6qoxl4F6nQ+hz4LptOk7D9cQyqbUUDzxkbrM9bdvrAUqpq2lrYBPSVEVREdz43hw9i5hjlTlabvXWyoE9BVyQScdU7D3jcfFVdS8GRLB0VI5bsDYYt02LW3xkAjlpGk9XY1z3AgEjtyzOarjC+kKnrSylvAZTTnY2ZuyN3f8U+zuV8YIpPN7HHMR16g9ITy4ezb4qqTRv0NSstTfjkfEITbim7RWLDlwvE+WpSQOkyP6TgOq3xOQ8VY77aSyyq9Ktcy6YiqKQnWgp2eb5c/0vHM5eCo+4NfS1UtPJ6Ubi0nt5qwKO4G5UrK9ztZ8413n5R3+3NQ3SBD0NfFVN2CZmTv2m/kR6kR7niVZK26UpeWMUsvNJJpVrlm5pJLLzTMGuMD3NLzThhiTPzr5n3kwzS805YXl/vXzPvKX2HwiczoQhIPTghCEAXppn+Cf333FXRKsPTMc/cr999xV4uhT8Ecuj9NAhCwSmDi0dGNL0WHOny2zyudnyHV+wrGlCWT3IpqCEEyVU42DiGjP6yE8YLhEWF7c0DLOEO9e37UkxjAPdCje8ZubE4tz4Bx2+vVCzZ9+TjytSu3M6H8im8f/gqvCc8xfNa5+mizP+HKSSByDw4/OCv5cXeTniD+juk+3OkfqU1fnRT7dmT8tX1PDPDNdopNnfJ2dFc7a+e6NNfSU9fQVFDVxiWnqInRSsO5zHAgjxBK+auNLHUYVxjdsO1OZkt9XJBrEem0Hqu8W5HxX0wXG/lx4X9zcdW3FUEeUN3p+hncB/jRZDM97CwD9gq1Lw8Db45jkoqF6WwyJohkVl6AMCy6QMe01vkY73Lpcqi4SDZlEDsZn2uPVHLM8E+XCyYHByeEdDeSVgM2fDjsY3KHKuujNWka4bY6fPPW73kZ9wb2lXsvEMUcMLIYY2xxxtDWMaMg0DYAB2L2sjeXk6VcFCO1AqY8p7BRuliZiy3xZ1ttZq1QaNslPnnn3sJJ7iexXOvM0cc0T4pWNkje0te1wzDgd4I7FCeGRbWrYOLOA45ea3sm5qRaaMHSYHxtPQxtd7nVOc9C8/7sn0M+1p2eo8VDGTc07uednU4tpkownbpr9iS32aAnXrKhkWY/RBO13gMz4LtykgipaWGlgYGQwsbHG0bmtAyA9S5p8k6xGvxVXYgmZnFboejiJH+LJmMx3NDv4gumkuXc63TqtkHL7BVt5QE3nOFG2KOYxyVj9ckfFYQQDyLsvUrJVD6Ubv7o4rqtR2cVN/V49vxd/wDqzVUP1csVtfZAMDzSsoqmhnaWy00xBaeAP55rxpCZ0lh6Yb4ZGuz5HZ9oTpQU7ZKupqIh750QLwP0gDv8M034u98w5Xt7Ii71bfsU+TzMqtlpWEs3NJpZea0STc0mlm5puDZGBtmlTnhaX+9bfifeUdll5p0wrLn51t+J95DXA6MSg0IQs53wQhCALx0yfBX777ir1WDpjP8Asr999xV4V0KfgjmUL2IySsIQmDi+MGQiWwWv4opIif4Qm/Hjf/uoNmzzcf8Ac5PGjoiTB9skG3OAA+Gz7E3aSNSmmp6yU5RiF2Z/ZOf2rGvmeXc29S4/yQfE14kttOyGkkdHVSbQ9pyMY7R2HsX0E0TYojxpo4sWJmOaX1tI104bubM3qyDwe1wXzJuNXJW1klTJvedg7BwC678gTFvnNivmC6iXOSjlFfStJ29G/JsgHIODT3yK9sPbk9NpKvSjjyzqNVX5VeFf6U6GLsIY9estYFxp8ht97B1x4xl+ztyVqLzNHHNC+GVjXxvaWva4ZhwOwgrOnh5NrWVg+WNKXyyMjja573kNa1ozLidwAX0I8nfR8zR9o+p6WpiaLxXZVNxdxDyOrHn2MBy79Y8VSugLQhLQacb/AF13pnGz4Xryyg6QbKiUgPhdz1Y3MeflFvNdZJts88ITVXh5YJPc62lttuqbhXTsgpaaJ0s0rzsYxozJPgEoXNHlmaRhTU8Oj61z++zBtRdHNPos3xxePpHkG9qVGO54GTltjk6PtlbS3K3U1xoZ2T0tTE2WGVhzD2OGYI8ClC5p8jTSKKmml0f3Sf32EOntbnH0mb5IvDa4ci7sXSyJR2vAQnvjkgWnTA7cb4InpqeNpulHnUUDuJeBtjz7HDZ36p4LiZz3RvdHI1zHtJDmuGRBG8EL6LLmnTToilq9MFlrLXA4WvEVaG1uoNkEgzfK7lrMa5w5h3JWg/Bk1dG/El3LS8nbDxw/ostvSs1am4A102Y29fLUH8AZ45qxF5ijZFEyKNgYxjQ1rQMgANwC9Kj5NcIqEVFEf0jYgZhbA93vznAOpaZxiz3GU9Vg8XFq5PwdiJ9zo3U1XKX1cIzLnHMyN7e/t8FZXlnYnFLaLRhSCTKSqkNZUAHbqMzawHkXFx+YuZ7bc5bfXRVcLusw7Rn6Q4hMjHg5+qnmzH0X3hOXWusw4dAf+5qQY5jFNabkB6DqWQt/hOxGAamOrfNWQu1o3Qt1T3nP7F60mStbg65SuORbCQD3nV+1Rjkx2V7mUTJNzSeSbmkz5uaTyTc03A1QN8s3NOuFJf738z7yjUk3NO2E5f73t+J95D7DYwKhQhCynWBCEIAu7TF8FfvvuKvlYGmD4L/ffcVfroVfBHOp+CBYJQVhXGlz6G7iX4V82I1vNp3syz2gHrfWSvOmvpanDEM0QLWQzjpB2tIy+vVUW0M3EQ3uptz3ZNqotZn7TOHqJ9Ss2/21t2sdZb3Ze/xFrSdwdvafA5FZZe2eTzuoUaNZva85OdVYvk24t/obpksNyll6OjqJvMqsk5DopermeTXFrvmqu5o3xSvikaWPY4tc07wRvC8DYcwtLWUejT8n1oQoRoIxZ/TXRPYL++TpKqSmENWc9vTx9R5PeW63c4KbrntYeDSAAGeQ370IQgCM6UMY2/AeCLjia4kObTR5QxZ5GaU7GRjvPqGZ4L5yX6+V9/vtberpOZ62tmdNM88XOOezsA3AcBkrV8sjSeMW46/otaqjXs1ikdG4tPVnqtz3cw30B84jYVRkcq1VQwsme33MkuG75X2G90V5tk5grKOZs0LxwcDnt7QdxHEEr6LaMsX0GOcFW/ElvIa2pjymizzMMo2PYe4+sZHivmWybmr38kDSWMK42/ozc6jUs98e2NpcerDU7mO5B3oH5p3BRZDKyVqe14O4UEA5ZjduQhZjUCEKGabsUjBui6+X1kmpUx05ipTnt6aTqMI7i7W7gUJZBvCycb6f8WDFWla9V8UuvSwS+aUpBzHRxdXMcidZ3zlADNzSAzniUMe+WRsUYLnvcGtA3knctSWDmSjl5ZdWh24TUOHJXyt145pj0YzyIA7PHWWvTDfnPwz5q0ajZ5mtIzzJA632BKLRTtttopaFpHvMYa4ji7ifE5quNLF0E13goWOzFPHrO/ad+QHrS0syFQi5SIw+bmtEk3NJXzc1okm5puDSoCiSZO+E5v738z7yjEk3NPOEHk+d/M+8ofYYoFfoQhYzaCEIQBdel/4L/ffcUAKnulI+cW601bdrTrbf2g0/YoCt9XxRzqvggWCgoTBoqtFdLbLpTV8H9pBIHgduW8eI2Loy21MNdQwVlM7WhmYHsPIjNc0FWloWxC0tfh6qkyIzkpSePFzPtHik3RysnJ6tp3Ov1I91+Bn0xWA2+9i7QMypq45vyGxso3+vf61BF0tiGz018s89tqh1JW9VwG1jhucO4rna/Wuss11mt1bHqSxOyzG5w4OHIoqnlYZPSdYrq/Tk/dH8HU3/AMf+Letf8EVEu/VuVI0nujlH/iOXeutV8x9C2MjgLSbZcTO1zTU0+pVsZtLoHgsk2cSGkkDtAX0utFyoLxa6a6WurhrKKqjEsE8TtZr2ncQUm6OJZO7B5QqVSeVPpMGjvRzK2gnDL9dg6mt4B60ezrzfNBGXynN5q0bvcqCz2upul0q4aOipYzLPPK7Vaxo3klfN3T5pDqdJWkWtvpMjbdH/AFe2wu2dHA0nIkcHOJLjzOW4BRVDcwk8IgLiXEucSSdpJ4oDiFhYWsUbGylbY5yCCHEEbQQUlQoI2n0T8lzSW3SJo7ibXTh99tOrTV4J60gy6k3zgDn8pruStpfNHQJpEqdGukaivodI+3Sf1e5Qt/xIHEZkDi5pycOYy4lfSSz3KgvFrprpa6uGsoqqMSwTxO1mPadxBWWyG1jovKFS5R8vbFwa6w4Kp5e241bQe9kQ/wDKcu5dSXi5UFntdTdLpVw0dFSxmWeeV2qxjRvJK+Z+mnGzseaTb1iZuuKapn1KRr9hbAwBkeY4EtAJHaSiqOXkiztgjpm5qYaL7Ya27G5zN94pD1c9zpOHq3+pQqz0dXdbjFQ0jNaWQ5Z8GjiTyCu6z0MFotcNBTehGNrjve7i496dJ4WDJZwsC65V8NHSTVU7tWOJhe48gqHutylr7hUVsp68zy8jsz4eCmGla/Zhtkp37Tk+oI9bW/b6lXaIomuvCybnTZrU55K8rCsNSA7U/wCEDl518z7yYE+4YOpBVyHcMvYCofYkgqEIWI0ghCEAXFVP919FFuq29Z9Mxgd25szjP4qDlSbQ1XRVtquWHKk5tc0ysHHVcNV2Xccj4qP11PJR1k1LMMnxPLHeBWyiWY4MKW2TiaVgoKwnlwW2kqJqSqiqqeR0U0Tg9j272kbitSwoDCxydE4CxLT4ms7Z2lrKuLJtTED6Lu0cjw9XBa9IGEKfFFuGpqw3CEHoJiNh+S75J9m/tBovDl6rrBdY7hQSasjNjmn0ZG8WuHYV1ngu/wBqxBZoqu1yMy1RrxZjWYew/islkXW8o8lrdDborvWpeI/j9v4OQrnQVdsrpaGugfBUROyexw/9zHNSXAukvHeB43Q4XxNW2+BztYwDVkh1u3o3hzc+eS6dxLh6hvtNqVDejnaPe52jrN/EclVWIcPXKyTFtVEXQk5MmZtY78DyKvG5SXKO5oepw1Kw+Jf/AHYrfHWkvHeOI2xYoxNW3CBrtYQHVjh1u3o2Brc+eSiKuBYJV9/7HR3FPrCuBCN4bin1glXCsFG8NxT6l2BdJmPMDxuhwtiatt8DnaxgGrJDrdvRvDm588lMkKHLPgncQzHekzHmOI2w4pxNW3CBrtYQHVjh1u3o2Brc+eSi9BR1NfVx0lJC6aaQ5Na3/wB3c1dllstddZMqePViB60rtjR+J5BWDZLPR2iAthGvK4deVw6zvwHJVdiXCKStwVrg3DkGHqE6xbJWygdNKOHyW8vrWMY3+GyW50pIdUyZtgjPE9p5BWDi+8W20WmWouT2amqdVhIzceS5hvVzq7vcH1lW/We7Y1o3MHADkoj7uWUhHc8sS1E0tRPJPO8vlkcXPcd5JWtCwmjwQhCABPFG7zbDdZOdhc1+XqyHtTOnHE7xR2CCiB68hAcO7afbkqTeETFZZEUIQshoBCEIAdMK3aSx36luLMy2N2UjR+kw7HD1e3JWPpGt8cvQX2jyfBO1okc3cdnVd4jZ4BVIrM0XXqC4WybCtzdrAtPm5cd7d5aOY3j8k2qe1me6P9aI2hLr5bZrVcZKSbbltY7LY9vApAtuSi+wWCUErCCQS2yXWvs1wZX22ofBOziNzh2EcRySJCh8kSippxkspl/YF0i2y/NjpK4soLidmo52Ucp+STx5Hb3qaVEUM8L4J4mSxPGTmPaHNcOwgrk1TLCeke/WMMp53i40bdgind1mj5L948cws8qfMTzOq/4+lLfpn/b/AEye4n0VWevc+e0zOtsx29HlrxE929vgcuSru9aO8VWwuIoPPYx+nSu18/m+l7Fa1g0kYZuwayWqNvnO+Oq6oz5O9H1kKVxyxzRiSKRsjHDMOacwfFQpzjwyadXrNN7LOf5/2crVNNUUshjqYJYXje2RhafUVpJXVVQyKVhZLGyRvY4ZhNc9isUpzksttee11Kw/YrK39jpw6lu7xOaVsp6eeok6Onglmef0Y2Fx9QXRrbHY4jnFZrcw9raVg+xKA2OJmpFGyNvY0ZBT6o9a3PaJRdqwJiS4EE0XmkZ/TqTqZfN9L2Ka2LRza6ItluUrq+UbdTLVjHhvPifBTmomZEwvke1jBvc45AKJ3zHVht4c2Op89mH6FP1h/Fu+tRukyVZZZ2JE1sUMTYoY2RxsGTWtGQA5BRHFuNKG1B9NSFtXWDZqtPUYflH7B7FCMR42u92DoY3Cipjs6OI9Zw5u3nwyUYUqH2OhVjuKbnX1dyrH1dbM6WV3E7gOwDgElQsK45IEIQoAEFBWAC4gAEk7ggBbZafp61pI6kfWd9ibcV1nnV0cxpzjhGoO/j7fqT3WTNstmORHnMuwd/5KGkknM7SkWy8DYLyCEISRgIQhAAtlNPLTVEdRBI6OWNwcxzd4I3Fa0IAt63VlHjqwar9SG6Uw6w7D2j5J9n1w2tpp6OpfTVEZjlYcnNKj1puNXa6+OtopTHNGdh4EcQRxCtClqrVji2AgtprnC3rN4t//AKb9X16arfDMsobHx2IShKrnb6q3VJp6uIsdwPBw7QeKSrQAIKCvKCQQhCgkEqt9zuNvfr0FdU0pzzPRSluffkkhQghpPhkrpNImLacBpuYnaOEsTHe3LP2pezSpiRoydBbn83RO+xwUEJWFXavoU9PV/wBUTqXSjiN4yEFuZzbE77XFNlZj7FFSCPdEQtPCKJrfbln7VGFhRtRKpguyFNdcK+vfr1tZUVJ/zZC7L1pMhCkZ2BYKCsIAEIQgAWCUEoAJIABJO4BQBhO9tpo6WA19YQxrRm0HhzRSUUVLEayvc1jW7Q08O/nyTDfbtJcZdRmbKdp6re3mUuc9paMcmi8V8lwrHTOzDBsY3sCRIQszeR/YEIQgAQhCABCEIAFuo6moo6llTSzPhmjObXtORC0oQBZFlxjbbzTNt+JIo45DsE2WTHHt+Qee7uXu74Tnjb09skFVCRmG5jWy5HcVWidrHiK7WcgUdSeizzMMnWYfDh4ZJsLWu4l1Y5iOE0UkMhjmjfG8b2uGRC8KQU2OLTcIxFerbqn47Wh7e/tHhmlLaXCFw61JcmQk7m9Lq+x+1PVqZTld0RZYKlZwpTSbYLoCOHUDvqKwcH/8x+h/mVtyIyiKrBKlRwj/AMx+h/mXg4Sy+EPof5kbkTuRF0FSc4Ty+EPof5l4OFf+P+h/mRuRGSNIUkOFsv1/6H815OGMv176L81GUTkjqwSpCcNZfrv0X5rycN5frv0X5oygI+hPxw7/AMZ9F+a8mxRM2yVuQ/ZA+1GQGNHIb08PprJTbZq5riOHSD6htSeS+2ijzFFTmV3AhuXtO1Vc0iVFs10lsqp8iW9Ez4z9nsSmoqbbZmkZ9NU5bhtP5JkuGIK+qBax4gjPCPf600HacylSt+hih9iy6XKpuEutM7Jg9Fg3BI0ISW8jAQhCABCEIAEIQgAQhCABCEIAEIQgAQhCABCEIAEIQgAQhCABCEIAEIQgAQhCABCEIAEIQgAQhCABCEIAEIQgD//Z" width="46" height="46" alt="WiseRank" style="display:block;width:46px;height:46px;border-radius:14px;" />
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
                  <a class="wr-link-light" href=${confirmation_link} target="_blank" rel="noreferrer" style="font-family: Segoe UI, Arial, sans-serif; color: inherit; text-decoration: none; color: #d1fae5 !important; font-weight: 700; text-decoration: underline;">${confirmation_link}</a>
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
    }
    catch (error) {
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
export const confirm = async (req, res) => {
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
                subject: "Onboarding, WiseRank",
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
      <img src="data:image/png;base64,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" width="46" height="46" alt="WiseRank" style="display:block;width:46px;height:46px;border-radius:14px;" />
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
    catch (error) {
        controlDebug("Error in post request confirm controller");
        console.error(error);
        res.status(500).json({ server_error: "Internal server error" });
    }
};
export const confirm_get = async (req, res) => {
    try {
        let conf_id;
        if (req.params) {
            conf_id = req.params.confirmation_link_id;
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
        });
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
                    subject: "Onboarding, WiseRank",
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
      
      <img src="data:image/png;base64,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" width="46" height="46" alt="WiseRank" style="display:block;width:46px;height:46px;border-radius:14px;" />
      
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
    }
    catch (error) {
        controlDebug("Error in get reuest confirm  controller");
        console.error(error);
        res.status(500).json({ server_error: "Internal server error" });
    }
};
export const logIn = async (req, res) => {
    try {
        const { reqBody } = req.body;
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
    }
    catch (error) {
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
export const forgot = async (req, res) => {
    try {
        const { user_email } = req.body;
        let reqBody = { user_email };
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
        let enc_reset_pass_token = await bcrypt.hash(reset_pass_token, 5);
        user.pass_token = enc_reset_pass_token;
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
            subject: "Password Recovery Code",
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
      
                      <img src="data:image/png;base64,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" width="46" height="46" alt="WiseRank" style="display:block;width:46px;height:46px;border-radius:14px;" />
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
                    ${reset_pass_token}
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
    }
    catch (error) {
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
export const verifyCode = async (req, res) => {
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
            const reset_reference_token = jwt.sign(user_cookie_details, ACCESS_SECRET, {
                algorithm: "HS256",
            });
            res.cookie("reset_reference_token", reset_reference_token, {
                httpOnly: true,
                maxAge: 10 * 60 * 1000,
            });
            res.status(200).json({ success: "Token verification successful" });
        }
    }
    catch (error) {
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
export const reset = async (req, res) => {
    try {
        const reset_info = req.cookies.reset_reference_token;
        const { reqBody } = req.body;
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
    }
    catch (error) {
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
//# sourceMappingURL=authControl.js.map