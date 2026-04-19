import express from "express";
import dotenv from "dotenv";
import debug from "debug";
import cookie from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import { parse } from "path";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const serverDebug = debug("app:server");
const startServer = async () => {
  await connectDB();
  app.use(express.json());
  app.use(cookie());
  app.use("/auth", authRoutes());
  app.listen(PORT, () => {
    serverDebug(`Server connected on port ${PORT}`);
  });
};
startServer();
