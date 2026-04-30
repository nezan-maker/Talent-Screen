import express from "express";
import {
  completeOnboarding,
  confirm,
  confirm_get,
  csrfToken,
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
import { createRateLimit } from "../middlewares/rateLimit.js";
import { verifyCsrfToken } from "../middlewares/csrf.js";

const authWriteRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  keyPrefix: "auth-write",
  message: "Too many authentication attempts. Please wait and try again.",
});

const loginRateLimit = createRateLimit({
  windowMs: 60_000,
  maxRequests: 5,
  keyPrefix: "auth-login",
  message: "Too many login attempts. Please wait a minute and try again.",
});

const verificationRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
  keyPrefix: "auth-verify",
  message: "Too many verification attempts. Please wait and try again.",
});

const authRoutes = () => {
  const router = express.Router();
  router.get("/csrf", csrfToken);
  router.post("/signup", verifyCsrfToken, authWriteRateLimit, signUp);
  router.post("/confirm", verifyCsrfToken, verificationRateLimit, confirm);
  router.post("/login", verifyCsrfToken, loginRateLimit, logIn);
  router.get("/google/start", googleStart);
  router.get("/google/callback", googleCallback);
  router.post("/forgot", verifyCsrfToken, authWriteRateLimit, forgot);
  router.post("/verify", verifyCsrfToken, verificationRateLimit, verifyCode);
  router.post("/reset", verifyCsrfToken, verificationRateLimit, reset);
  router.post("/logout", verifyCsrfToken, logout);
  router.post("/onboarding", verifyCsrfToken, middleAuth, completeOnboarding);
  router.get("/me", middleAuth, me);
  router.get("/confirm_link/:confirmation_link_id", confirm_get);
  return router;
};

export default authRoutes;
