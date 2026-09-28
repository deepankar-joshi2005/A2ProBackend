import mongoose, { Document, Schema } from "mongoose";

export interface IBatch extends Document {
  name: string;
  limit: number;
  openTime: string;
  closeTime: string;
  isActive: boolean;
  createdAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    limit: { type: Number, required: true, min: 0 },
    openTime: { type: String, default: "" },
    closeTime: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IBatch>("Batch", batchSchema);
