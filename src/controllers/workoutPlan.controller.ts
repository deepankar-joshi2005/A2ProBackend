import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import WorkoutPlan from "../models/workoutPlan.model.js";

export const listWorkoutPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  const includeInactive = String(req.query.all) === "true";
  const filter = includeInactive ? {} : { isActive: true };
  const plans = await WorkoutPlan.find(filter).sort({ createdAt: -1 });
  res.json({ plans });
};

export const createWorkoutPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, days, notes } = req.body;

    if (!name) {
      res.status(400).json({ message: "name is required" });
      return;
    }

    const plan = await WorkoutPlan.create({
      name: String(name).trim(),
      days: Array.isArray(days) ? days : [],
      notes: notes || "",
    });

    res.status(201).json({ message: "Workout plan created successfully", plan });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ message: "A workout plan with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updateWorkoutPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, days, notes, isActive } = req.body;

    const update: any = {};
    if (name !== undefined) update.name = String(name).trim();
    if (days !== undefined) update.days = Array.isArray(days) ? days : [];
    if (notes !== undefined) update.notes = notes;
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const plan = await WorkoutPlan.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!plan) {
      res.status(404).json({ message: "Workout plan not found" });
      return;
    }

    res.json({ message: "Workout plan updated successfully", plan });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ message: "A workout plan with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteWorkoutPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plan = await WorkoutPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      res.status(404).json({ message: "Workout plan not found" });
      return;
    }
    res.json({ message: "Workout plan deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
