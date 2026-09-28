import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMemberWorkoutPlan extends Document {
  memberId: Types.ObjectId;
  planId: Types.ObjectId;
  assignedDate: Date;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
}

const memberWorkoutPlanSchema = new Schema<IMemberWorkoutPlan>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "WorkoutPlan", required: true },
    assignedDate: { type: Date, default: Date.now },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IMemberWorkoutPlan>("MemberWorkoutPlan", memberWorkoutPlanSchema);
