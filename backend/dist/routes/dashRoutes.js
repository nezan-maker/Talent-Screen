import express from "express";
import dashBoardControl from "../controllers/dashboardControl.js";
import applicantControl from "../controllers/applicantControl.js";
import askGeminiCont from "../controllers/shortList.js";
import completeJob from "../controllers/completeJob.js";
import multer from "multer";
import { middleAuth } from "../middlewares/authMiddleware.js";
import verdictControl from "../controllers/verdictControl.js";
import emailingController from "../controllers/shortListEmails.js";
const storage = multer.memoryStorage();
export let fieldnames = ["applicants_spreadsheet", "resume_pdf_zip"];
const fileFilter = (req, file, cb) => {
    const allowedMimes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip",
        "text/csv",
    ];
    if (((file.mimetype === allowedMimes[0] || file.mimetype === allowedMimes[2]) &&
        file.fieldname === fieldnames[0]) ||
        (file.mimetype === allowedMimes[1] && file.fieldname === fieldnames[1])) {
        cb(null, true);
    }
    else {
        cb(new Error("File type not supported only ZIP,XLSX and CSV file formats allowed respectively"));
    }
};
const upload = multer({ storage: storage, fileFilter });
let fields = upload.fields([
    { name: "applicants_spreadsheet", maxCount: 1 },
    { name: "resume_pdf_zip", maxCount: 1 },
]);
const dashRoutes = () => {
    const router = express.Router();
    router.get("/dashboard", middleAuth, dashBoardControl);
    router.post("/register-candidate", middleAuth, fields, applicantControl);
    router.post("/ask", middleAuth, askGeminiCont);
    router.post("/complete-job", middleAuth, completeJob);
    router.post("/review-result", middleAuth, verdictControl);
    router.post("/sendEmails", middleAuth, emailingController);
    return router;
};
export default dashRoutes;
//# sourceMappingURL=dashRoutes.js.map