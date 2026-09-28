import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMemberPTPlan extends Document {
  memberId: Types.ObjectId;
  ptPlanId: Types.ObjectId;
  startDate: Date;
  expiryDate: Date;
  isFrozen: boolean;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
}

const memberPtPlanSchema = new Schema<IMemberPTPlan>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    ptPlanId: { type: Schema.Types.ObjectId, ref: "PTPlan", required: true },
    startDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, required: true },
    isFrozen: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IMemberPTPlan>("MemberPTPlan", memberPtPlanSchema);
