import askGemini from "../services/aiservice.js";
import Applicant from "../models/Applicant.js";
import Result from "../models/ScreenResult.js";
import Job from "../models/Job.js";
const exampleResult = {
    job_title: "Full Stack Developer",
    result_verdict: "Top candidates shortlisted based on overall performance and relevance",
    applicants_details: [
        {
            applicant_name: "Alice Uwimana",
            applicant_marks: 87.5,
            applicant_specification_relevance: {
                skills_relevance: 90,
                education_relevance: 85,
            },
            applicant_result_description: "Strong in both frontend and backend technologies. Demonstrated solid understanding of system design and APIs.",
        },
        {
            applicant_name: "Eric Ndayisaba",
            applicant_marks: 78.2,
            applicant_specification_relevance: {
                skills_relevance: 80,
                education_relevance: 75,
            },
            applicant_result_description: "Good technical skills with practical experience. Needs improvement in advanced backend concepts.",
        },
        {
            applicant_name: "Claudine Mukamana",
            applicant_marks: 91.0,
            applicant_specification_relevance: {
                skills_relevance: 95,
                education_relevance: 88,
            },
            applicant_result_description: "Excellent candidate with strong problem-solving skills and deep knowledge of modern frameworks.",
        },
    ],
};
const askGeminiCont = async (req, res) => {
    const { job_title } = req.body;
    const job = await Job.findOne({
        job_title: job_title,
        job_state: "Uninitialised",
    });
    if (!job)
        return res.status(400).json({
            data_error: `Could not find an active job that matches what is specified`,
        });
    const applicants = Applicant.find({ job_title: job_title }, {
        _id: 1,
        applicant_name: 1,
        job_title: 1,
        skills: 1,
        education_certifates: 1,
        additional_info: 1,
        experience_in_years: 1,
    });
    if (!applicants)
        return res
            .status(404)
            .json({
            data_error: `No active applicants for the job ${job_title} yet`,
        });
    const ai_guidelines = "We need you to review these information about these candidates on the job sent with this stringified json we need that the results must be in the same structure also sent with the request.Remember that is a sample make sure to elaborate efficiently not too much but not too little about the details of the verdict and various reasons for your decision and send back a JSON stringified string of the results.";
    const prompt_object_array = [];
    prompt_object_array.push(exampleResult, applicants, ai_guidelines, job);
    const prompt = JSON.stringify(prompt_object_array);
    const result = askGemini(prompt, 5);
    const screen_result = new Result(result);
    screen_result.save();
    res.status(200).json({ success: screen_result });
};
export default askGeminiCont;
//# sourceMappingURL=askGeminiControl.js.map