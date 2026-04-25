import dotenv from "dotenv";
dotenv.config();
const env = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  ACCESS_SECRET: process.env.ACCESS_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
  GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
  GOOGLE_AI_MODEL: process.env.GOOGLE_AI_MODEL || "gemini-2.0-flash",
  CLOUDINARY_API_NAME: process.env.CLOUDINARY_API_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
  USER_EMAIL: process.env.USER_EMAIL,
  USER_PASS: process.env.USER_PASS,
  VERTEX_PROJECT_ID: process.env.VERTEX_PROJECT_ID,
  VERTEX_LOCATION: process.env.VERTEX_LOCATION,
  AUTO_SEED: process.env.AUTO_SEED ?? "true",
};
export default env;
