import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import {
  listServicePlans,
  createServicePlan,
  updateServicePlan,
  deleteServicePlan,
} from "../controllers/servicePlan.controller.js";

const router = Router();

router.get("/", authenticate, listServicePlans);
router.post("/", authenticate, requirePermission("services.add"), createServicePlan);
router.patch("/:id", authenticate, requirePermission("services.edit"), updateServicePlan);
router.delete("/:id", authenticate, requirePermission("services.delete"), deleteServicePlan);

export default router;
