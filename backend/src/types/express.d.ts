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
    }
  }
}
