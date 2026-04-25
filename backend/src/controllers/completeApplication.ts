import type { Request, Response } from "express";
import type { Short_AppL } from "./shortList.js";
import Applicant from "../models/Applicant.js";
import { userInfo } from "node:os";
const completeApplication = async (req: Request, res: Response) => {
  const { selected_applicants_str }: { selected_applicants_str: string } =
    req.body;
  let selected_applicants: Short_AppL[] = JSON.parse(selected_applicants_str);
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
    await applicant.save();
  }
};
export default completeApplication;
