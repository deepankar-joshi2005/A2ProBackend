import mongoose, { Document, Schema } from "mongoose";

export interface IMembershipPlan extends Document {
  name: string;
  amount: number;
  durationUnit: "months" | "days";
  durationValue: number;
  durationInDays: number;
  isActive: boolean;
  createdAt: Date;
}

const membershipPlanSchema = new Schema<IMembershipPlan>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    durationUnit: { type: String, enum: ["months", "days"], default: "days" },
    durationValue: { type: Number, default: 1 },
    durationInDays: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IMembershipPlan>("MembershipPlan", membershipPlanSchema);
