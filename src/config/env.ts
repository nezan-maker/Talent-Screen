import dotenv from "dotenv";
dotenv.config();
const env = {
  PORT: process.env.PORT,
  MONGO_URI: process.env.MONGO_URI,
  ACCESS_SECRET: process.env.ACCESS_SECRET,
  REFRESH_SECRET: process.env.REFRESH_SECRET,
  GOOGLE_API_KEY: process.env.GEMINI_API_KEY,
};
export default env;
