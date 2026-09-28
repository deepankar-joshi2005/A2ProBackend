import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPayment extends Document {
  memberId: Types.ObjectId;
  amount: number;
  method: "Cash" | "Card" | "UPI" | "Bank Transfer" | "Other";
  date: Date;
  invoiceNumber: string;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    amount: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Bank Transfer", "Other"],
      default: "Cash",
    },
    date: { type: Date, default: Date.now },
    invoiceNumber: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IPayment>("Payment", paymentSchema);
