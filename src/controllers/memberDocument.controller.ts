import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import MemberDocument from "../models/memberDocument.model.js";

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
    fileUrl: `/uploads/member-documents/${req.file.filename}`,
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
  await document.deleteOne();
  res.json({ message: "Document removed" });
};
