import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import MemberWorkoutPlan from "../models/memberWorkoutPlan.model.js";
import WorkoutPlan from "../models/workoutPlan.model.js";

export const listMemberWorkoutPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  const plans = await MemberWorkoutPlan.find({ memberId: String(req.params.id) })
    .sort({ createdAt: -1 })
    .populate("planId");
  res.json({ plans });
};

export const assignMemberWorkoutPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const plan = await WorkoutPlan.findById(req.body.planId);
  if (!plan) {
    res.status(404).json({ message: "Workout plan not found" });
    return;
  }
  const assignment = await MemberWorkoutPlan.create({
    memberId: String(req.params.id),
    planId: plan._id,
    createdBy: req.userId || null,
  });
  await assignment.populate("planId");
  res.status(201).json({ plan: assignment });
};

export const deleteMemberWorkoutPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  const assignment = await MemberWorkoutPlan.findOne({ _id: req.params.planAssignmentId, memberId: String(req.params.id) });
  if (!assignment) {
    res.status(404).json({ message: "Assignment not found" });
    return;
  }
  await assignment.deleteOne();
  res.json({ message: "Workout plan removed" });
};
