import "dotenv/config";
import { z } from "zod";
import mongoose from "mongoose";
import { connectToMongo } from "./lib/mongo.js";
import Job from "./models/Job.js";
import Applicant from "./models/Applicant.js";
import ScreeningRun from "./models/ScreeningRun.js";
import ScreeningResult from "./models/ScreenResult.js";
import { buildEntityId } from "./utils/ids.js";
const envSchema = z.object({
    MONGODB_URI: z.string().min(1).optional(),
    MONGO_URI: z.string().min(1).optional(),
    SEED_RESET: z.string().optional()
}).refine(data => data.MONGODB_URI || data.MONGO_URI, {
    message: "Either MONGODB_URI or MONGO_URI is required"
});
const env = envSchema.parse(process.env);
const dbUri = env.MONGODB_URI || env.MONGO_URI;
function resumeTextFor(fullName, role, bullets) {
    return [
        `${fullName}`,
        `${role}`,
        "",
        "Summary:",
        `- ${bullets.join("\n- ")}`,
        "",
        "Experience:",
        "- 2022-2026: Built and shipped production features; collaborated with cross-functional teams.",
        "",
        "Skills:",
        `- ${bullets.join(", ")}`
    ].join("\n");
}
async function main() {
    await connectToMongo(dbUri);
    const reset = env.SEED_RESET?.toLowerCase() === "true";
    if (reset) {
        await Promise.all([
            ScreeningResult.deleteMany({}),
            ScreeningRun.deleteMany({}),
            Applicant.deleteMany({}),
            Job.deleteMany({})
        ]);
        console.log("Seed reset enabled: cleared existing collections.");
    }
    else {
        console.log("SEED_RESET is not true; seeding without clearing existing data.");
    }
    const jobs = [
        {
            _id: buildEntityId("job"),
            job_title: "Backend Engineer (Node.js/TypeScript)",
            job_department: "Engineering",
            job_location: "Kigali (Hybrid)",
            job_employment_type: "Full-time",
            job_experience_required: "2+ years",
            job_description: "Hackathon prototype backend; strong API + data ingestion skills preferred.",
            job_responsibilities: "Build REST APIs with Node.js and TypeScript. Design MongoDB schemas and data ingestion pipelines. Implement file uploads (CSV/XLSX/PDF) and parsing. Write clean, testable code and handle errors safely.",
            job_qualifications: "BSc in Computer Science (or equivalent experience)",
            job_ai_criteria: [
                { criteria_string: "Node.js", priority: "high" },
                { criteria_string: "TypeScript", priority: "high" },
                { criteria_string: "Express", priority: "high" },
                { criteria_string: "MongoDB", priority: "high" },
                { criteria_string: "REST APIs", priority: "high" },
                { criteria_string: "Multer", priority: "medium" },
                { criteria_string: "Zod", priority: "medium" },
            ],
            job_state: "Active",
        },
        {
            _id: buildEntityId("job"),
            job_title: "AI Software Engineer (Gemini / LLM)",
            job_department: "AI",
            job_location: "Remote",
            job_employment_type: "Contract",
            job_experience_required: "3+ years",
            job_description: "Focus on explainable scoring and recruiter-friendly reasoning.",
            job_responsibilities: "Integrate Gemini API for ranking and explainability. Design robust prompts and structured JSON outputs. Implement multi-candidate evaluation and scoring.",
            job_qualifications: "BSc/MSc in CS, AI, or equivalent experience",
            job_ai_criteria: [
                { criteria_string: "Gemini API", priority: "high" },
                { criteria_string: "Prompt engineering", priority: "high" },
                { criteria_string: "LLM evaluation", priority: "high" },
                { criteria_string: "TypeScript", priority: "high" },
            ],
            job_state: "Active",
        }
    ];
    const createdJobs = await Job.insertMany(jobs);
    const backendJob = createdJobs[0];
    const aiJob = createdJobs[1];
    const applicants = [
        {
            first_name: "Aline",
            last_name: "Mukamana",
            applicant_name: "Aline Mukamana",
            email: "aline.mukamana@example.com",
            applicant_email: "aline.mukamana@example.com",
            headline: "Backend Engineer - Node.js & TypeScript",
            location: "Kigali",
            job_id: backendJob._id,
            job_title: backendJob.job_title,
            skills: [
                { name: "Node.js", level: "Expert", yearsOfExperience: 4 },
                { name: "TypeScript", level: "Advanced", yearsOfExperience: 3 },
                { name: "Express", level: "Advanced", yearsOfExperience: 4 },
                { name: "MongoDB", level: "Advanced", yearsOfExperience: 4 },
                { name: "REST APIs", level: "Expert", yearsOfExperience: 4 },
                { name: "Zod", level: "Intermediate", yearsOfExperience: 2 }
            ],
            experience: [
                {
                    company: "Tech Solutions Rwanda",
                    role: "Backend Developer",
                    start_date: "2020-01",
                    end_date: "2024-01",
                    description: "Built scalable REST APIs and managed MongoDB databases.",
                    technologies: ["Node.js", "Express", "MongoDB"],
                    is_current: false
                }
            ],
            education: [
                {
                    institution: "University of Rwanda",
                    degree: "BSc",
                    field_of_study: "Computer Science",
                    start_year: 2016,
                    end_year: 2020
                }
            ],
            social_links: {
                github: "https://github.com/alinem",
                linkedin: "https://www.linkedin.com/in/alinem"
            },
            source: "manual",
            applicant_state: "In Review"
        },
        {
            first_name: "Jean Claude",
            last_name: "Habimana",
            applicant_name: "Jean Claude Habimana",
            email: "jean.habimana@example.com",
            applicant_email: "jean.habimana@example.com",
            headline: "Software Engineer",
            location: "Kigali",
            job_id: backendJob._id,
            job_title: backendJob.job_title,
            skills: [
                { name: "Node.js", level: "Advanced", yearsOfExperience: 3 },
                { name: "Express", level: "Advanced", yearsOfExperience: 3 },
                { name: "MongoDB", level: "Intermediate", yearsOfExperience: 3 },
                { name: "Docker", level: "Intermediate", yearsOfExperience: 2 },
                { name: "CI/CD", level: "Intermediate", yearsOfExperience: 2 }
            ],
            experience: [
                {
                    company: "Kigali Devs",
                    role: "Software Engineer",
                    start_date: "2021-06",
                    end_date: "2024-06",
                    description: "Containerized applications and set up CI/CD pipelines.",
                    technologies: ["Node.js", "Docker"],
                    is_current: false
                }
            ],
            education: [
                {
                    institution: "Kigali Independent University",
                    degree: "BSc",
                    field_of_study: "Software Engineering",
                    start_year: 2017,
                    end_year: 2021
                }
            ],
            social_links: {
                github: "https://github.com/jchabimana"
            },
            source: "manual",
            applicant_state: "In Review"
        },
        {
            first_name: "Grace",
            last_name: "Uwimana",
            applicant_name: "Grace Uwimana",
            email: "grace.uwimana@example.com",
            applicant_email: "grace.uwimana@example.com",
            headline: "Backend Engineer",
            location: "Musanze",
            job_id: backendJob._id,
            job_title: backendJob.job_title,
            skills: [
                { name: "TypeScript", level: "Intermediate", yearsOfExperience: 2 },
                { name: "Node.js", level: "Intermediate", yearsOfExperience: 2 },
                { name: "Mongoose", level: "Intermediate", yearsOfExperience: 2 },
                { name: "Express", level: "Intermediate", yearsOfExperience: 2 },
                { name: "AWS", level: "Beginner", yearsOfExperience: 1 }
            ],
            experience: [
                {
                    company: "Startup Musanze",
                    role: "Backend Engineer",
                    start_date: "2022-01",
                    end_date: "2024-01",
                    description: "Developed microservices and deployed to AWS.",
                    technologies: ["Node.js", "AWS", "TypeScript"],
                    is_current: false
                }
            ],
            education: [
                {
                    institution: "INES-Ruhengeri",
                    degree: "BSc",
                    field_of_study: "Information Technology",
                    start_year: 2018,
                    end_year: 2022
                }
            ],
            resume_text: resumeTextFor("Grace Uwimana", "Backend Engineer", [
                "Node.js APIs (Express) + TypeScript",
                "MongoDB schema design (Mongoose)",
                "Background jobs and file processing"
            ]),
            source: "upload",
            applicant_state: "In Review"
        },
        {
            first_name: "Patrick",
            last_name: "Niyonzima",
            applicant_name: "Patrick Niyonzima",
            email: "patrick.niyonzima@example.com",
            applicant_email: "patrick.niyonzima@example.com",
            headline: "Software Engineer",
            location: "Huye",
            job_id: backendJob._id,
            job_title: backendJob.job_title,
            skills: [
                { name: "Java", level: "Advanced", yearsOfExperience: 2 },
                { name: "Spring", level: "Advanced", yearsOfExperience: 2 },
                { name: "PostgreSQL", level: "Intermediate", yearsOfExperience: 2 }
            ],
            experience: [
                {
                    company: "Enterprise Solutions",
                    role: "Software Engineer",
                    start_date: "2022-05",
                    end_date: "2024-05",
                    description: "Built APIs in Java/Spring. Interested in Node.js backend systems.",
                    technologies: ["Java", "Spring"],
                    is_current: false
                }
            ],
            education: [
                {
                    institution: "University of Rwanda, CST",
                    degree: "BSc",
                    field_of_study: "Computer Engineering",
                    start_year: 2018,
                    end_year: 2022
                }
            ],
            resume_text: resumeTextFor("Patrick Niyonzima", "Software Engineer", [
                "Built APIs in Java/Spring",
                "Some exposure to Node.js basics",
                "Interested in backend systems"
            ]),
            source: "upload",
            applicant_state: "In Review"
        },
        {
            first_name: "Diane",
            last_name: "Nishimwe",
            applicant_name: "Diane Nishimwe",
            email: "diane.nishimwe@example.com",
            applicant_email: "diane.nishimwe@example.com",
            headline: "AI Engineer",
            location: "Remote",
            job_id: aiJob._id,
            job_title: aiJob.job_title,
            skills: [
                { name: "Gemini API", level: "Advanced", yearsOfExperience: 3 },
                { name: "Prompt engineering", level: "Expert", yearsOfExperience: 5 },
                { name: "TypeScript", level: "Intermediate", yearsOfExperience: 3 },
                { name: "Evaluation", level: "Advanced", yearsOfExperience: 4 },
                { name: "RAG", level: "Advanced", yearsOfExperience: 3 }
            ],
            experience: [
                {
                    company: "AI Innovation Lab",
                    role: "AI Engineer",
                    start_date: "2019-01",
                    end_date: "2024-01",
                    description: "Architected RAG systems and engineered complex prompts for various LLMs.",
                    technologies: ["Python", "Gemini API", "TypeScript"],
                    is_current: false
                }
            ],
            education: [
                {
                    institution: "Carnegie Mellon University Africa",
                    degree: "MSc",
                    field_of_study: "Artificial Intelligence",
                    start_year: 2017,
                    end_year: 2019
                }
            ],
            social_links: {
                github: "https://github.com/dianen"
            },
            source: "manual",
            applicant_state: "In Review"
        },
        {
            first_name: "Eric",
            last_name: "Tuyishime",
            applicant_name: "Eric Tuyishime",
            email: "eric.tuyishime@example.com",
            applicant_email: "eric.tuyishime@example.com",
            headline: "AI Engineer",
            location: "Remote",
            job_id: aiJob._id,
            job_title: aiJob.job_title,
            skills: [
                { name: "LLMs", level: "Advanced", yearsOfExperience: 3 },
                { name: "Prompt engineering", level: "Advanced", yearsOfExperience: 3 },
                { name: "Python", level: "Advanced", yearsOfExperience: 4 },
                { name: "TypeScript", level: "Intermediate", yearsOfExperience: 2 }
            ],
            experience: [
                {
                    company: "Tech Startup HR",
                    role: "AI Engineer",
                    start_date: "2021-03",
                    end_date: "2024-03",
                    description: "Built candidate ranking prototypes for HR using LLMs.",
                    technologies: ["Python", "LLMs"],
                    is_current: false
                }
            ],
            education: [
                {
                    institution: "University of Rwanda",
                    degree: "BSc",
                    field_of_study: "Computer Science",
                    start_year: 2017,
                    end_year: 2021
                }
            ],
            resume_text: resumeTextFor("Eric Tuyishime", "AI Engineer", [
                "Designed structured JSON outputs from LLMs",
                "Built candidate ranking prototypes for HR",
                "Implemented guardrails and evaluation"
            ]),
            source: "upload",
            applicant_state: "In Review"
        }
    ];
    const extraBackendNames = [
        ["Sandrine Nyirahabimana", "sandrine.ny@example.com", "Sandrine", "Nyirahabimana"],
        ["Samuel Nkurunziza", "samuel.nk@example.com", "Samuel", "Nkurunziza"],
        ["Esther Uwase", "esther.uwase@example.com", "Esther", "Uwase"],
        ["Kevin Ndayishimiye", "kevin.nd@example.com", "Kevin", "Ndayishimiye"],
        ["Alice Uwamahoro", "alice.uwm@example.com", "Alice", "Uwamahoro"],
        ["Ishimwe Patrick", "ishimwe.p@example.com", "Ishimwe", "Patrick"],
        ["Nadine Ingabire", "nadine.i@example.com", "Nadine", "Ingabire"],
        ["Brian Mugisha", "brian.m@example.com", "Brian", "Mugisha"],
        ["Chantal Uwingabire", "chantal.u@example.com", "Chantal", "Uwingabire"],
        ["Fabrice Niyigena", "fabrice.n@example.com", "Fabrice", "Niyigena"],
        ["Liliane Uwera", "liliane.uw@example.com", "Liliane", "Uwera"],
        ["Emmanuel Bizimana", "emma.b@example.com", "Emmanuel", "Bizimana"],
        ["Joyce Iradukunda", "joyce.i@example.com", "Joyce", "Iradukunda"],
        ["Theogene Nshimiyimana", "theogene.n@example.com", "Theogene", "Nshimiyimana"],
        ["Odette Murenzi", "odette.m@example.com", "Odette", "Murenzi"],
        ["Yves Niyibizi", "yves.n@example.com", "Yves", "Niyibizi"]
    ];
    for (const [name, email, firstName, lastName] of extraBackendNames) {
        const safeName = name || "";
        const yoe = 1 + (safeName.length % 4);
        applicants.push({
            first_name: firstName,
            last_name: lastName,
            applicant_name: safeName,
            email,
            applicant_email: email,
            headline: "Backend Developer",
            location: "Rwanda",
            job_id: backendJob._id,
            job_title: backendJob.job_title,
            skills: [
                { name: "Node.js", level: "Intermediate", yearsOfExperience: yoe },
                { name: "Express", level: "Intermediate", yearsOfExperience: yoe },
                { name: "MongoDB", level: "Intermediate", yearsOfExperience: yoe },
                { name: "REST APIs", level: "Intermediate", yearsOfExperience: yoe }
            ],
            experience: [
                {
                    company: "Software Agency",
                    role: "Backend Developer",
                    start_date: "2023-01",
                    end_date: "2024-01",
                    description: "Worked on small team projects. REST APIs with Express.",
                    technologies: ["Node.js", "Express", "MongoDB"],
                    is_current: false
                }
            ],
            education: [
                {
                    institution: "University",
                    degree: "BSc",
                    field_of_study: "Software Engineering",
                    start_year: 2019,
                    end_year: 2023
                }
            ],
            resume_text: resumeTextFor(safeName, "Backend Developer", [
                "REST APIs with Express",
                "MongoDB CRUD and aggregation basics",
                "Worked on small team projects"
            ]),
            source: "upload",
            applicant_state: "In Review"
        });
    }
    const createdApplicants = await Applicant.insertMany(applicants);
    console.log(`Seeded ${createdJobs.length} jobs and ${createdApplicants.length} applicants.`);
    console.log("Next: trigger screening with POST /ask using one of the jobIds.");
    console.log("Job IDs:", createdJobs.map((j) => ({ id: String(j._id), title: j.job_title })));
}
main()
    .then(async () => {
    await mongoose.disconnect();
    process.exit(0);
})
    .catch(async (err) => {
    console.error("Seed failed:", err);
    await mongoose.disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map