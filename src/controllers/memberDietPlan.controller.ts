import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import MemberDietPlan from "../models/memberDietPlan.model.js";
import DietPlan from "../models/dietPlan.model.js";

export const listMemberDietPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  const plans = await MemberDietPlan.find({ memberId: String(req.params.id) })
    .sort({ createdAt: -1 })
    .populate("planId");
  res.json({ plans });
};

export const assignMemberDietPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const plan = await DietPlan.findById(req.body.planId);
  if (!plan) {
    res.status(404).json({ message: "Diet plan not found" });
    return;
  }
  const assignment = await MemberDietPlan.create({
    memberId: String(req.params.id),
    planId: plan._id,
    createdBy: req.userId || null,
  });
  await assignment.populate("planId");
  res.status(201).json({ plan: assignment });
};

export const deleteMemberDietPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const assignment = await MemberDietPlan.findOne({ _id: req.params.planAssignmentId, memberId: String(req.params.id) });
  if (!assignment) {
    res.status(404).json({ message: "Assignment not found" });
    return;
  }
  await assignment.deleteOne();
  res.json({ message: "Diet plan removed" });
};
