import { Request } from "express";
import mongoose from "mongoose";
declare global {
  namespace Express {
    interface Request {
      currentUserEmail?: string;
      currentUserId?: string;
      resume_array?: mongoose.Types.ObjectId[];
      files: Express.Multer.File[];
    }
  }
}
