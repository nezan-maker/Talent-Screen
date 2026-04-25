import multer from "multer";
class HttpError extends Error {
    status;
    constructor(status, msg) {
        super(msg);
        this.status = status;
    }
}
export function makeUploadMiddleware(opts) {
    const storage = multer.memoryStorage();
    const maxBytes = Math.max(1, opts.maxUploadMb) * 1024 * 1024;
    return multer({
        storage,
        limits: {
            fileSize: maxBytes,
            files: 20
        },
        fileFilter: (_req, file, cb) => {
            const allowed = new Set([
                "application/pdf",
                "text/csv",
                "application/vnd.ms-excel",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ]);
            if (allowed.has(file.mimetype))
                return cb(null, true);
            return cb(new HttpError(400, `Unsupported file type: ${file.mimetype}`));
        }
    });
}
//# sourceMappingURL=upload.js.map