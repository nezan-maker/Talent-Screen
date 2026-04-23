import nodemailer from "nodemailer";
import type { Request, Response } from "express";
import Applicant from "../models/Applicant.js";

const emailingController = async (req: Request, res: Response) => {
    const {job_title} = a
    const shortlisted_applicants = await Applicant.find({sho})

};
