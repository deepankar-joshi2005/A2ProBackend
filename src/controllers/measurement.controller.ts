import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import Measurement from "../models/measurement.model.js";

const FIELDS = [
  "height", "weight", "chest", "waist", "hips", "leftThigh", "rightThigh",
  "leftArm", "rightArm", "age", "neck", "leftCalf", "rightCalf", "bodyFatPercent",
] as const;

export const listMeasurements = async (req: AuthRequest, res: Response): Promise<void> => {
  const measurements = await Measurement.find({ memberId: String(req.params.id) }).sort({ date: -1 });
  res.json({ measurements });
};

export const addMeasurement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const b = req.body;
    const data: any = {
      memberId: req.params.id,
      date: b.date ? new Date(b.date) : new Date(),
      createdBy: req.userId || null,
    };
    for (const field of FIELDS) {
      data[field] = b[field] !== undefined && b[field] !== "" ? Number(b[field]) : null;
    }
    const measurement = await Measurement.create(data);
    res.status(201).json({ measurement });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteMeasurement = async (req: AuthRequest, res: Response): Promise<void> => {
  const measurement = await Measurement.findOne({ _id: req.params.measurementId, memberId: req.params.id });
  if (!measurement) {
    res.status(404).json({ message: "Measurement not found" });
    return;
  }
  await measurement.deleteOne();
  res.json({ message: "Measurement removed" });
};
