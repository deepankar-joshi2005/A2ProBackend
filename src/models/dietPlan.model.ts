import mongoose, { Document, Schema } from "mongoose";

export interface IDietMeal {
  name: string;
  quantity: string;
  calories: string;
  notes: string;
}

export interface IDietDay {
  title: string;
  meals: IDietMeal[];
}

export interface IDietPlan extends Document {
  name: string;
  days: IDietDay[];
  notes: string;
  isActive: boolean;
  createdAt: Date;
}

const dietMealSchema = new Schema<IDietMeal>(
  {
    name: { type: String, default: "" },
    quantity: { type: String, default: "" },
    calories: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const dietDaySchema = new Schema<IDietDay>(
  {
    title: { type: String, default: "" },
    meals: { type: [dietMealSchema], default: [] },
  },
  { _id: false }
);

const dietPlanSchema = new Schema<IDietPlan>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    days: { type: [dietDaySchema], default: [] },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IDietPlan>("DietPlan", dietPlanSchema);
