import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class RegistrationControlController {
  /**
   * Get all registration phases for current semester
   * GET /api/teacher/registration-control/phases
   */
  static async getPhases(req: Request, res: Response) {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const semesterType = currentMonth >= 7 ? 1 : 2; // Odd semester starts in July

      const phases = await prisma.registrationPhase.findMany({
        where: {
          academic_year: currentYear,
          semester_type: semesterType,
        },
        orderBy: {
          phase_id: 'asc',
        },
      });

      // If no phases exist, create default ones
      if (phases.length === 0) {
        const defaultPhases = [
          { phase_name: "REGULAR", phase_label: "Regular Registration" },
          { phase_name: "LATE", phase_label: "Late Registration" },
          { phase_name: "ADD_DROP", phase_label: "Add/Drop" },
          { phase_name: "WITHDRAWAL", phase_label: "Withdrawal (W grade)" },
          { phase_name: "FREEZE", phase_label: "Final Lock" },
        ];

        for (const phase of defaultPhases) {
          await prisma.registrationPhase.create({
            data: {
              ...phase,
              academic_year: currentYear,
              semester_type: semesterType,
            },
          });
        }

        const newPhases = await prisma.registrationPhase.findMany({
          where: {
            academic_year: currentYear,
            semester_type: semesterType,
          },
          orderBy: {
            phase_id: 'asc',
          },
        });

        res.json({ phases: newPhases });
        return;
      }

      res.json({ phases });
    } catch (error) {
      console.error("Error fetching phases:", error);
      res.status(500).json({ error: "Failed to fetch registration phases" });
    }
  }

  /**
   * Update a registration phase
   * PUT /api/teacher/registration-control/phases/:phaseId
   */
  static async updatePhase(req: Request, res: Response) {
    try {
      const { phaseId } = req.params;
      const { start_date, end_date, is_enabled } = req.body;

      const updateData: any = {};
      
      if (start_date !== undefined) {
        updateData.start_date = start_date ? new Date(start_date) : null;
      }
      
      if (end_date !== undefined) {
        updateData.end_date = end_date ? new Date(end_date) : null;
      }
      
      if (is_enabled !== undefined) {
        updateData.is_enabled = is_enabled;
      }

      // Check if dates are valid
      if (updateData.start_date && updateData.end_date) {
        if (updateData.start_date >= updateData.end_date) {
          res.status(400).json({ error: "Start date must be before end date" });
          return;
        }
      }

      const phase = await prisma.registrationPhase.update({
        where: { phase_id: parseInt(phaseId) },
        data: updateData,
      });

      res.json({ 
        message: "Phase updated successfully",
        phase 
      });
    } catch (error) {
      console.error("Error updating phase:", error);
      res.status(500).json({ error: "Failed to update phase" });
    }
  }

  /**
   * Get current active phase
   * GET /api/teacher/registration-control/current-phase
   */
  static async getCurrentPhase(req: Request, res: Response) {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const semesterType = currentMonth >= 7 ? 1 : 2;

      const phases = await prisma.registrationPhase.findMany({
        where: {
          academic_year: currentYear,
          semester_type: semesterType,
          is_enabled: true,
          start_date: { lte: now },
          end_date: { gte: now },
        },
        orderBy: {
          phase_id: 'asc',
        },
      });

      const currentPhase = phases.length > 0 ? phases[0] : null;

      res.json({ 
        currentPhase,
        isOpen: currentPhase !== null,
      });
    } catch (error) {
      console.error("Error fetching current phase:", error);
      res.status(500).json({ error: "Failed to fetch current phase" });
    }
  }

  /**
   * Activate/Deactivate a phase manually
   * POST /api/teacher/registration-control/phases/:phaseId/toggle
   */
  static async togglePhase(req: Request, res: Response) {
    try {
      const { phaseId } = req.params;
      const { is_active } = req.body;

      if (is_active === undefined) {
        res.status(400).json({ error: "is_active field is required" });
        return;
      }

      const phase = await prisma.registrationPhase.update({
        where: { phase_id: parseInt(phaseId) },
        data: { is_active },
      });

      res.json({ 
        message: `Phase ${is_active ? 'activated' : 'deactivated'} successfully`,
        phase 
      });
    } catch (error) {
      console.error("Error toggling phase:", error);
      res.status(500).json({ error: "Failed to toggle phase" });
    }
  }

  /**
   * Bulk update all phases
   * POST /api/teacher/registration-control/phases/bulk-update
   */
  static async bulkUpdatePhases(req: Request, res: Response) {
    try {
      const { phases } = req.body;

      if (!Array.isArray(phases)) {
        res.status(400).json({ error: "phases must be an array" });
        return;
      }

      const updates = phases.map((phase: any) => {
        const updateData: any = {
          is_enabled: phase.is_enabled,
        };

        if (phase.start_date) {
          updateData.start_date = new Date(phase.start_date);
        }

        if (phase.end_date) {
          updateData.end_date = new Date(phase.end_date);
        }

        return prisma.registrationPhase.update({
          where: { phase_id: phase.phase_id },
          data: updateData,
        });
      });

      await Promise.all(updates);

      res.json({ message: "Phases updated successfully" });
    } catch (error) {
      console.error("Error bulk updating phases:", error);
      res.status(500).json({ error: "Failed to update phases" });
    }
  }
}
