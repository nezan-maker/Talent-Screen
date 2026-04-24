import Applicant from "../models/Applicant.js";
import { controlDebug } from "./authControl.js";
const verdictControl = async (req, res) => {
    try {
        const { verdict_string } = req.body;
        let verdict = JSON.parse(verdict_string);
        if (!verdict) {
            return res
                .status(400)
                .json({ data_error: "Please send a valid JSON string" });
        }
        for (let appL_index = 0; appL_index < verdict.length; appL_index++) {
            let current_json = verdict[appL_index];
            if (!current_json) {
                throw new Error("Selecting applicants failed");
            }
            const reviewed_applicant = await Applicant.findOne({
                applicant_name: current_json.applicant_name,
                job_title: current_json.job_title,
            });
            if (reviewed_applicant && current_json.shortlisted) {
                reviewed_applicant.set('shortlisted', true);
                await reviewed_applicant.save();
            }
        }
    }
    catch (error) {
        controlDebug("Error in verdict controller");
        console.error(error);
        res.status(500).json({ server_error: "Internal server error" });
    }
};
export default verdictControl;
//# sourceMappingURL=verdictControl.js.map