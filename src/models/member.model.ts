import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMember extends Document {
  name: string;
  photoUrl: string | null;
  gender: "male" | "female";
  countryCode: string;
  mobile: string;
  membershipId: string;
  batchLabel: string;
  planId: Types.ObjectId | null;
  planAmount: number;
  isFrozen: boolean;
  isBlocked: boolean;
  joiningDate: Date;
  paymentDate: Date | null;
  paidAmount: number;
  paymentMethod: "Cash" | "Card" | "UPI" | "Bank Transfer" | "Other" | null;
  comments: string;
  discountType: "percent" | "amount";
  discountValue: number;
  admissionFees: number;
  dueAmount: number;
  planExpiryDate: Date | null;
  email: string;
  dob: Date | null;
  address: string;
  notes: string;
  accountUserId: Types.ObjectId | null;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
}

const memberSchema = new Schema<IMember>(
  {
    name: { type: String, required: true, trim: true },
    photoUrl: { type: String, default: null },
    gender: { type: String, enum: ["male", "female"], required: true },
    countryCode: { type: String, default: "+91" },
    mobile: { type: String, required: true, unique: true, trim: true },
    membershipId: { type: String, required: true, unique: true, trim: true },
    batchLabel: { type: String, default: "No Batch Found" },
    planId: { type: Schema.Types.ObjectId, ref: "MembershipPlan", default: null },
    planAmount: { type: Number, required: true, min: 0 },
    isFrozen: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    joiningDate: { type: Date, required: true },
    paymentDate: { type: Date, default: null },
    paidAmount: { type: Number, default: 0, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Bank Transfer", "Other", null],
      default: null,
    },
    comments: { type: String, default: "" },
    discountType: { type: String, enum: ["percent", "amount"], default: "percent" },
    discountValue: { type: Number, default: 0, min: 0 },
    admissionFees: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },
    planExpiryDate: { type: Date, default: null },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    dob: { type: Date, default: null },
    address: { type: String, default: "" },
    notes: { type: String, default: "" },
    accountUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IMember>("Member", memberSchema);
