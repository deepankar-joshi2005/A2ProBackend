import { Response } from "express";
import bcrypt from "bcryptjs";
import { AuthRequest } from "../middleware/auth.middleware.js";
import Member from "../models/member.model.js";
import MembershipPlan from "../models/membershipPlan.model.js";
import User from "../models/user.model.js";
import Batch from "../models/batch.model.js";

function computeDueAmount(
  planAmount: number,
  discountType: "percent" | "amount",
  discountValue: number,
  admissionFees: number,
  paidAmount: number
): number {
  const discountAmount =
    discountType === "percent" ? (planAmount * discountValue) / 100 : discountValue;
  return Math.max(0, planAmount - discountAmount + admissionFees - paidAmount);
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const listMembers = async (req: AuthRequest, res: Response): Promise<void> => {
  const query: any = {};
  if (req.query.gender && req.query.gender !== 'all') {
    query.gender = req.query.gender;
  }
  if (req.query.planId && req.query.planId !== 'all') {
    query.planId = req.query.planId;
  }
  if (req.query.batchLabel && req.query.batchLabel !== 'all') {
    query.batchLabel = req.query.batchLabel;
  }
  const members = await Member.find(query)
    .sort({ createdAt: -1 })
    .populate("planId", "name amount durationInDays");

  // Sort by numeric membershipId (1,2,3... not lexicographic 1,10,2...)
  members.sort((a, b) => {
    const aNum = Number(a.membershipId);
    const bNum = Number(b.membershipId);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    return a.membershipId.localeCompare(b.membershipId);
  });
  res.json({ members });
};

export const getMemberById = async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await Member.findById(req.params.id).populate("planId", "name amount durationInDays");
  if (!member) {
    res.status(404).json({ message: "Member not found" });
    return;
  }
  res.json({ member });
};

export const createMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const b = req.body;
    if (!b.name || !b.gender || !b.mobile || !b.membershipId || !b.planId || !b.joiningDate || !b.email) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    if (await Member.findOne({ membershipId: b.membershipId })) {
      res.status(409).json({ message: "Membership ID already in use" });
      return;
    }
    if (await Member.findOne({ mobile: b.mobile })) {
      res.status(409).json({ message: "Mobile number already registered" });
      return;
    }
    const email = String(b.email).toLowerCase();
    if (await Member.findOne({ email })) {
      res.status(409).json({ message: "Email already registered to a member" });
      return;
    }
    const plan = await MembershipPlan.findById(b.planId);
    if (!plan) {
      res.status(404).json({ message: "Selected plan not found" });
      return;
    }

    const discountType = b.discountType === "amount" ? "amount" : "percent";
    const discountValue = Number(b.discountValue) || 0;
    const admissionFees = Number(b.admissionFees) || 0;
    const paidAmount = Number(b.paidAmount) || 0;
    const joiningDate = new Date(b.joiningDate);
    const dueAmount = computeDueAmount(plan.amount, discountType, discountValue, admissionFees, paidAmount);
    const planExpiryDate = addDays(joiningDate, plan.durationInDays);

    const rawPassword = b.password && String(b.password).trim().length >= 6 ? String(b.password).trim() : "123456";
    let accountUserId = null;
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        if (b.password && String(b.password).trim().length >= 6) {
          existingUser.password = await bcrypt.hash(rawPassword, 10);
          await existingUser.save();
        }
        accountUserId = existingUser._id;
      } else {
        const hashed = await bcrypt.hash(rawPassword, 10);
        const newUser = await User.create({
          name: b.name,
          email,
          password: hashed,
          role: "user",
        });
        accountUserId = newUser._id;
      }
    } catch (userErr) {
      console.warn("Could not auto-create user account for member:", userErr);
    }

    const member = await Member.create({
      name: b.name,
      photoUrl: req.file ? (req.file as any).path : null,
      gender: b.gender,
      countryCode: b.countryCode || "+91",
      mobile: b.mobile,
      membershipId: b.membershipId,
      planId: plan._id,
      planAmount: plan.amount,
      joiningDate,
      paymentDate: b.paymentDate ? new Date(b.paymentDate) : null,
      paidAmount,
      paymentMethod: b.paymentMethod || null,
      comments: b.comments || "",
      discountType,
      discountValue,
      admissionFees,
      dueAmount,
      planExpiryDate,
      email,
      dob: b.dob ? new Date(b.dob) : null,
      address: b.address || "",
      notes: b.notes || "",
      accountUserId: accountUserId as any,
      createdBy: req.userId || null,
    });
    await member.populate("planId", "name amount durationInDays");
    res.status(201).json({ member });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await Member.findById(req.params.id);
  if (!member) {
    res.status(404).json({ message: "Member not found" });
    return;
  }
  if (member.accountUserId) {
    await User.findByIdAndDelete(member.accountUserId);
  }
  if (member.email) {
    await User.deleteOne({ email: member.email });
  }
  await member.deleteOne();
  res.json({ message: "Member deleted" });
};

