import re

with open("backend/src/controllers/applicantControl.ts", "r") as f:
    content = f.read()

# 1. Add GoogleGenerativeAI import
if "@google/generative-ai" not in content:
    content = content.replace(
        'import { string } from "zod";',
        'import { string } from "zod";\nimport { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";'
    )

# 2. Update interface Applicant_
content = re.sub(
    r'interface Applicant_ \{(.*?)\}',
    r'interface Applicant_ {\n  first_name: string;\n  last_name: string;\n  email: string;\n  job_title: string;\n}',
    content,
    flags=re.DOTALL,
    count=1
)

# 3. Update the non-file fallback
non_file_original = """        let applicant_json: Applicant_ = {
          applicant_name: current_json.applicant_name,
          job_title: current_json.job_title,
          applicant_email: current_json.applicant_email,
        };
        const oldApplicant = await Applicant.findOne({
          applicant_name: current_json.applicant_name,
        });
        if (oldApplicant)
          return res.status(401).json({
            data_error: `User named ${current_json.applicant_name} is already registered for this job`,
          });"""

non_file_replacement = """        let applicant_json: Applicant_ = {
          first_name: current_json.first_name || current_json.applicant_name?.split(" ")[0] || "",
          last_name: current_json.last_name || current_json.applicant_name?.split(" ").slice(1).join(" ") || "",
          email: current_json.email || current_json.applicant_email || "",
          job_title: current_json.job_title || "",
        };
        const oldApplicant = await Applicant.findOne({
          email: applicant_json.email,
        });
        if (oldApplicant)
          return res.status(401).json({
            data_error: `User with email ${applicant_json.email} is already registered for this job`,
          });"""

content = content.replace(non_file_original, non_file_replacement)

# 4. Update the spreadsheet extraction
spreadsheet_original = """        let applicant_json: Applicant_ = {
          applicant_name: current_json.applicant_name,
          applicant_email: current_json.applicant_email,
          job_title: current_json.job_title,
        };
        const oldApplicant = await Applicant.findOne({
          applicant_name: current_json.applicant_name,
        });
        if (oldApplicant)
          return res.status(401).json({
            data_error: `User named ${current_json.applicant_name} is already registered for this job`,
          });"""

spreadsheet_replacement = """        let applicant_json: Applicant_ = {
          first_name: current_json.first_name || current_json["first name"] || current_json.applicant_name?.split(" ")[0] || "",
          last_name: current_json.last_name || current_json["last name"] || current_json.applicant_name?.split(" ").slice(1).join(" ") || "",
          email: current_json.email || current_json.applicant_email || current_json["email address"] || "",
          job_title: current_json.job_title || current_json["job title"] || "",
        };
        const oldApplicant = await Applicant.findOne({
          email: applicant_json.email,
        });
        if (oldApplicant)
          return res.status(401).json({
            data_error: `User with email ${applicant_json.email} is already registered for this job`,
          });"""

content = content.replace(spreadsheet_original, spreadsheet_replacement)

# 5. Fix zip file matching logic
zip_original = """          if (applicant_file_name) {
            applicant = await Applicant.findOne({
              applicant_name: applicant_file_name,
            });
          }"""

zip_replacement = """          if (applicant_file_name) {
            applicant = await Applicant.findOne({ email: applicant_file_name });
            if (!applicant) {
               const parts = applicant_file_name.split(" ");
               if (parts.length >= 2) {
                 applicant = await Applicant.findOne({
                   first_name: parts[0],
                   last_name: parts.slice(1).join(" "),
                 });
               }
            }
          }"""

content = content.replace(zip_original, zip_replacement)

# 6. Replace the entire PDF parsing block (lines 333 to 422)
# We can find it by looking for "const pages = pdf.numPages;" and replacing until "res.status(201).json"
pdf_parsing_regex = r'const pages = pdf\.numPages;(.*?)\s*res\.status\(201\)\.json\(\{'
pdf_parsing_replacement = """const pages = pdf.numPages;
          let fullResumeText = "";

          for (let page_n = 1; page_n <= pages; page_n++) {
            const page = await pdf.getPage(page_n);
            const text: any = await page.getTextContent();
            const pageText = text.items.map((item: any) => item.str).join(" ");
            fullResumeText += pageText + "\\n";
          }
          
          try {
            const genAI = new GoogleGenerativeAI(env?.GOOGLE_API_KEY || "");
            const model = genAI.getGenerativeModel({
              model: env?.GOOGLE_AI_MODEL || "gemini-1.5-flash",
              generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: SchemaType.OBJECT,
                  properties: {
                    skills: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { name: { type: SchemaType.STRING }, level: { type: SchemaType.STRING }, years_of_experience: { type: SchemaType.NUMBER } } } },
                    language: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { name: { type: SchemaType.STRING }, proficiency: { type: SchemaType.STRING } } } },
                    experience: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { company: { type: SchemaType.STRING }, role: { type: SchemaType.STRING }, start_date: { type: SchemaType.STRING }, end_date: { type: SchemaType.STRING }, technologies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }, is_current: { type: SchemaType.BOOLEAN } } } },
                    education: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { institution: { type: SchemaType.STRING }, degree: { type: SchemaType.STRING }, field_of_study: { type: SchemaType.STRING }, start_year: { type: SchemaType.NUMBER }, end_year: { type: SchemaType.NUMBER } } } },
                    certifications: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { name: { type: SchemaType.STRING }, issuer: { type: SchemaType.STRING }, issuer_date: { type: SchemaType.STRING } } } },
                    projects: { type: SchemaType.ARRAY, items: { type: SchemaType.OBJECT, properties: { name: { type: SchemaType.STRING }, description: { type: SchemaType.STRING }, technologies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }, role: { type: SchemaType.STRING }, link: { type: SchemaType.STRING }, start_date: { type: SchemaType.STRING }, end_date: { type: SchemaType.STRING } } } },
                    availability: { type: SchemaType.OBJECT, properties: { status: { type: SchemaType.STRING }, type: { type: SchemaType.STRING }, start_date: { type: SchemaType.STRING } } },
                    social_links: { type: SchemaType.OBJECT, properties: { linked_in: { type: SchemaType.STRING }, github: { type: SchemaType.STRING }, portfolio: { type: SchemaType.STRING } } }
                  }
                }
              }
            });
            const prompt = `Extract the structured information from the following resume text. Do your best to map the text to the schema fields. Text:\\n${fullResumeText}`;
            const aiResult = await model.generateContent(prompt);
            const aiResponse = aiResult.response.text();
            const parsedData = JSON.parse(aiResponse);
            
            const updateApplic = await Applicant.findOneAndUpdate(
              { _id: applicant_id },
              {
                $set: {
                  skills: parsedData.skills,
                  language: parsedData.language,
                  experience: parsedData.experience,
                  education: parsedData.education,
                  certifications: parsedData.certifications,
                  projects: parsedData.projects,
                  availability: parsedData.availability,
                  social_links: parsedData.social_links
                }
              }
            );
            if (updateApplic) {
              await updateApplic.save();
            }
          } catch(err) {
            controlDebug("Error parsing PDF with AI: " + err);
          }
        }
        res.status(201).json({"""

content = re.sub(pdf_parsing_regex, pdf_parsing_replacement, content, flags=re.DOTALL)

with open("backend/src/controllers/applicantControl.ts", "w") as f:
    f.write(content)

