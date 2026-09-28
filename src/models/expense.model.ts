import mongoose, { Document, Schema, Types } from "mongoose";

export interface IExpenseCategory extends Document {
  name: string;
  isDefault: boolean;
  createdAt: Date;
}

const expenseCategorySchema = new Schema<IExpenseCategory>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ExpenseCategory = mongoose.model<IExpenseCategory>("ExpenseCategory", expenseCategorySchema);

export interface IExpense extends Document {
  category: string;
  description: string;
  amount: number;
  date: Date;
  paymentMethod: "Cash" | "Card" | "UPI" | "Bank Transfer" | "Other";
  createdBy: Types.ObjectId | null;
  createdAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "UPI", "Bank Transfer", "Other"],
      default: "Cash",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

export const Expense = mongoose.model<IExpense>("Expense", expenseSchema);
