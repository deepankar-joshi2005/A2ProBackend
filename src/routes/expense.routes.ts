import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import {
  getExpenseCategories,
  createExpenseCategory,
  getExpenses,
  createExpense,
  deleteExpense,
} from "../controllers/expense.controller.js";

const router = Router();

router.get("/categories", authenticate, requirePermission("expenses.view"), getExpenseCategories);
router.post("/categories", authenticate, requirePermission("expenses.add"), createExpenseCategory);

router.get("/", authenticate, requirePermission("expenses.view"), getExpenses);
router.post("/", authenticate, requirePermission("expenses.add"), createExpense);
router.delete("/:id", authenticate, requirePermission("expenses.delete"), deleteExpense);

export default router;
