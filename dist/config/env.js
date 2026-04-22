import dotenv from "dotenv";
dotenv.config();
const env = {
    PORT: process.env.PORT,
    MONGO_URI: process.env.MONGO_URI,
    ACCESS_SECRET: process.env.ACCESS_SECRET,
    REFRESH_SECRET: process.env.REFRESH_SECRET,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    CLOUDINARY_API_NAME: process.env.CLOUDINARY_API_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};
export default env;
//# sourceMappingURL=env.js.map