export const getNextMembershipId = async (_req: AuthRequest, res: Response): Promise<void> => {
  const members = await Member.find({}, "membershipId");

  // Collect all numeric membership IDs that exist
  const usedIds = new Set(
    members
      .map((x) => Number(x.membershipId))
      .filter((n) => Number.isFinite(n) && n > 0)
  );

  if (usedIds.size === 0) {
    res.json({ nextMembershipId: "1" });
    return;
  }

  const max = Math.max(...usedIds);

  // Find the smallest missing positive integer in the used set
  for (let i = 1; i <= max; i++) {
    if (!usedIds.has(i)) {
      res.json({ nextMembershipId: String(i) });
      return;
    }
  }

  // No gap found — use max + 1
  res.json({ nextMembershipId: String(max + 1) });
};

export const checkMembershipIdAvailability = async (req: AuthRequest, res: Response): Promise<void> => {
  const value = String(req.query.membershipId || "");
  const exists = await Member.findOne({ membershipId: value });
  res.json({ available: !exists });
};

export const createMemberAccount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    if (!password || String(password).length < 6) {
      res.status(400).json({ message: "Password must be at least 6 characters" });
      return;
    }
    const member = await Member.findById(req.params.id);
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }
    if (member.accountUserId) {
      res.status(409).json({ message: "Account already exists for this member" });
      return;
    }
    if (await User.findOne({ email: member.email })) {
      res.status(409).json({ message: "Email already registered to a different user" });
      return;
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name: member.name, email: member.email, password: hashed, role: "user" });
    member.accountUserId = user._id as any;
    await member.save();
    res.status(201).json({ message: "Account created", userId: user._id });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const renewMemberPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const b = req.body;
    const member = await Member.findById(id);
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }
    const planId = b.planId || member.planId;
    const plan = await MembershipPlan.findById(planId);
    if (!plan) {
      res.status(404).json({ message: "Selected plan not found" });
      return;
    }

    const discountType = b.discountType === "amount" ? "amount" : "percent";
    const discountValue = Number(b.discountValue) || 0;
    const admissionFees = Number(b.admissionFees) || 0;
    const paidAmount = Number(b.paidAmount) || 0;

    const dueAmount = computeDueAmount(plan.amount, discountType, discountValue, admissionFees, paidAmount);

    const now = new Date();
    const currentExpiry = member.planExpiryDate ? new Date(member.planExpiryDate) : new Date(0);
    const startDateInput = b.planStartDate ? new Date(b.planStartDate) : new Date();

    let baseDate: Date;
    if (currentExpiry > now) {
      baseDate = currentExpiry;
    } else {
      baseDate = startDateInput;
    }

    const newExpiryDate = addDays(baseDate, plan.durationInDays);

    member.planId = plan._id as any;
    member.planAmount = plan.amount;
    member.planExpiryDate = newExpiryDate;
    member.dueAmount = dueAmount;
    member.paidAmount = paidAmount;
    member.paymentDate = b.paymentDate ? new Date(b.paymentDate) : new Date();
    if (b.paymentMethod) member.paymentMethod = b.paymentMethod;
    member.admissionFees = admissionFees;
    member.discountType = discountType;
    member.discountValue = discountValue;
    if (b.comments !== undefined) member.comments = b.comments;

    await member.save();
    const updated = await Member.findById(id).populate("planId", "name amount durationInDays");
    res.json({ message: "Plan renewed successfully", member: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const clearMemberPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await Member.findById(req.params.id);
  if (!member) {
    res.status(404).json({ message: "Member not found" });
    return;
  }
  member.planId = null;
  member.planAmount = 0;
  member.dueAmount = 0;
  member.paidAmount = 0;
  member.planExpiryDate = null;
  await member.save();
  res.json({ member });
};

export const toggleFreezeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await Member.findById(req.params.id);
  if (!member) {
    res.status(404).json({ message: "Member not found" });
    return;
  }
  member.isFrozen = !member.isFrozen;
  await member.save();
  res.json({ member });
};

export const toggleBlockMember = async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await Member.findById(req.params.id);
  if (!member) {
    res.status(404).json({ message: "Member not found" });
    return;
  }
  member.isBlocked = !member.isBlocked;
  await member.save();
  res.json({ member });
};

export const assignMemberBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const member = await Member.findById(req.params.id);
  if (!member) {
    res.status(404).json({ message: "Member not found" });
    return;
  }
  const { batchId } = req.body;
  if (!batchId) {
    member.batchLabel = "No Batch Found";
  } else {
    const batch = await Batch.findById(batchId);
    if (!batch) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }
    member.batchLabel = batch.name;
  }
  await member.save();
  res.json({ member });
};

export const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    const member = await Member.findOne({
      $or: [
        { accountUserId: user._id },
        { email: user.email.toLowerCase() },
      ],
    }).populate("planId", "name amount durationInDays durationUnit durationValue");

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      member: member || null,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};


export const updateMemberPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: "No photo uploaded" });
      return;
    }
    member.photoUrl = (req.file as any).path;
    await member.save();
    await member.populate("planId", "name amount durationInDays");
    res.json({ member });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
