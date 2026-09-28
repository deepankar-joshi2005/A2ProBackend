import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import Payment from "../models/payment.model.js";
import Member from "../models/member.model.js";

export const listPayments = async (req: AuthRequest, res: Response): Promise<void> => {
  const payments = await Payment.find({ memberId: String(req.params.id) }).sort({ date: -1 });
  res.json({ payments });
};

export const addPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) {
      res.status(404).json({ message: "Member not found" });
      return;
    }
    const amount = Number(req.body.amount);
    if (!amount || amount <= 0) {
      res.status(400).json({ message: "Enter a valid amount" });
      return;
    }
    if (amount > member.dueAmount) {
      res.status(400).json({ message: `Amount can't exceed the due amount of ${member.dueAmount}` });
      return;
    }
    const method = req.body.method || "Cash";
    const date = req.body.date ? new Date(req.body.date) : new Date();

    const count = await Payment.countDocuments({ memberId: member._id });
    const invoiceNumber = `${count + 1}-FIT-${date.getFullYear()}`;

    const payment = await Payment.create({
      memberId: member._id,
      amount,
      method,
      date,
      invoiceNumber,
      createdBy: req.userId || null,
    });

    member.paidAmount = (member.paidAmount || 0) + amount;
    member.dueAmount = Math.max(0, member.dueAmount - amount);
    member.paymentDate = date;
    member.paymentMethod = method;
    await member.save();

    res.status(201).json({ payment, member });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deletePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const payment = await Payment.findOne({ _id: req.params.paymentId, memberId: req.params.id });
    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
      return;
    }
    const member = await Member.findById(req.params.id);
    if (member) {
      member.paidAmount = Math.max(0, (member.paidAmount || 0) - payment.amount);
      member.dueAmount = member.dueAmount + payment.amount;
      await member.save();
    }
    await payment.deleteOne();
    res.json({ message: "Payment removed", member });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
