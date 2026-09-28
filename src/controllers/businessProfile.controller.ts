import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import BusinessProfile from "../models/businessProfile.model.js";

export const getBusinessProfile = async (_req: AuthRequest, res: Response): Promise<void> => {
  const profile = (await BusinessProfile.findOne()) || { businessName: "", contactPerson: "", phone: "", address: "" };
  res.json({ profile });
};

export const saveBusinessProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { businessName, contactPerson, phone, address } = req.body;
  let profile = await BusinessProfile.findOne();
  if (!profile) {
    profile = new BusinessProfile();
  }
  if (businessName !== undefined) profile.businessName = businessName;
  if (contactPerson !== undefined) profile.contactPerson = contactPerson;
  if (phone !== undefined) profile.phone = phone;
  if (address !== undefined) profile.address = address;
  await profile.save();
  res.json({ profile });
};
