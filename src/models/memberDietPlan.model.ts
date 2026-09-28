import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMemberDietPlan extends Document {
  memberId: Types.ObjectId;
  planId: Types.ObjectId;
  assignedDate: Date;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
}

const memberDietPlanSchema = new Schema<IMemberDietPlan>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "DietPlan", required: true },
    assignedDate: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IMemberDietPlan>("MemberDietPlan", memberDietPlanSchema);
