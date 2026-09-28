import mongoose, { Document, Schema } from "mongoose";

export interface IPTPlan extends Document {
  name: string;
  amount: number;
  isSessionBased: boolean;
  sessions: number;
  durationUnit: "months" | "days";
  durationValue: number;
  durationInDays: number;
  isActive: boolean;
  createdAt: Date;
}

const ptPlanSchema = new Schema<IPTPlan>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    isSessionBased: { type: Boolean, default: false },
    sessions: { type: Number, default: 0, min: 0 },
    durationUnit: { type: String, enum: ["months", "days"], default: "months" },
    durationValue: { type: Number, default: 1 },
    durationInDays: { type: Number, default: 30, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IPTPlan>("PTPlan", ptPlanSchema);
