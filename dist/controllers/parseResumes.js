import * as pdfLib from "pdfjs-dist/legacy/build/pdf.mjs";
import Resume from "../models/Resume.js";
import { controlDebug } from "./authControl.js";
import axios from "axios";
const resumeParser = async (req, res) => {
    try {
        const resume_id = req.resume_id;
        if (!resume_id) {
            return res.status(500).json({ server_error: "Internal server error" });
        }
        const resume = await Resume.findOne({ _id: resume_id });
        let url = resume?.resume_pdf_url || "";
        const response = await axios.get(url, { responseType: "arraybuffer" });
        const pdfData = new Uint8Array(response.data);
        const loadingTask = pdfLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        let number_pages = pdf.numPages;
        for (let round = 1; round <= number_pages; round++) {
            const page = await pdf.getPage(round);
            const text = await page.getTextContent();
            const fontSizes = [];
            const selected = [];
            text.items.forEach((item) => {
                let size = item.height;
                let text = item.str;
                if (!fontSizes.includes(size)) {
                    fontSizes.push(size);
                    const isUpper = text === text.toUpperCase();
                    if (isUpper) {
                        selected.push(text);
                    }
                }
            });
            const headers = [
                "SKILLS",
                "EDUCATION",
                "EXPERIENCE",
                "ADDITIONAL INFORMATION",
            ];
            for (let i = 0; i < selected.length; i++) {
                if (headers.includes(selected[i])) {
                    const pattern = new RegExp(`${selected[i]}(*?)${selected[i + 1]}`, "s");
                    const strings = text.items.map((item) => item.str);
                    const fullText = strings.join("").trim();
                    const current_details = fullText.match(pattern);
                }
            }
        }
    }
    catch (error) {
        controlDebug(error);
        return res.status(500).json({ server_error: "Internal server error" });
    }
};
export default resumeParser;
//# sourceMappingURL=parseResumes.js.map