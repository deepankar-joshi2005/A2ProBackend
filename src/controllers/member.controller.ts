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
    if (!b.name || !b.gender || !b.mobile || !b.membershipId || !b.planId || !b.joiningDate) {
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
    const email = b.email ? String(b.email).toLowerCase() : null;
    if (email && await Member.findOne({ email })) {
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
    const planStartDate = b.planStartDate ? new Date(b.planStartDate) : joiningDate;
    const planExpiryDate = b.planExpiryDate ? new Date(b.planExpiryDate) : addDays(joiningDate, plan.durationInDays);
    const dueAmount = computeDueAmount(plan.amount, discountType, discountValue, admissionFees, paidAmount);

    const hasPassword = !!(b.password && String(b.password).trim().length >= 6);
    const rawPassword = hasPassword ? String(b.password).trim() : null;
    let accountUserId = null;
    if (email) {
      try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          if (hasPassword) {
            existingUser.password = await bcrypt.hash(rawPassword as string, 10);
            await existingUser.save();
          }
          accountUserId = existingUser._id;
        } else if (hasPassword) {
          const hashed = await bcrypt.hash(rawPassword as string, 10);
          const newUser = await User.create({
            name: b.name,
            email,
            password: hashed,
            role: "user",
          });
          accountUserId = newUser._id;
        }
        // No password entered and no existing account: skip creating a portal login.
      } catch (userErr) {
        console.warn("Could not auto-create user account for member:", userErr);
      }
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
      planStartDate,
      paymentDate: b.paymentDate ? new Date(b.paymentDate) : null,
      paidAmount,
      paymentMethod: b.paymentMethod || null,
      comments: b.comments || "",
      discountType,
      discountValue,
      admissionFees,
      dueAmount,
      planExpiryDate,
      email: email || undefined,
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

    const startDateInput = b.planStartDate ? new Date(b.planStartDate) : new Date();
    const newExpiryDate = b.planExpiryDate ? new Date(b.planExpiryDate) : addDays(startDateInput, plan.durationInDays);

    member.planId = plan._id as any;
    member.planAmount = plan.amount;
    member.planStartDate = startDateInput;
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


export const updateMemberBasicDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    const {
      name,
      email: rawEmail,
      mobile,
      countryCode,
      gender,
      dob,
      address,
      notes,
      newPassword,
    } = req.body;

    const email = rawEmail !== undefined
      ? (rawEmail ? String(rawEmail).toLowerCase().trim() : "")
      : undefined;

    // Validate mobile uniqueness — skip self
    if (mobile !== undefined) {
      const existing = await Member.findOne({ mobile, _id: { $ne: member._id } });
      if (existing) {
        res.status(409).json({ message: "Mobile number already registered to another member" });
        return;
      }
    }

    // Validate email uniqueness — skip self on both collections
    if (email !== undefined && email !== "") {
      // Member collection uniqueness
      const existingMember = await Member.findOne({ email, _id: { $ne: member._id } });
      if (existingMember) {
        res.status(409).json({ message: "Email already registered to another member" });
        return;
      }

      // User collection uniqueness — skip self by accountUserId (if linked) or by current email (if no link)
      const userExclude: any = {};
      if (member.accountUserId) {
        userExclude._id = { $ne: member.accountUserId };
      } else if (member.email) {
        // The only User that could legitimately own this email is the one linked by old email
        // so exclude users whose email matches the member's current email
        userExclude.email = { $ne: member.email };
      }
      const conflictingUser = await User.findOne({ email, ...userExclude });
      if (conflictingUser) {
        res.status(409).json({ message: "Email already in use by another portal account" });
        return;
      }
    }

    const oldEmail = member.email;

    // Apply field updates to the Member document
    if (name !== undefined) member.name = name;
    if (email !== undefined) member.email = email || undefined;
    if (mobile !== undefined) member.mobile = mobile;
    if (countryCode !== undefined) member.countryCode = countryCode;
    if (gender !== undefined) member.gender = gender;
    if (dob !== undefined) member.dob = dob ? new Date(dob) : null;
    if (address !== undefined) member.address = address;
    if (notes !== undefined) member.notes = notes;

    await member.save();

    const emailChanged = email !== undefined && email !== oldEmail;
    const hasNewPassword = !!(newPassword && String(newPassword).trim().length >= 6);
    const rawNewPassword = hasNewPassword ? String(newPassword).trim() : null;

    // If email changed and member has accountUserId, update linked User.email
    if (emailChanged && member.accountUserId) {
      await User.findByIdAndUpdate(member.accountUserId, { email });
    }

    // If email changed and no accountUserId but a User exists with old email, update that User.email
    if (emailChanged && !member.accountUserId && oldEmail) {
      await User.updateOne({ email: oldEmail }, { $set: { email } });
    }

    // If newPassword (≥6 chars) provided and member has accountUserId, hash and update User.password
    if (hasNewPassword && member.accountUserId) {
      const hashed = await bcrypt.hash(rawNewPassword as string, 10);
      await User.findByIdAndUpdate(member.accountUserId, { password: hashed });
    }

    // If email + newPassword (≥6 chars) provided and no linked account exists, create new User and link
    if (email && hasNewPassword && !member.accountUserId) {
      const hashed = await bcrypt.hash(rawNewPassword as string, 10);
      const newUser = await User.create({
        name: member.name,
        email,
        password: hashed,
        role: "user",
      });
      member.accountUserId = newUser._id as any;
      await member.save();
    }

    const populatedMember = await Member.findById(member._id).populate("planId", "name amount durationInDays");
    res.json({ member: populatedMember });
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
