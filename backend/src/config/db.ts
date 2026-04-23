import mongoose from "mongoose";
import debug from "debug";
import dotenv from "dotenv";

dotenv.config();

export const dbDebug = debug("app:db");

const connectDB = async () => {
  const { MONGO_URI } = process.env;

  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not set");
  }

  try {
    await mongoose.connect(MONGO_URI);
    dbDebug("MongoDB connected");
  } catch (error) {
    dbDebug("Error connecting to the database");
    dbDebug(error);
    throw error;
  }
};

export default connectDB;
