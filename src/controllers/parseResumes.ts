import * as pdfLib from "pdfjs-dist/legacy/build/pdf.mjs";
import type { Request, Response } from "express";
const resumeParser = async (req: Request, res: Response) => {
  if (!req.file)
    return res.status(400).json({ data_error: "No valid pdf file" });
  const file: Express.Multer.File = req.file;
  const 
};
export default resumeParser;
