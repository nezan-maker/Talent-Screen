import Applicant from "../models/Applicant.js";
import Job from "../models/Job.js";
import debug from "debug";
const controlDebug = debug("app:controller");
const dashBoardControl = async (_: any, res: any) => {
  try {
    const applicants = await Applicant.find(
      {},
      { applicant_name: 1, job_title: 1, applicant_state: 1 },
    );
    if (!applicants) {
      return res.status(500).json({ error: "Internal server error" });
    }
    const jobs = await Job.find();
    if (!jobs) {
      return res.status(500).json({ error: "Internal server error" });
    }
    const information_array = [applicants, jobs];
    const response = JSON.stringify(information_array);
    res.status(200).json({ success: response });
  } catch (error) {
    controlDebug(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
export default dashBoardControl;
