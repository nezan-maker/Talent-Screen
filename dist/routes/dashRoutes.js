import express from "express";
import dashBoardControl from "../controllers/dashboardControl.js";
import applicantControl from "../controllers/applicantControl.js";
import askGeminiCont from "../controllers/askGeminiControl.js";
import completeJob from "../controllers/completeJob.js";
const dashRoutes = () => {
    const router = express.Router();
    router.get("/dashboard", dashBoardControl);
    router.post("/register-candidate", applicantControl);
    router.post("/ask", askGeminiCont);
    router.post("/complete-job", completeJob);
    return router;
};
export default dashRoutes;
//# sourceMappingURL=dashRoutes.js.map