import express from "express";
import dotenv from "dotenv";
import debug from "debug";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const serverDebug = debug("app:server");
const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
        serverDebug(`Server connected on port ${PORT}`);
    });
};
startServer();
//# sourceMappingURL=server.js.map