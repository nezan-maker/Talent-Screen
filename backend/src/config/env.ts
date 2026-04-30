import dotenv from "dotenv";
dotenv.config();
const env = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  ACCESS_SECRET: process.env.ACCESS_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
  FRONTEND_ORIGIN:
    process.env.FRONTEND_ORIGIN ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000",
  FRONTEND_URL:
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:3000",
  API_URL:
    process.env.API_URL ||
    process.env.BACKEND_URL ||
    process.env.RENDER_EXTERNAL_URL,
  GOOGLE_CLIENT_ID:
    process.env.GOOGLE_CLIENT_ID || process.env.CLIENT_ID,
  GOOGLE_CLIENT_SECRET:
    process.env.GOOGLE_CLIENT_SECRET || process.env.CLIENT_SECRET,
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GOOGLE_AI_MODEL: process.env.GOOGLE_AI_MODEL,
  CLOUDINARY_API_NAME: process.env.CLOUDINARY_API_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  USER_EMAIL: process.env.USER_EMAIL,
  USER_PASS: process.env.USER_PASS,
  AUTO_SEED: process.env.AUTO_SEED === "true",
  VERTEX_PROJECT_ID: process.env.VERTEX_PROJECT_ID,
  VERTEX_LOCATION: process.env.VERTEX_LOCATION,
};
export default env;
