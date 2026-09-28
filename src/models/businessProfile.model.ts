import mongoose, { Document, Schema } from "mongoose";

export interface IBusinessProfile extends Document {
  businessName: string;
  contactPerson: string;
  phone: string;
  address: string;
}

const businessProfileSchema = new Schema<IBusinessProfile>(
  {
    businessName: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<IBusinessProfile>("BusinessProfile", businessProfileSchema);
