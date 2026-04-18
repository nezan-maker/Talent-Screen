import express from "express";
import { signUp, logIn, forgot, verifyCode, confirm } from "../controllers/authControl.js";
const authRoutes = () => {
    const router = express.Router();
    router.post("/login", signUp);
    router.post("/confirm", confirm);
    router.post("/login", logIn);
    router.post("/forgot", forgot);
    router.post("/verify", verifyCode);
};
export default authRoutes;
//# sourceMappingURL=authRoutes.js.map