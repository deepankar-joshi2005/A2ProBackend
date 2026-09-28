import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  listDietPlans,
  createDietPlan,
  updateDietPlan,
  deleteDietPlan,
} from "../controllers/dietPlan.controller.js";

const router = Router();

// No permission group covers diet plans - open to any authenticated staff, same as admin.
router.get("/", authenticate, listDietPlans);
router.post("/", authenticate, createDietPlan);
router.patch("/:id", authenticate, updateDietPlan);
router.delete("/:id", authenticate, deleteDietPlan);

export default router;
