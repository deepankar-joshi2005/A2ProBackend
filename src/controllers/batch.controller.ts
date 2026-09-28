import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import Batch from "../models/batch.model.js";

export const listBatches = async (req: AuthRequest, res: Response): Promise<void> => {
  const includeInactive = String(req.query.all) === "true";
  const filter = includeInactive ? {} : { isActive: true };
  const batches = await Batch.find(filter).sort({ name: 1 });
  res.json({ batches });
};

export const createBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, limit, openTime, closeTime } = req.body;

    if (!name || limit === undefined) {
      res.status(400).json({ message: "name and limit are required" });
      return;
    }

    const batch = await Batch.create({
      name: String(name).trim(),
      limit: Number(limit),
      openTime: openTime || "",
      closeTime: closeTime || "",
    });

    res.status(201).json({ message: "Batch created successfully", batch });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ message: "A batch with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const updateBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, limit, openTime, closeTime, isActive } = req.body;

    const update: any = {};
    if (name !== undefined) update.name = String(name).trim();
    if (limit !== undefined) update.limit = Number(limit);
    if (openTime !== undefined) update.openTime = openTime;
    if (closeTime !== undefined) update.closeTime = closeTime;
    if (isActive !== undefined) update.isActive = Boolean(isActive);

    const batch = await Batch.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!batch) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }

    res.json({ message: "Batch updated successfully", batch });
  } catch (err: any) {
    if (err?.code === 11000) {
      res.status(409).json({ message: "A batch with this name already exists" });
      return;
    }
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteBatch = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const batch = await Batch.findByIdAndDelete(req.params.id);
    if (!batch) {
      res.status(404).json({ message: "Batch not found" });
      return;
    }
    res.json({ message: "Batch deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
