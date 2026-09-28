import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import MemberPTPlan from "../models/memberPtPlan.model.js";
import PTPlan from "../models/ptPlan.model.js";

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export const listMemberPTPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  const plans = await MemberPTPlan.find({ memberId: String(req.params.id) })
    .sort({ createdAt: -1 })
    .populate("ptPlanId", "name amount");
  res.json({ plans });
};

export const assignMemberPTPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ptPlan = await PTPlan.findById(req.body.ptPlanId);
    if (!ptPlan) {
      res.status(404).json({ message: "PT plan not found" });
      return;
    }
    const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
    const expiryDate = addDays(startDate, ptPlan.durationInDays);
    const assignment = await MemberPTPlan.create({
      memberId: String(req.params.id),
      ptPlanId: ptPlan._id,
      startDate,
      expiryDate,
      createdBy: req.userId || null,
    });
    await assignment.populate("ptPlanId", "name amount");
    res.status(201).json({ plan: assignment });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const toggleFreezeMemberPTPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const assignment = await MemberPTPlan.findOne({ _id: req.params.planAssignmentId, memberId: String(req.params.id) });
  if (!assignment) {
    res.status(404).json({ message: "Assignment not found" });
    return;
  }
  assignment.isFrozen = !assignment.isFrozen;
  await assignment.save();
  res.json({ plan: assignment });
};

export const deleteMemberPTPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const assignment = await MemberPTPlan.findOne({ _id: req.params.planAssignmentId, memberId: String(req.params.id) });
  if (!assignment) {
    res.status(404).json({ message: "Assignment not found" });
    return;
  }
  await assignment.deleteOne();
  res.json({ message: "PT plan removed" });
};
