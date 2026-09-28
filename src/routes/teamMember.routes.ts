import { Router } from "express";
import { authenticate, requireAdmin } from "../middleware/auth.middleware.js";
import {
  listTeamMembers,
  listPublicTrainers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from "../controllers/teamMember.controller.js";

const router = Router();

// Public (any authenticated user) — for member portal
router.get("/trainers", authenticate, listPublicTrainers);

// Admin only
router.get("/", authenticate, requireAdmin, listTeamMembers);
router.post("/", authenticate, requireAdmin, createTeamMember);
router.patch("/:id", authenticate, requireAdmin, updateTeamMember);
router.delete("/:id", authenticate, requireAdmin, deleteTeamMember);

export default router;
