import mongoose, { Document, Schema } from "mongoose";

export interface IWorkoutExercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  notes: string;
}

export interface IWorkoutDay {
  title: string;
  exercises: IWorkoutExercise[];
}

export interface IWorkoutPlan extends Document {
  name: string;
  days: IWorkoutDay[];
  notes: string;
  isActive: boolean;
  createdAt: Date;
}

const workoutExerciseSchema = new Schema<IWorkoutExercise>(
  {
    name: { type: String, default: "" },
    sets: { type: String, default: "" },
    reps: { type: String, default: "" },
    rest: { type: String, default: "" },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const workoutDaySchema = new Schema<IWorkoutDay>(
  {
    title: { type: String, default: "" },
    exercises: { type: [workoutExerciseSchema], default: [] },
  },
  { _id: false }
);

const workoutPlanSchema = new Schema<IWorkoutPlan>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    days: { type: [workoutDaySchema], default: [] },
    notes: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model<IWorkoutPlan>("WorkoutPlan", workoutPlanSchema);
