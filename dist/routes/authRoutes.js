import express from "express";
import { signUp, logIn, forgot, verifyCode, confirm, } from "../controllers/authControl.js";
const authRoutes = () => {
    const router = express.Router();
    router.post("/signup", signUp, confirm);
    router.post("/confirm", confirm);
    router.post("/login", logIn);
    router.post("/forgot", forgot);
    router.post("/verify", verifyCode);
    return router;
};
export default authRoutes;
//# sourceMappingURL=authRoutes.js.map