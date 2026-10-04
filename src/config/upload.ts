import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "./cloudinary.js";

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "a2profitnes/members",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 500, crop: "fill", gravity: "face" }],
  } as any,
});

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export const uploadMemberPhoto = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPG, PNG, or WEBP images are allowed"));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("photo");
