import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { listBatches, createBatch, updateBatch, deleteBatch } from "../controllers/batch.controller.js";

const router = Router();

// No permission group covers batches - open to any authenticated staff, same as admin.
router.get("/", authenticate, listBatches);
router.post("/", authenticate, createBatch);
router.patch("/:id", authenticate, updateBatch);
router.delete("/:id", authenticate, deleteBatch);

export default router;
