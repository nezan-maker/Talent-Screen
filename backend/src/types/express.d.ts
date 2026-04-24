<<<<<<< HEAD
declare global {
  namespace Express {
    interface Request {
      currentUserId?: string;
      currentUser?: {
        _id: string;
        user_name: string;
        user_email: string;
        company_name: string;
        isVerified: boolean;
      };
=======
import { Request } from "express";
import mongoose from "mongoose";
import { Short_AppL } from "../controllers/shortList.ts";
declare global {
  namespace Express {
    interface Request {
      resume_array?: mongoose.Types.ObjectId[];
      files: Express.Multer.File[];
      shortlisted: Short_AppL[];
      rejected: Short_AppL[];
>>>>>>> 5ba2726 (Prepared for ultimate debug session)
    }
  }
}

export {};
