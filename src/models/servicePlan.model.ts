import mongoose, { Document, Schema } from "mongoose";

export interface IServicePlan extends Document {
  name: string;
  amount: number;
  isActive: boolean;
  createdAt: Date;
}

const servicePlanSchema = new Schema<IServicePlan>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IServicePlan>("ServicePlan", servicePlanSchema);
