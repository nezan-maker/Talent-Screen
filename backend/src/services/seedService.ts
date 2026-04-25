import bcrypt from "bcrypt";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import Resume from "../models/Resume.js";
import { ScreeningResultModel } from "../models/ScreenResult.js";
import ScreeningRunModel from "../models/ScreeningRun.js";
import User from "../models/User.js";
import env from "../config/env.js";
import { seedApplicants, seedJobs, seedUser } from "../data/seedData.js";

export async function ensureSeedData() {
  if (env.AUTO_SEED === "false") {
    return;
  }

  const [users, jobs, applicants] = await Promise.all([
    User.countDocuments(),
    Job.countDocuments(),
    Applicant.countDocuments(),
  ]);

  if (users > 0 || jobs > 0 || applicants > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash("Talvo@123", 10);

  await User.create({
    ...seedUser,
    user_pass: passwordHash,
    pass_token: null,
    sign_otp_token: null,
    refresh_token: null,
    confirmation_link_id: "",
  });

  await Job.insertMany(seedJobs);
  await Applicant.insertMany(
    seedApplicants.map((applicant) => ({
      _id: applicant.id,
      first_name: applicant.first_name,
      last_name: applicant.last_name,
      applicant_name: applicant.applicant_name,
      email: applicant.email,
      applicant_email: applicant.email,
      headline: applicant.headline,
      bio: applicant.bio,
      location: applicant.location,
      job_id: applicant.job_id ?? null,
      job_title: applicant.job_title,
      skills: applicant.skills,
      languages: applicant.languages,
      experience: applicant.experience,
      education: applicant.education,
      certifications: applicant.certifications,
      projects: applicant.projects,
      availability: applicant.availability,
      social_links: applicant.social_links,
      additional_info: applicant.additional_info,
      source: applicant.source,
      shortlisted: applicant.shortlisted,
      applicant_state: applicant.applicant_state,
    })),
  );

  await Promise.all([
    Resume.deleteMany({}),
    ScreeningRunModel.deleteMany({}),
    ScreeningResultModel.deleteMany({}),
  ]);

  console.log(
    "Seeded Talvo demo data: recruiter@talvo.ai / Talvo@123, 3 jobs, 5 applicants.",
  );
}
