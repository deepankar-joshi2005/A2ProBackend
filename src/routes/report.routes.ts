import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { getTrends, getCollectionSummary, getPlanDue, getSales, getAdmissionReport } from "../controllers/report.controller.js";

const router = Router();

router.get("/trends", authenticate, requirePermission("reports.trends"), getTrends);
router.get("/collection", authenticate, requirePermission("reports.collection"), getCollectionSummary);
// No permission group covers these - open to any authenticated staff, same as admin.
router.get("/plan-due", authenticate, getPlanDue);
router.get("/sales", authenticate, getSales);
router.get("/admission", authenticate, getAdmissionReport);

export default router;
