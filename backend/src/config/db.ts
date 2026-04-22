import mongoose from "mongoose";
import debug from "debug";
import dotenv from "dotenv";
dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
console.log(MONGO_URI);
export const dbDebug = debug("app:db");
const connectDB = async () => {
  try {
    if (MONGO_URI) {
      const conn = mongoose.connect(MONGO_URI);
      conn
        .then(() => {
          dbDebug("MONGO_DB connected");
        })
        .catch(() => {
          dbDebug("Error connecting to the database");
        });
    }
  } catch (error) {
    dbDebug(error);
  }
};
export default connectDB;
