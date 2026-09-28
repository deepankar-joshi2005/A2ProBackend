import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMeasurement extends Document {
  memberId: Types.ObjectId;
  date: Date;
  height: number | null;
  weight: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
  leftThigh: number | null;
  rightThigh: number | null;
  leftArm: number | null;
  rightArm: number | null;
  age: number | null;
  neck: number | null;
  leftCalf: number | null;
  rightCalf: number | null;
  bodyFatPercent: number | null;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
}

const num = { type: Number, default: null };

const measurementSchema = new Schema<IMeasurement>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    date: { type: Date, default: Date.now },
    height: num,
    weight: num,
    chest: num,
    waist: num,
    hips: num,
    leftThigh: num,
    rightThigh: num,
    leftArm: num,
    rightArm: num,
    age: num,
    neck: num,
    leftCalf: num,
    rightCalf: num,
    bodyFatPercent: num,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IMeasurement>("Measurement", measurementSchema);
