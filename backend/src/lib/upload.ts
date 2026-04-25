import multer from "multer";
import type { Request } from "express";
import { HttpError } from "../middleware/errorHandler.js";

export function makeUploadMiddleware(opts: { maxUploadMb: number }) {
  const storage = multer.memoryStorage();
  const maxBytes = Math.max(1, opts.maxUploadMb) * 1024 * 1024;

  return multer({
    storage,
    limits: {
      fileSize: maxBytes,
      files: 20
    },
    fileFilter: (_req: Request, file, cb) => {
      const allowed = new Set([
        "application/pdf",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ]);
      if (allowed.has(file.mimetype)) return cb(null, true);
      return cb(new HttpError(400, `Unsupported file type: ${file.mimetype}`));
    }
  });
}

