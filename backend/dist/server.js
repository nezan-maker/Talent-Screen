import express from "express";
import dotenv from "dotenv";
import debug from "debug";
import cookie from "cookie-parser";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { apiReference } from "@scalar/express-api-reference";
import dashRoutes from "./routes/dashRoutes.js";
import env from "./config/env.js";
import aiRoutes from "./services/aiservice.js";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = env?.PORT || 5000;
const serverDebug = debug("app:server");
const startServer = async () => {
    await connectDB();
    app.use(express.json());
    app.use(morgan("dev"));
    app.get("/openapi.json", (req, res) => {
        res.sendFile(path.join(__dirname, "openapi.json"));
    });
    app.use("/docs", apiReference({ url: "/openapi.json" }));
    app.use(cookie());
    app.use("/auth", authRoutes());
    app.use("/", dashRoutes());
    app.use("/ai", aiRoutes);
    app.listen(PORT, () => {
        serverDebug(`Server connected on port ${PORT}`);
    });
};
startServer().catch((error) => {
    serverDebug("Server failed to start");
    serverDebug(error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map