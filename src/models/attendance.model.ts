import mongoose, { Document, Schema, Types } from "mongoose";

export interface IAttendance extends Document {
  memberId: Types.ObjectId;
  dateStr: string; // YYYY-MM-DD
  punchInTime: Date;
  punchOutTime: Date | null;
  status: "punched_in" | "punched_out";
  createdBy: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new Schema<IAttendance>(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    dateStr: { type: String, required: true, index: true },
    punchInTime: { type: Date, required: true },
    punchOutTime: { type: Date, default: null },
    status: { type: String, enum: ["punched_in", "punched_out"], default: "punched_in" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IAttendance>("Attendance", attendanceSchema);
