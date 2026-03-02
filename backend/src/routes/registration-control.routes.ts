import { Router } from "express";
import { RegistrationControlController } from "../controllers/registration-control.controller";
import { authenticate, adminOnly } from "../middlewares/auth.middleware";

const router = Router();

// Get all phases
router.get("/phases", authenticate, adminOnly, RegistrationControlController.getPhases);

// Get current active phase
router.get("/current-phase", authenticate, RegistrationControlController.getCurrentPhase);

// Update a specific phase
router.put("/phases/:phaseId", authenticate, adminOnly, RegistrationControlController.updatePhase);

// Toggle phase active status
router.post("/phases/:phaseId/toggle", authenticate, adminOnly, RegistrationControlController.togglePhase);

// Bulk update phases
router.post("/phases/bulk-update", authenticate, adminOnly, RegistrationControlController.bulkUpdatePhases);

export default router;
