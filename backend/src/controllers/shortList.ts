import type { NextFunction, Request, Response } from "express";
import { controlDebug } from "./authControl.js";
import Applicant from "../models/Applicant.js";
import z from "zod";
import { nextTick } from "node:process";
export interface Short_AppL {
  applicant_name: string;
  shortlisted: boolean;
}
const shortList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { shortList_applicants }: { shortList_applicants: string } = req.body;
    let reqBody: Short_AppL[] = JSON.parse(shortList_applicants);
    const shortListed_arr: Short_AppL[] = [];
    const rejected_arr: Short_AppL[] = [];
    for (const json of reqBody) {
      const applicant = await Applicant.findOne({
        applicant_name: json.applicant_name,
      });
      if (!applicant) {
        return res.status(404).json({ data_error: "Applicant not found" });
      }
      if (json.shortlisted) {
        applicant.applicant_state = "Shortlisted";
        shortListed_arr.push(json);
      } else {
        applicant.applicant_state = "Rejected";
        rejected_arr.push(json);
      }
    }
    req.shortlisted = shortListed_arr;
    req.rejected = rejected_arr;
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ input_error: "Input requirements not fulfilled" });
    }
    controlDebug("Error in controller for shortlisting");
    console.error(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export default shortList;
