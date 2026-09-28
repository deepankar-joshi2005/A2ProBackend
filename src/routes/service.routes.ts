import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { getGymServices, createGymService, deleteGymService } from "../controllers/service.controller.js";

const router = Router();

router.get("/", authenticate, requirePermission("services.view"), getGymServices);
router.post("/", authenticate, requirePermission("services.add"), createGymService);
router.delete("/:id", authenticate, requirePermission("services.delete"), deleteGymService);

export default router;
