import express from "express";
import multer from "multer";
import applicantControl from "../controllers/applicantControl.js";
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        "application/vnd.openxmlformats-officedocument.spreadsheet.sheet",
        "application/zip",
    ];
    if ((file.mimetype === allowedMimes[0] &&
        file.fieldname === "applicant_spreadsheet") ||
        (file.mimetype === allowedMimes[1] && file.fieldname === "resume_pdf_zip")) {
        cb(null, true);
    }
    else {
        cb(new Error("File type not supported only ZIP and PDF formats allowed respectively"));
    }
};
const upload = multer({ storage: storage, fileFilter });
let fields = upload.fields([
    { name: "applicants_spreadsheet", maxCount: 1 },
    { name: "resume_pdf_zip", maxCount: 1 },
]);
const resumeRoutes = () => {
    const router = express.Router();
    router.post("/resume", fields, applicantControl);
    return router;
};
export default resumeRoutes;
//# sourceMappingURL=resumeRoutes.js.map