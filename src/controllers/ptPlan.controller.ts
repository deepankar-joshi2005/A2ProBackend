import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import PTPlan from "../models/ptPlan.model.js";

const toDurationInDays = (durationUnit: string, durationValue: number): number =>
  durationUnit === "months" ? Math.round(durationValue * 30) : Math.round(durationValue);

export const listPTPlans = async (req: AuthRequest, res: Response): Promise<void> => {
  const includeInactive = String(req.query.all) === "true";
  const filter = includeInactive ? {} : { isActive: true };
  const plans = await PTPlan.find(filter).sort({ amount: 1 });
  res.json({ plans });
};

export const createPTPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, amount, isSessionBased, sessions, durationUnit, durationValue } = req.body;

    if (!name || amount === undefined) {
      res.status(400).json({ message: "name and amount are required" });
      return;
    }

    const sessionBased = Boolean(isSessionBased);
    const plan = await PTPlan.create({
      name: String(name).trim(),
      amount: Number(amount),
      isSessionBased: sessionBased,
      sessions: sessionBased ? Number(sessions) || 0 : 0,
      durationUnit: durationUnit || "months",
      durationValue: durationValue !== undefined ? Number(durationValue) : 1,
      durationInDays: sessionBased ? 0 : toDurationInDays(durationUnit || "months", Number(durationValue) || 1),
    });

    res.status(201).json({ message: "PT plan created successfully", plan });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ message: "A PT plan with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updatePTPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await PTPlan.findById(req.params.id);
    if (!existing) {
      res.status(404).json({ message: "PT plan not found" });
      return;
    }

    const { name, amount, isSessionBased, sessions, durationUnit, durationValue, isActive } = req.body;

    const update: any = {};
    if (name !== undefined) update.name = String(name).trim();
    if (amount !== undefined) update.amount = Number(amount);
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const sessionBased = isSessionBased !== undefined ? Boolean(isSessionBased) : existing.isSessionBased;
    update.isSessionBased = sessionBased;

    if (sessionBased) {
      update.sessions = sessions !== undefined ? Number(sessions) || 0 : existing.sessions;
      update.durationInDays = 0;
    } else {
      const unit = durationUnit ?? existing.durationUnit;
      const value = durationValue !== undefined ? Number(durationValue) : existing.durationValue;
      update.durationUnit = unit;
      update.durationValue = value;
      update.durationInDays = toDurationInDays(unit, value);
      update.sessions = 0;
    }

    const plan = await PTPlan.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ message: "PT plan updated successfully", plan });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ message: "A PT plan with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deletePTPlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const plan = await PTPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      res.status(404).json({ message: "PT plan not found" });
      return;
    }
    res.json({ message: "PT plan deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
