import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPermissions {
  members: { view: boolean; add: boolean; edit: boolean; delete: boolean };
  attendance: { mark: boolean };
  memberships: { view: boolean; add: boolean; edit: boolean; delete: boolean; freeze: boolean };
  ptPlans: { view: boolean; add: boolean; edit: boolean; delete: boolean; freeze: boolean };
  services: { view: boolean; add: boolean; edit: boolean; delete: boolean };
  reports: { trends: boolean; collection: boolean; attendance: boolean };
  downloads: { reports: boolean };
  gymSetup: { membershipPlans: { view: boolean; add: boolean; edit: boolean; delete: boolean } };
  enquiries: { view: boolean; add: boolean; edit: boolean; delete: boolean };
  expenses: { view: boolean; add: boolean; edit: boolean; delete: boolean };
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "user" | "admin" | "staff";
  mobile: string;
  countryCode: string;
  isTrainer: boolean;
  permissions: IPermissions;
  createdBy: Types.ObjectId | null;
  createdAt: Date;
}

const crud = { view: { type: Boolean, default: false }, add: { type: Boolean, default: false }, edit: { type: Boolean, default: false }, delete: { type: Boolean, default: false } };

const permissionsSchema = new Schema<IPermissions>(
  {
    members: crud,
    attendance: { mark: { type: Boolean, default: false } },
    memberships: { ...crud, freeze: { type: Boolean, default: false } },
    ptPlans: { ...crud, freeze: { type: Boolean, default: false } },
    services: crud,
    reports: {
      trends: { type: Boolean, default: false },
      collection: { type: Boolean, default: false },
      attendance: { type: Boolean, default: false },
    },
    downloads: { reports: { type: Boolean, default: false } },
    gymSetup: { membershipPlans: crud },
    enquiries: crud,
    expenses: crud,
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "staff"], default: "user" },
    mobile: { type: String, default: "" },
    countryCode: { type: String, default: "+91" },
    isTrainer: { type: Boolean, default: false },
    permissions: { type: permissionsSchema, default: () => ({}) },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);