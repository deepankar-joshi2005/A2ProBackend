import mongoose, { Document, Schema, Types } from "mongoose";

export interface IGymService extends Document {
  memberId: Types.ObjectId;
  serviceName: string;
  paidAmount: number;
  dueAmount: number;
  date: Date;
  paymentMethod: "Cash" | "Card" | "UPI" | "Bank Transfer" | "Other";
  notes: string;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
}

const gymServiceSchema = new Schema<IGymService>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    serviceName: { type: String, required: true, trim: true },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },
    date: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Bank Transfer", "Other"],
      default: "Cash",
    },
    notes: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export const GymService = mongoose.model<IGymService>("GymService", gymServiceSchema);
