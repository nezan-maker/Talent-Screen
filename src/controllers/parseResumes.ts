import * as pdfLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Request, Response } from "express";
import Resume from "../models/Resume.js";
import Applicant from "../models/Applicant.js";
import type { ExtendedRequest } from "./resumeUpload.js";
import { controlDebug } from "./authControl.js";
import axios from "axios";
interface HeaderText {
  [key: string]: string;
}
const resumeParse = async (req: ExtendedRequest, res: Response) => {
  try {
    const resume_array = req.resume_array;
    for (let i = 0; i < resume_array.length; i++) {
      const resume_id = resume_array[i];
      const resume = await Resume.findOne({ resume_id });
      if (!resume)
        return res.status(500).json({ server_error: "Internal server error" });

      let applicant_id = resume.applicant_id;
      const applicant = await Applicant.findOne({ _id: applicant_id });
      if (!applicant)
        return res.status(500).json({ server_error: "Internal server error" });

      const url = resume.resume_pdf_url;
      if (!url)
        return res.status(500).json({ server_error: "Internal server error" });

      const response = await axios.get(url, { responseType: "arraybuffer" });
      const pdfData = new Uint8Array(response.data);
      const loadingTask = pdfLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;

      const pages = pdf.numPages;
      const fontSizes: number[] = [];
      const selected_headers: string[] = [];

      for (let page_n = 1; page_n <= pages; page_n++) {
        const page = await pdf.getPage(page_n);
        const text: any = await page.getTextContent();

        text.items.forEach((item: any) => {
          let isUpper: boolean = item.str === item.str.toUpperCase();
          if (isUpper) {
            fontSizes.push(item.height);
            selected_headers.push(item.str);
          }
        });

        let headers: string[] = [
          "SKILLS",
          "EDUCATION",
          "EXPERIENCE",
          "ADDITIONAL INFORMATION",
        ];
        if (headers) {
          let database_headers = headers.map(
            (header) => header.toLowerCase() || "",
          );
          if (database_headers) {
            let add_info = database_headers?.[3] ?? "";
            let temp_info_header_array = add_info.split(" ");
            database_headers[3] =
              temp_info_header_array[0] + "_" + temp_info_header_array[1];
          }
        }

        let header_text;
        let header_array: HeaderText[] = [];
        let skill_obj: HeaderText = {};
        let educ_obj: HeaderText = {};
        let exp_obj: HeaderText = {};
        let add_obj: HeaderText = {};

        for (let head = 0; head < selected_headers.length; head++) {
          const current_header = selected_headers[head] || "";
          let pattern;
          let real_head = 0;
          if (headers.includes(current_header)) {
            pattern = new RegExp(
              `${selected_headers[head]}(*?)${selected_headers[head + 1]}`,
            );

            const strings = text.items.map((item: any) => item.str);
            const fullText = strings.join(" ").trim();
            header_text = fullText.match(pattern);
            const headerObject: { [key: string]: string } = {};
            headerObject[real_head] = header_text;
            header_array.push(headerObject);
            real_head++;
          } else {
            continue;
          }
          if (
            header_array[0] &&
            header_array[1] &&
            header_array[2] &&
            header_array[3]
          ) {
            skill_obj = header_array[0];
            educ_obj = header_array[1];
            exp_obj = header_array[2];
            add_obj = header_array[3];
          }

          const updateApplic = await Applicant.findOneAndUpdate(
            {
              _id: applicant_id,
            },
            {
              skills: skill_obj.skills,
              education: educ_obj.education,
              experience: exp_obj.education,
              additional_info: add_obj.additional_information,
            },
          );
        }
      }
    }
  } catch (error) {
    controlDebug(error);
    res.status(500).json({ server_error: "Internal server error" });
  }
};
export default resumeParse;
