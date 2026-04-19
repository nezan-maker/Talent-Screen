import express from "express";
import dotenv from "dotenv";
import debug from "debug";
import cookie from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import connectDB from "./config/db.js";
import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const serverDebug = debug("app:server");
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WiseRank API",
      version: "1.0.0",
    },
  },
  apis: ["./routes/*.js"],
};
const swaggerSpec = swaggerJSDoc(options);
const startServer = async () => {
  await connectDB();
  app.use(express.json());
  app.use(cookie());
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use("/auth", authRoutes());
  app.listen(PORT, () => {
    serverDebug(`Server connected on port ${PORT}`);
  });
};
startServer();
