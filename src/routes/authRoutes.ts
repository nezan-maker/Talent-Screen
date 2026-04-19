import express from "express";
import swaggerJSDoc from "swagger-jsdoc";
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Creates new account
 *     description: Allows user to signup in case he/she does not have an account on WiseRank
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_name:
 *                 type: string
 *               user_email:
 *                 type: string
 *               user_pass:
 *                 type: string
 *               user_pass_conf:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sign up successful
 *       500:
 *         description: Internal server error
 */
import {
  signUp,
  logIn,
  forgot,
  verifyCode,
  confirm,
} from "../controllers/authControl.js";
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
