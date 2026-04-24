import { controlDebug } from "./authControl.js";
import Applicant from "../models/Applicant.js";
import z from "zod";
import { nextTick } from "node:process";
const shortList = async (req, res, next) => {
    try {
        const { shortList_applicants } = req.body;
        let reqBody = JSON.parse(shortList_applicants);
        const shortListed_arr = [];
        const rejected_arr = [];
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
            }
            else {
                applicant.applicant_state = "Rejected";
                rejected_arr.push(json);
            }
        }
        req.shortlisted = shortListed_arr;
        req.rejected = rejected_arr;
        next();
    }
    catch (error) {
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
//# sourceMappingURL=shortList.js.map