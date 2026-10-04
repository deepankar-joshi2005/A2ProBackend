import multer from "multer";
import { Request, Response, NextFunction } from "express";
import cloudinary from "./cloudinary.js";

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

// Use memory storage — we'll stream the buffer to Cloudinary ourselves
const memStorage = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, or WEBP images are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("photo");

// Middleware: multer parse → upload buffer to Cloudinary → attach result to req.file
export const uploadMemberPhoto = (req: Request, res: Response, next: NextFunction): void => {
  memStorage(req, res, async (err) => {
    if (err) return next(err);
    if (!req.file) return next(); // no file — controller will handle

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "a2profitnes/members",
            transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file!.buffer);
      });

      // Attach Cloudinary URL as `path` so controllers use req.file.path
      (req.file as any).path = result.secure_url;
      (req.file as any).cloudinaryPublicId = result.public_id;
      next();
    } catch (uploadErr) {
      next(uploadErr);
    }
  });
};
