import express from "express";
import authRoutes from "./routes/authRoutes.js";
const app = express();
app.use("/auth", authRoutes);
app.use("/");
//# sourceMappingURL=server.js.map