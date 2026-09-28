import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import {
  punchAttendance,
  getTodayAttendance,
  getAttendanceReport,
  getDashboardStats,
  getFinancialStats,
  addBackDatedAttendance,
  getMonthlyAttendanceCounts,
  getMemberAttendanceHistory,
  getMyAttendanceHistory,
} from "../controllers/attendance.controller.js";

const router = Router();

router.get("/my-history", authenticate, getMyAttendanceHistory);
// No permission group covers dashboard stats - open to any authenticated staff, same as admin.
router.get("/dashboard-stats", authenticate, getDashboardStats);
router.get("/financial-stats", authenticate, getFinancialStats);
router.get("/today", authenticate, requirePermission("attendance.mark"), getTodayAttendance);
router.get("/report", authenticate, requirePermission("reports.attendance"), getAttendanceReport);
router.get("/monthly-counts", authenticate, requirePermission("reports.attendance"), getMonthlyAttendanceCounts);
router.get("/member-history/:memberId", authenticate, requirePermission("reports.attendance"), getMemberAttendanceHistory);
router.post("/punch", authenticate, requirePermission("attendance.mark"), punchAttendance);
router.post("/back-dated", authenticate, requirePermission("attendance.mark"), addBackDatedAttendance);

export default router;
