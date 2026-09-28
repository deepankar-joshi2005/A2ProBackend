import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { listPTPlans, createPTPlan, updatePTPlan, deletePTPlan } from "../controllers/ptPlan.controller.js";

const router = Router();

router.get("/", authenticate, listPTPlans);
router.post("/", authenticate, requirePermission("ptPlans.add"), createPTPlan);
router.patch("/:id", authenticate, requirePermission("ptPlans.edit"), updatePTPlan);
router.delete("/:id", authenticate, requirePermission("ptPlans.delete"), deletePTPlan);

export default router;
