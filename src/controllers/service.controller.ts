import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { GymService } from "../models/service.model.js";

export const getGymServices = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to, type, search, memberId } = req.query;

    const query: any = {};

    if (memberId) {
      query.memberId = String(memberId);
    }

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(String(from));
      if (to) {
        const toDate = new Date(String(to));
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    if (type === "due") {
      query.dueAmount = { $gt: 0 };
    } else if (type === "paid") {
      query.paidAmount = { $gt: 0 };
    }

    const services = await GymService.find(query).populate("memberId").sort({ date: -1 });

    let filtered = services;
    if (search) {
      const q = String(search).toLowerCase();
      filtered = services.filter((s: any) => {
        const m = s.memberId;
        const nameMatch = m?.name?.toLowerCase().includes(q);
        const mobileMatch = m?.mobile?.includes(q);
        const serviceMatch = s.serviceName?.toLowerCase().includes(q);
        return nameMatch || mobileMatch || serviceMatch;
      });
    }

    const totalPaid = filtered.reduce((sum, s) => sum + (s.paidAmount || 0), 0);
    const totalDue = filtered.reduce((sum, s) => sum + (s.dueAmount || 0), 0);

    res.json({ services: filtered, totalPaid, totalDue, count: filtered.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const createGymService = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId, serviceName, paidAmount, dueAmount, paymentMethod, date, notes } = req.body;

    if (!memberId || !serviceName) {
      res.status(400).json({ message: "memberId and serviceName are required" });
      return;
    }

    const service = await GymService.create({
      memberId,
      serviceName: String(serviceName).trim(),
      paidAmount: Number(paidAmount) || 0,
      dueAmount: Number(dueAmount) || 0,
      paymentMethod: paymentMethod || "Cash",
      date: date ? new Date(date) : new Date(),
      notes: notes || "",
      createdBy: req.userId || null,
    });

    res.status(201).json({ message: "Service added successfully", service });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteGymService = async (req: AuthRequest, res: Response): Promise<void> => {
  const service = await GymService.findById(req.params.id);
  if (!service) {
    res.status(404).json({ message: "Service not found" });
    return;
  }
  await service.deleteOne();
  res.json({ message: "Service removed" });
};
