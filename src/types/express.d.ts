import { Request } from "express";
import mongoose from "mongoose";
declare global {
  namespace Express {
    interface Request {
      resume_array?: mongoose.Types.ObjectId[];
    }
  }
}
