import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listWorkoutPlans,
  createWorkoutPlan,
  updateWorkoutPlan,
  deleteWorkoutPlan,
} from "../controllers/workoutPlan.controller.js";

const router = Router();

// No permission group covers workout plans - open to any authenticated staff, same as admin.
router.get("/", authenticate, listWorkoutPlans);
router.post("/", authenticate, createWorkoutPlan);
router.patch("/:id", authenticate, updateWorkoutPlan);
router.delete("/:id", authenticate, deleteWorkoutPlan);

export default router;
