import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../middleware/auth.middleware.js";
import User from "../models/user.model.js";

export const listTeamMembers = async (_req: AuthRequest, res: Response): Promise<void> => {
  const staff = await User.find({ role: "staff" }).select("-password").sort({ createdAt: -1 });
  res.json({ staff });
};

// Public endpoint — returns only staff marked as trainers (no sensitive data)
export const listPublicTrainers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trainers = await User.find({ role: "staff", isTrainer: true })
      .select("name isTrainer mobile countryCode")
      .sort({ name: 1 });
    res.json({ trainers });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const createTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, mobile, countryCode, password, isTrainer, permissions } = req.body;
    if (!name || !email || !mobile || !password) {
      res.status(400).json({ message: "Name, email, mobile and password are required" });
      return;
    }
    if (String(password).length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }
    const normalizedEmail = String(email).toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const staff = await User.create({
      name,
      email: normalizedEmail,
      mobile,
      countryCode: countryCode || "+91",
      password: hashed,
      role: "staff",
      isTrainer: !!isTrainer,
      permissions: permissions || {},
      createdBy: req.userId || null,
    });
    const result = staff.toObject();
    delete (result as any).password;
    res.status(201).json({ staff: result });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updateTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const staff = await User.findOne({ _id: req.params.id, role: "staff" });
    if (!staff) {
      res.status(404).json({ message: "Team member not found" });
      return;
    }
    const { name, email, mobile, countryCode, password, isTrainer, permissions } = req.body;
    if (email && String(email).toLowerCase() !== staff.email) {
      const normalizedEmail = String(email).toLowerCase();
      if (await User.findOne({ email: normalizedEmail, _id: { $ne: staff._id } })) {
        res.status(409).json({ message: "Email already registered" });
        return;
      }
      staff.email = normalizedEmail;
    }
    if (name !== undefined) staff.name = name;
    if (mobile !== undefined) staff.mobile = mobile;
    if (countryCode !== undefined) staff.countryCode = countryCode;
    if (isTrainer !== undefined) staff.isTrainer = !!isTrainer;
    if (permissions !== undefined) staff.permissions = permissions;
    if (password) {
      if (String(password).length < 6) {
        res.status(400).json({ message: "Password must be at least 6 characters" });
        return;
      }
      staff.password = await bcrypt.hash(password, 10);
    }
    await staff.save();
    const result = staff.toObject();
    delete (result as any).password;
    res.json({ staff: result });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const staff = await User.findOne({ _id: req.params.id, role: "staff" });
  if (!staff) {
    res.status(404).json({ message: "Team member not found" });
    return;
  }
  await staff.deleteOne();
  res.json({ message: "Team member removed" });
};
