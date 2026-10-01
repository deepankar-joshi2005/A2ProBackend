import { Router } from "express";
import { authenticate, requirePermission } from "../middleware/auth.middleware.js";
import { uploadMemberPhoto } from "../config/upload.js";
import { uploadMemberDocument } from "../config/memberDocumentUpload.js";
import {
  listMembers,
  getMemberById,
  createMember,
  deleteMember,
  getNextMembershipId,
  checkMembershipIdAvailability,
  createMemberAccount,
  renewMemberPlan,
  getMyProfile,
  clearMemberPlan,
  toggleFreezeMember,
  toggleBlockMember,
  assignMemberBatch,
  updateMemberPhoto,
} from "../controllers/member.controller.js";
import { listPayments, addPayment, deletePayment } from "../controllers/payment.controller.js";
import { listMeasurements, addMeasurement, deleteMeasurement } from "../controllers/measurement.controller.js";
import { listMemberDocuments, uploadMemberDoc, deleteMemberDocument } from "../controllers/memberDocument.controller.js";
import {
  listMemberPTPlans,
  assignMemberPTPlan,
  toggleFreezeMemberPTPlan,
  deleteMemberPTPlan,
} from "../controllers/memberPtPlan.controller.js";
import {
  listMemberWorkoutPlans,
  assignMemberWorkoutPlan,
  deleteMemberWorkoutPlan,
} from "../controllers/memberWorkoutPlan.controller.js";
import {
  listMemberDietPlans,
  assignMemberDietPlan,
  deleteMemberDietPlan,
} from "../controllers/memberDietPlan.controller.js";

const router = Router();

router.get("/me", authenticate, getMyProfile);
router.get("/next-id", authenticate, requirePermission("members.add"), getNextMembershipId);
router.get("/check-membership-id", authenticate, requirePermission("members.add"), checkMembershipIdAvailability);
router.get("/", authenticate, requirePermission("members.view"), listMembers);
router.get("/:id", authenticate, requirePermission("members.view"), getMemberById);
router.post("/", authenticate, requirePermission("members.add"), uploadMemberPhoto, createMember);
router.delete("/:id", authenticate, requirePermission("members.delete"), deleteMember);
router.post("/:id/create-account", authenticate, requirePermission("memberships.edit"), createMemberAccount);
router.post("/:id/renew-plan", authenticate, requirePermission("memberships.edit"), renewMemberPlan);
router.delete("/:id/plan", authenticate, requirePermission("memberships.delete"), clearMemberPlan);
router.patch("/:id/freeze", authenticate, requirePermission("memberships.freeze"), toggleFreezeMember);
router.patch("/:id/block", authenticate, requirePermission("members.edit"), toggleBlockMember);
router.patch("/:id/batch", authenticate, requirePermission("memberships.edit"), assignMemberBatch);
router.patch("/:id/photo", authenticate, requirePermission("members.edit"), uploadMemberPhoto, updateMemberPhoto);

// Payments
router.get("/:id/payments", authenticate, requirePermission("memberships.view"), listPayments);
router.post("/:id/payments", authenticate, requirePermission("memberships.edit"), addPayment);
router.delete("/:id/payments/:paymentId", authenticate, requirePermission("memberships.delete"), deletePayment);

// Measurements
router.get("/:id/measurements", authenticate, requirePermission("members.edit"), listMeasurements);
router.post("/:id/measurements", authenticate, requirePermission("members.edit"), addMeasurement);
router.delete("/:id/measurements/:measurementId", authenticate, requirePermission("members.edit"), deleteMeasurement);

// Documents
router.get("/:id/documents", authenticate, requirePermission("members.edit"), listMemberDocuments);
router.post("/:id/documents", authenticate, requirePermission("members.edit"), uploadMemberDocument, uploadMemberDoc);
router.delete("/:id/documents/:documentId", authenticate, requirePermission("members.edit"), deleteMemberDocument);

// Per-member PT plan assignment
router.get("/:id/pt-plans", authenticate, requirePermission("ptPlans.view"), listMemberPTPlans);
router.post("/:id/pt-plans", authenticate, requirePermission("ptPlans.add"), assignMemberPTPlan);
router.patch("/:id/pt-plans/:planAssignmentId/freeze", authenticate, requirePermission("ptPlans.freeze"), toggleFreezeMemberPTPlan);
router.delete("/:id/pt-plans/:planAssignmentId", authenticate, requirePermission("ptPlans.delete"), deleteMemberPTPlan);

// Per-member workout/diet plan assignment - no permission group covers these,
// open to any authenticated staff, same as admin.
router.get("/:id/workout-plans", authenticate, listMemberWorkoutPlans);
router.post("/:id/workout-plans", authenticate, assignMemberWorkoutPlan);
router.delete("/:id/workout-plans/:planAssignmentId", authenticate, deleteMemberWorkoutPlan);

router.get("/:id/diet-plans", authenticate, listMemberDietPlans);
router.post("/:id/diet-plans", authenticate, assignMemberDietPlan);
router.delete("/:id/diet-plans/:planAssignmentId", authenticate, deleteMemberDietPlan);

export default router;
