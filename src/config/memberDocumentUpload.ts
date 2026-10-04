import multer from "multer";
import { Request, Response, NextFunction } from "express";
import cloudinary from "./cloudinary.js";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

const memStorage = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, or WEBP images are allowed"));
  },
  limits: { fileSize: 8 * 1024 * 1024 },
}).single("document");

export const uploadMemberDocument = (req: Request, res: Response, next: NextFunction): void => {
  memStorage(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next();

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "a2profitnes/member-documents" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      });

      (req.file as any).path = result.secure_url;
      (req.file as any).cloudinaryPublicId = result.public_id;
      next();
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
};
