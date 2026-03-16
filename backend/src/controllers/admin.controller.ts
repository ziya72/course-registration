import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class AdminController {
  /**
   * Add a new course (admin only)
   * POST /api/admin/courses
   */
  static async addCourse(req: Request, res: Response) {
    try {
      const {
        courseCode,
        courseName,
        credits,
        semesterNo,
        branchCode,
        isElective,
        isAdvanced,
        electiveGroup,
        courseType,
      } = req.body;

      // Validation
      if (!courseCode || !courseName || !credits || !semesterNo || !branchCode) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Check if course already exists
      const existing = await prisma.course.findUnique({
        where: { course_code: courseCode },
      });

      if (existing) {
        res.status(400).json({ error: "Course code already exists" });
        return;
      }

      const course = await prisma.course.create({
        data: {
          course_code: courseCode,
          course_name: courseName,
          credits: parseInt(credits),
          semester_no: parseInt(semesterNo),
          branch_code: branchCode,
          is_elective: isElective || false,
          is_advanced: isAdvanced || false,
          elective_group: electiveGroup || null,
          course_type: courseType || "Theory",
        },
      });

      res.status(201).json({
        message: "Course added successfully",
        course: {
          courseCode: course.course_code,
          courseName: course.course_name,
          credits: course.credits,
          isAdvanced: course.is_advanced,
        },
      });
    } catch (error) {
      console.error("Error adding course:", error);
      res.status(500).json({ error: "Failed to add course" });
    }
  }
  /**
   * Check if course exists (for real-time validation)
   * GET /api/teacher/courses/check
   */
  static async checkCourseExists(req: Request, res: Response) {
    try {
      const { courseCode, courseName } = req.query;

      if (!courseCode && !courseName) {
        res.status(400).json({ error: "Provide courseCode or courseName" });
        return;
      }

      const checks: any = {};

      // Check course code (case-insensitive)
      if (courseCode) {
        const codeExists = await prisma.course.findFirst({
          where: {
            course_code: {
              equals: String(courseCode),
              mode: 'insensitive',
            },
          },
          select: {
            course_code: true,
            course_name: true,
          },
        });
        checks.courseCodeExists = !!codeExists;
        if (codeExists) {
          checks.existingCourseCode = codeExists;
        }
      }

      // Check course name (case-insensitive)
      if (courseName) {
        const nameExists = await prisma.course.findFirst({
          where: {
            course_name: {
              equals: String(courseName),
              mode: 'insensitive',
            },
          },
          select: {
            course_code: true,
            course_name: true,
          },
        });
        checks.courseNameExists = !!nameExists;
        if (nameExists) {
          checks.existingCourseName = nameExists;
        }
      }

      res.json(checks);
    } catch (error) {
      console.error("Error checking course existence:", error);
      res.status(500).json({ error: "Failed to check course existence" });
    }
  }

  /**
   * Update a course (admin only)
   * PUT /api/admin/courses/:courseCode
   */
  static async updateCourse(req: Request, res: Response) {
    try {
      const courseCode = req.params.courseCode as string;
      const {
        courseName,
        credits,
        semesterNo,
        branchCode,
        isElective,
        electiveGroup,
        courseType,
      } = req.body;

      const updateData: any = {};
      if (courseName) updateData.course_name = courseName;
      if (credits) updateData.credits = parseInt(credits);
      if (semesterNo) updateData.semester_no = parseInt(semesterNo);
      if (branchCode) updateData.branch_code = branchCode;
      if (isElective !== undefined) updateData.is_elective = isElective;
      if (electiveGroup !== undefined) updateData.elective_group = electiveGroup;
      if (courseType) updateData.course_type = courseType;

      const course = await prisma.course.update({
        where: { course_code: courseCode },
        data: updateData,
      });

      res.json({
        message: "Course updated successfully",
        course: {
          courseCode: course.course_code,
          courseName: course.course_name,
          credits: course.credits,
        },
      });
    } catch (error) {
      console.error("Error updating course:", error);
      res.status(500).json({ error: "Failed to update course" });
    }
  }

  /**
   * Delete a course (admin only)
   * DELETE /api/admin/courses/:courseCode
   */
  static async deleteCourse(req: Request, res: Response) {
    try {
      const courseCode = req.params.courseCode as string;

      // Check if course has registrations
      const registrations = await prisma.courseRegistration.count({
        where: { course_code: courseCode },
      });

      if (registrations > 0) {
        res.status(400).json({
          error: "Cannot delete course with existing registrations",
          registrations,
        });
        return;
      }

      // Delete prerequisites first
      await prisma.coursePrerequisite.deleteMany({
        where: {
          OR: [
            { course_code: courseCode },
            { prerequisite_course_code: courseCode },
          ],
        },
      });

      // Delete course
      await prisma.course.delete({
        where: { course_code: courseCode },
      });

      res.json({
        message: "Course deleted successfully",
        courseCode,
      });
    } catch (error) {
      console.error("Error deleting course:", error);
      res.status(500).json({ error: "Failed to delete course" });
    }
  }

  /**
   * Add prerequisite to a course (admin only)
   * POST /api/admin/courses/:courseCode/prerequisites
   */
  static async addPrerequisite(req: Request, res: Response) {
    try {
      const courseCode = req.params.courseCode as string;
      const { prerequisiteCourseCode, minGrade } = req.body;

      if (!prerequisiteCourseCode || !minGrade) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      // Validate courses exist
      const course = await prisma.course.findUnique({
        where: { course_code: courseCode },
      });
      const prerequisite = await prisma.course.findUnique({
        where: { course_code: prerequisiteCourseCode },
      });

      if (!course || !prerequisite) {
        res.status(404).json({ error: "Course not found" });
        return;
      }

      // Check if prerequisite already exists
      const existing = await prisma.coursePrerequisite.findFirst({
        where: {
          course_code: courseCode,
          prerequisite_course_code: prerequisiteCourseCode,
        },
      });

      if (existing) {
        res.status(400).json({ error: "Prerequisite already exists" });
        return;
      }

      const prereq = await prisma.coursePrerequisite.create({
        data: {
          course_code: courseCode,
          prerequisite_course_code: prerequisiteCourseCode,
          min_grade: minGrade,
        },
      });

      res.status(201).json({
        message: "Prerequisite added successfully",
        prerequisite: {
          courseCode: prereq.course_code,
          prerequisiteCourseCode: prereq.prerequisite_course_code,
          minGrade: prereq.min_grade,
        },
      });
    } catch (error) {
      console.error("Error adding prerequisite:", error);
      res.status(500).json({ error: "Failed to add prerequisite" });
    }
  }

  /**
   * Update prerequisite (admin only)
   * PUT /api/admin/courses/:courseCode/prerequisites/:prerequisiteCode
   */
  static async updatePrerequisite(req: Request, res: Response) {
    try {
      const courseCode = req.params.courseCode as string;
      const prerequisiteCode = req.params.prerequisiteCode as string;
      const { minGrade } = req.body;

      if (!minGrade) {
        res.status(400).json({ error: "minGrade is required" });
        return;
      }

      // Find the prerequisite
      const existing = await prisma.coursePrerequisite.findFirst({
        where: {
          course_code: courseCode,
          prerequisite_course_code: prerequisiteCode,
        },
      });

      if (!existing) {
        res.status(404).json({ error: "Prerequisite not found" });
        return;
      }

      const prereq = await prisma.coursePrerequisite.update({
        where: { prerequisite_id: existing.prerequisite_id },
        data: { min_grade: minGrade },
      });

      res.json({
        message: "Prerequisite updated successfully",
        prerequisite: {
          courseCode: prereq.course_code,
          prerequisiteCourseCode: prereq.prerequisite_course_code,
          minGrade: prereq.min_grade,
        },
      });
    } catch (error) {
      console.error("Error updating prerequisite:", error);
      res.status(500).json({ error: "Failed to update prerequisite" });
    }
  }

  /**
   * Delete prerequisite (admin only)
   * DELETE /api/admin/courses/:courseCode/prerequisites/:prerequisiteCode
   */
  static async deletePrerequisite(req: Request, res: Response) {
    try {
      const courseCode = req.params.courseCode as string;
      const prerequisiteCode = req.params.prerequisiteCode as string;

      const existing = await prisma.coursePrerequisite.findFirst({
        where: {
          course_code: courseCode,
          prerequisite_course_code: prerequisiteCode,
        },
      });

      if (!existing) {
        res.status(404).json({ error: "Prerequisite not found" });
        return;
      }

      await prisma.coursePrerequisite.delete({
        where: { prerequisite_id: existing.prerequisite_id },
      });

      res.json({
        message: "Prerequisite deleted successfully",
        courseCode,
        prerequisiteCode,
      });
    } catch (error) {
      console.error("Error deleting prerequisite:", error);
      res.status(500).json({ error: "Failed to delete prerequisite" });
    }
  }

  /**
   * Get all registration rules
   * GET /api/admin/rules
   */
  static async getRules(req: Request, res: Response) {
    try {
      const rules = await prisma.registrationRule.findMany({
        orderBy: { rule_name: "asc" },
      });

      res.json({
        rules: rules.map((rule) => ({
          id: rule.rule_id,
          name: rule.rule_name,
          type: rule.rule_type,
          value: rule.rule_value,
          isActive: rule.is_active,
        })),
        total: rules.length,
      });
    } catch (error) {
      console.error("Error fetching rules:", error);
      res.status(500).json({ error: "Failed to fetch rules" });
    }
  }

  /**
   * Update registration rule (admin only)
   * PUT /api/admin/rules/:ruleId
   */
  static async updateRule(req: Request, res: Response) {
    try {
      const ruleId = parseInt(req.params.ruleId as string);
      const { value, isActive } = req.body;

      const updateData: any = {};
      if (value !== undefined) updateData.rule_value = value;
      if (isActive !== undefined) updateData.is_active = isActive;

      const rule = await prisma.registrationRule.update({
        where: { rule_id: ruleId },
        data: updateData,
      });

      res.json({
        message: "Rule updated successfully",
        rule: {
          id: rule.rule_id,
          name: rule.rule_name,
          value: rule.rule_value,
          isActive: rule.is_active,
        },
      });
    } catch (error) {
      console.error("Error updating rule:", error);
      res.status(500).json({ error: "Failed to update rule" });
    }
  }

  /**
   * Toggle registration window (admin only)
   * POST /api/teacher/registration/toggle
   */
  static async toggleRegistration(req: Request, res: Response) {
    try {
      const { enabled } = req.body;

      if (enabled === undefined) {
        res.status(400).json({ error: "enabled field is required" });
        return;
      }

      // Find the REGISTRATION_OPEN rule
      const rule = await prisma.registrationRule.findFirst({
        where: { rule_name: "REGISTRATION_OPEN" },
      });

      if (!rule) {
        res.status(404).json({ error: "Registration rule not found" });
        return;
      }

      // Update the rule
      await prisma.registrationRule.update({
        where: { rule_id: rule.rule_id },
        data: { is_active: enabled },
      });

      res.json({
        message: `Registration ${enabled ? "enabled" : "disabled"} successfully`,
        enabled,
      });
    } catch (error) {
      console.error("Error toggling registration:", error);
      res.status(500).json({ error: "Failed to toggle registration" });
    }
  }
}
