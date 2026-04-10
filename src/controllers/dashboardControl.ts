import express from "express";
import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
const dashBoardControl = async (_: any, res: any) => {
  try {
    const applicants = await Applicant.find();
    if(!applicants) return 
    const jobs = await Job.find();
    const information_array = [applicants, jobs];
    const response = JSON.stringify(information_array);
    res.status(200).json(response);
  } catch (error) {}
};
export default dashBoardControl;
