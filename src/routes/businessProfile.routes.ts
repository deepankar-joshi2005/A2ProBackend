import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getBusinessProfile, saveBusinessProfile } from "../controllers/businessProfile.controller.js";

const router = Router();

// No permission group covers business profile - open to any authenticated staff, same as admin.
router.get("/", authenticate, getBusinessProfile);
router.put("/", authenticate, saveBusinessProfile);

export default router;
