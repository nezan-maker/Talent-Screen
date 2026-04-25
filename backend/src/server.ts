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
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = parseInt(process.env.PORT || "10000", 10);
const serverDebug = debug("app:server");

const originsFromEnv = env.FRONTEND_ORIGIN?.split(",") || [
  "https://wiserank-lmwy.onrender.com",
];

const allowedOrigins = new Set([
  ...originsFromEnv.map((url) => url.trim()).filter(Boolean),
  "http://127.0.0.1:3000",
]);

const startServer = async () => {
  await connectDB();
  await ensureSeedData();
  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && allowedOrigins.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    }

    res.header("Vary", "Origin");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }

    return next();
  });
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan("dev"));
  app.get("/openapi.json", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "openapi.json"));
  });
  app.use("/docs", apiReference({ url: "/openapi.json" }));
  app.use(cookie());
  app.use("/auth", authRoutes());
  app.use("/", dashRoutes());
  app.use("/ai", aiRoutes);
  app.listen(PORT, "0.0.0.0", () => {
    serverDebug(`Server connected on port ${PORT}`);
  });
};
startServer().catch((error) => {
  serverDebug("Server failed to start");
  serverDebug(error);
  process.exit(1);
});
