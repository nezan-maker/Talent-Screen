import express from "express";
import { signUp, logIn, forgot, verifyCode, confirm, reset, confirm_get, } from "../controllers/authControl.js";
const authRoutes = () => {
    const router = express.Router();
    router.post("/signup", signUp);
    router.post("/confirm", confirm);
    router.post("/login", logIn);
    router.post("/forgot", forgot);
    router.post("/verify", verifyCode);
    router.post("/reset", reset);
    router.get("/confirm_link/:confirmation_link_id", confirm_get);
    return router;
};
export default authRoutes;
//# sourceMappingURL=authRoutes.js.map