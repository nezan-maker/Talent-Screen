import express from "express";
import {
  completeOnboarding,
  confirm,
  confirm_get,
  googleCallback,
  googleStart,
  forgot,
  logIn,
  logout,
  me,
  reset,
  signUp,
  verifyCode,
} from "../controllers/authCompat.js";
import { middleAuth } from "../middlewares/authMiddleware.js";

const authRoutes = () => {
  const router = express.Router();
  router.post("/signup", signUp);
  router.post("/confirm", confirm);
  router.post("/login", logIn);
  router.get("/google/start", googleStart);
  router.get("/google/callback", googleCallback);
  router.post("/forgot", forgot);
  router.post("/verify", verifyCode);
  router.post("/reset", reset);
  router.post("/logout", logout);
  router.post("/onboarding", middleAuth, completeOnboarding);
  router.get("/me", middleAuth, me);
  router.get("/confirm_link/:confirmation_link_id", confirm_get);
  return router;
};

export default authRoutes;
