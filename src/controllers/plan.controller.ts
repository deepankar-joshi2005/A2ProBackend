import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import MembershipPlan from "../models/membershipPlan.model.js";

const toDurationInDays = (durationUnit: string, durationValue: number): number =>
  durationUnit === "months" ? Math.round(durationValue * 30) : Math.round(durationValue);

export const listPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  const includeInactive = String(req.query.all) === "true";
  const filter = includeInactive ? {} : { isActive: true };
  const plans = await MembershipPlan.find(filter).sort({ amount: 1 });
  res.json({ plans });
};

export const createPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, amount, durationUnit, durationValue } = req.body;

    if (!name || amount === undefined || !durationUnit || durationValue === undefined) {
      res.status(400).json({ message: "name, amount, durationUnit and durationValue are required" });
      return;
    }

    const plan = await MembershipPlan.create({
      name: String(name).trim(),
      amount: Number(amount),
      durationUnit,
      durationValue: Number(durationValue),
      durationInDays: toDurationInDays(durationUnit, Number(durationValue)),
    });

    res.status(201).json({ message: "Plan created successfully", plan });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ message: "A plan with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updatePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, amount, durationUnit, durationValue, isActive } = req.body;

    const update: any = {};
    if (name !== undefined) update.name = String(name).trim();
    if (amount !== undefined) update.amount = Number(amount);
    if (isActive !== undefined) update.isActive = Boolean(isActive);
    if (durationUnit !== undefined) update.durationUnit = durationUnit;
    if (durationValue !== undefined) update.durationValue = Number(durationValue);
    if (durationUnit !== undefined || durationValue !== undefined) {
      const existing = await MembershipPlan.findById(req.params.id);
      if (!existing) {
        res.status(404).json({ message: "Plan not found" });
        return;
      }
      const unit = durationUnit ?? existing.durationUnit;
      const value = durationValue !== undefined ? Number(durationValue) : existing.durationValue;
      update.durationInDays = toDurationInDays(unit, value);
    }

    const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!plan) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }

    res.json({ message: "Plan updated successfully", plan });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ message: "A plan with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deletePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      res.status(404).json({ message: "Plan not found" });
      return;
    }
    res.json({ message: "Plan deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
