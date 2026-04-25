import express from "express";
import dotenv from "dotenv";
import debug from "debug";
import cookie from "cookie-parser";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import type { Request, Response } from "express";
import { apiReference } from "@scalar/express-api-reference";
import dashRoutes from "./routes/dashRoutes.js";
import env from "./config/env.js";
import aiRoutes from "./services/aiservice.js";
import { ensureSeedData } from "./services/seedService.js";
import cors from "cors"
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.set("trust proxy", 1);
const PORT = parseInt(process.env.PORT || "10000", 10);
const serverDebug = debug("app:server");

const originsFromEnv =
  process.env.FRONTEND_ORIGIN || "https://wiserank-lmwy.onrender.com";

const allowedOrigins = new Set([originsFromEnv, "http://127.0.0.1:3000"]);

const startServer = async () => {
  await connectDB();
  await ensureSeedData();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookie());
  app.use(
    cors({
      origin: ["https://wiserank-lmwy.onrender.com", "http://127.0.0.1:3000"],
      credentials: true,
    }),
  );
  app.use(morgan("dev"));
  app.get("/openapi.json", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "openapi.json"));
  });
  app.use("/docs", apiReference({ url: "/openapi.json" }));
  app.use("/auth", authRoutes());
  app.use("/", dashRoutes());
  app.use("/ai", aiRoutes);
  app.listen(PORT, "0.0.0.0", () => {
    serverDebug(`Server connected on port ${PORT}`);
  });
};
startServer()
  .then(() => {
    serverDebug("Server started correctly");
  })
  .catch((error) => {
    serverDebug("Server failed to start");
    serverDebug(error);
    process.exit(1);
  });
