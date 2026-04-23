import express from "express";
import {
  confirm,
  confirm_get,
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
  router.post("/forgot", forgot);
  router.post("/verify", verifyCode);
  router.post("/reset", reset);
  router.get("/me", middleAuth, me);
  router.post("/logout", logout);
  router.get("/confirm_link/:confirmation_link_id", confirm_get);

  return router;
};

export default authRoutes;
