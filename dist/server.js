import express from "express";
import dotenv from "dotenv";
import debug from "debug";
import cookie from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { apiReference } from "@scalar/express-api-reference";
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;
const serverDebug = debug("app:server");
const startServer = async () => {
    await connectDB();
    app.use(express.json());
    app.get("/openapi.json", (req, res) => {
        res.sendFile(path.join(__dirname, "openapi.json"));
    });
    app.use("/docs", apiReference({ url: "/openapi.json" }));
    app.use(cookie());
    app.use("/auth", authRoutes());
    app.listen(PORT, () => {
        serverDebug(`Server connected on port ${PORT}`);
    });
};
startServer();
//# sourceMappingURL=server.js.map