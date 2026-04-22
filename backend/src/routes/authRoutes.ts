import express from "express";
import {
  signUp,
  logIn,
  forgot,
  verifyCode,
  confirm,
  reset,
} from "../controllers/authControl.js";
const authRoutes = () => {
  const router = express.Router();
  router.post("/signup", signUp);
  router.post("/confirm", confirm);
  router.post("/login", logIn);
  router.post("/forgot", forgot);
  router.post("/verify", verifyCode);
  router.post("/reset", reset);
  return router;
};
export default authRoutes;
