import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import ServicePlan from "../models/servicePlan.model.js";

export const listServicePlans = async (req: AuthRequest, res: Response): Promise<void> => {
  const includeInactive = String(req.query.all) === "true";
  const filter = includeInactive ? {} : { isActive: true };
  const services = await ServicePlan.find(filter).sort({ name: 1 });
  res.json({ services });
};

export const createServicePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, amount } = req.body;

    if (!name || amount === undefined) {
      res.status(400).json({ message: "name and amount are required" });
      return;
    }

    const service = await ServicePlan.create({
      name: String(name).trim(),
      amount: Number(amount),
    });

    res.status(201).json({ message: "Service created successfully", service });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ message: "A service with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updateServicePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, amount, isActive } = req.body;

    const update: any = {};
    if (name !== undefined) update.name = String(name).trim();
    if (amount !== undefined) update.amount = Number(amount);
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const service = await ServicePlan.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!service) {
      res.status(404).json({ message: "Service not found" });
      return;
    }

    res.json({ message: "Service updated successfully", service });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ message: "A service with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteServicePlan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const service = await ServicePlan.findByIdAndDelete(req.params.id);
    if (!service) {
      res.status(404).json({ message: "Service not found" });
      return;
    }
    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
