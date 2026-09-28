import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware.js";
import { Expense, ExpenseCategory } from "../models/expense.model.js";

const DEFAULT_CATEGORIES = [
  "Rent/Mortgage",
  "Payroll/Salary",
  "Equipment",
  "Certification or Professional Fees",
  "Marketing Expenses",
  "Electricity Bills",
];

export const getExpenseCategories = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    let categories = await ExpenseCategory.find().sort({ createdAt: 1 });
    if (categories.length === 0) {
      await ExpenseCategory.insertMany(
        DEFAULT_CATEGORIES.map((name) => ({ name, isDefault: true }))
      );
      categories = await ExpenseCategory.find().sort({ createdAt: 1 });
    }
    res.json({ categories: categories.map((c) => c.name) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const createExpenseCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      res.status(400).json({ message: "Category name is required" });
      return;
    }
    const cleanName = name.trim();
    const existing = await ExpenseCategory.findOne({ name: { $regex: new RegExp(`^${cleanName}$`, "i") } });
    if (existing) {
      res.status(400).json({ message: "Category already exists" });
      return;
    }
    const category = await ExpenseCategory.create({ name: cleanName, isDefault: false });
    res.status(201).json({ message: "Category added", category: category.name });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const getExpenses = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { from, to, category, search } = req.query;

    const query: any = {};

    if (from || to) {
      query.date = {};
      if (from) query.date.$gte = new Date(String(from));
      if (to) {
        const toDate = new Date(String(to));
        toDate.setHours(23, 59, 59, 999);
        query.date.$lte = toDate;
      }
    }

    if (category && category !== "Type of expense" && category !== "all") {
      query.category = String(category);
    }

    if (search) {
      query.description = { $regex: String(search), $options: "i" };
    }

    const expenses = await Expense.find(query).sort({ date: -1 });
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    res.json({ expenses, totalAmount, count: expenses.length });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const createExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { category, description, amount, paymentMethod, date } = req.body;

    if (!category || !description || amount === undefined || amount === null) {
      res.status(400).json({ message: "Category, description, and amount are required" });
      return;
    }

    const expense = await Expense.create({
      category: String(category).trim(),
      description: String(description).trim(),
      amount: Number(amount),
      paymentMethod: paymentMethod || "Cash",
      date: date ? new Date(date) : new Date(),
      createdBy: req.userId || null,
    });

    res.status(201).json({ message: "Expense created successfully", expense });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await Expense.findByIdAndDelete(id);
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};
