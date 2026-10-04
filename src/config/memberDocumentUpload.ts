import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "a2profitnes/member-documents",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    resource_type: "image",
  } as any,
});

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export const uploadMemberDocument = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, or WEBP images are allowed"));
  },
  limits: { fileSize: 8 * 1024 * 1024 },
}).single("document");
