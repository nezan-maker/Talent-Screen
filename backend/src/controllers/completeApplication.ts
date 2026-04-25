import type { Request, Response } from "express";
import type { Short_AppL } from "./shortList.js";
import Applicant from "../models/Applicant.js";
import nodemailer from "nodemailer";
import env from "../config/env.js";
const completeApplication = async (req: Request, res: Response) => {
  const { selected_applicants_str }: { selected_applicants_str: string } =
    req.body;
  let selected_applicants: Short_AppL[] = JSON.parse(selected_applicants_str);
  if (!env.USER_EMAIL || !env.USER_PASS) {
    throw new Error("Could not load environment variables");
  }
  for (const selected_applicant of selected_applicants) {
    let first_name = selected_applicant.first_name;
    let last_name = selected_applicant.last_name;
    let email = selected_applicant.email;
    const applicant = await Applicant.findOne({
      first_name,
      last_name,
      email,
    });
    if (!applicant) {
      return res.status(404).json({ data_error: "Applicant not registe" });
    }
    applicant.applicant_state = "Selected";
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
        
    })
    await applicant.save();
  }
  const rejected_applicants = await Applicant.deleteMany({
    applicant_state: "Rejected",
  });
};
export default completeApplication;
