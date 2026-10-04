import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import MemberDocument from "../models/memberDocument.model.js";
import cloudinary from "../config/cloudinary.js";

export const listMemberDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
  const documents = await MemberDocument.find({ memberId: String(req.params.id) }).sort({ createdAt: -1 });
  res.json({ documents });
};

export const uploadMemberDoc = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ message: "A document file is required" });
    return;
  }
  const document = await MemberDocument.create({
    memberId: String(req.params.id),
    fileUrl: (req.file as any).path,          // Cloudinary secure URL
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    uploadedBy: req.userId || null,
  });
  res.status(201).json({ document });
};

export const deleteMemberDocument = async (req: AuthRequest, res: Response): Promise<void> => {
  const document = await MemberDocument.findOne({ _id: req.params.documentId, memberId: String(req.params.id) });
  if (!document) {
    res.status(404).json({ message: "Document not found" });
    return;
  }
  // Delete from Cloudinary if it's a Cloudinary URL
  if (document.fileUrl && document.fileUrl.includes("cloudinary.com")) {
    try {
      // Extract public_id from URL: .../a2profitnes/member-documents/filename
      const parts = document.fileUrl.split("/");
      const filenameWithExt = parts[parts.length - 1];
      const filename = filenameWithExt.split(".")[0];
      const folder = parts[parts.length - 2];
      const parentFolder = parts[parts.length - 3];
      await cloudinary.uploader.destroy(`${parentFolder}/${folder}/${filename}`);
    } catch (e) {
      console.warn("Could not delete from Cloudinary:", e);
    }
  }
  await document.deleteOne();
  res.json({ message: "Document removed" });
};
