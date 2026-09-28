import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMemberDocument extends Document {
  memberId: Types.ObjectId;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  uploadedBy: Types.ObjectId | null;
  createdAt: Date;
}

const memberDocumentSchema = new Schema<IMemberDocument>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: "" },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IMemberDocument>("MemberDocument", memberDocumentSchema);
