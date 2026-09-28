import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { listPlans, createPlan, updatePlan, deletePlan } from "../controllers/plan.controller.js";

const router = Router();

router.get("/", authenticate, listPlans);
router.post("/", authenticate, requirePermission("gymSetup.membershipPlans.add"), createPlan);
router.patch("/:id", authenticate, requirePermission("gymSetup.membershipPlans.edit"), updatePlan);
router.delete("/:id", authenticate, requirePermission("gymSetup.membershipPlans.delete"), deletePlan);

export default router;
