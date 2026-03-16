import { PrismaClient } from "@prisma/client";
import { getPreviousAttempts } from "./attempt-tracking.service";

const prisma = new PrismaClient();

export interface ModeValidationResult {
  valid: boolean;
  allowedModes: string[];
  message?: string;
  reason?: string;
}

/**
 * Validate registration mode based on attempt type and history
 */
export async function validateRegistrationMode(
  enrollmentNo: string,
  courseCode: string,
  requestedMode: string,
  attemptType: string
): Promise<ModeValidationResult> {
  try {
    console.log(`🔍 Validating mode: ${requestedMode} for ${attemptType} attempt`);

    // Get previous attempts
    const previousAttempts = await getPreviousAttempts(enrollmentNo, courseCode);
    const hasPreviousModeA = previousAttempts.some(a => a.registration_mode === 'A');

    // Validate mode based on attempt type
    switch (attemptType) {
      case 'REGULAR':
        return validateRegularMode(requestedMode);
      
      case 'BACKLOG':
        return validateBacklogMode(requestedMode, hasPreviousModeA);
      
      case 'IMPROVEMENT':
        return validateImprovementMode(requestedMode, hasPreviousModeA);
      
      default:
        return {
          valid: false,
          allowedModes: [],
          message: `Invalid attempt type: ${attemptType}`,
          reason: 'invalid_attempt_type',
        };
    }
  } catch (error) {
    console.error("Error validating registration mode:", error);
    return {
      valid: false,
      allowedModes: [],
      message: "Failed to validate registration mode",
      reason: 'validation_error',
    };
  }
}

/**
 * Validate mode for REGULAR (first attempt)
 */
function validateRegularMode(requestedMode: string): ModeValidationResult {
  if (requestedMode === 'A') {
    return {
      valid: true,
      allowedModes: ['A'],
    };
  }

  return {
    valid: false,
    allowedModes: ['A'],
    message: "First attempt must be in Mode A",
    reason: 'first_attempt_mode_a_only',
  };
}

/**
 * Validate mode for BACKLOG (failed course repeat)
 */
function validateBacklogMode(requestedMode: string, hasPreviousModeA: boolean): ModeValidationResult {
  if (requestedMode === 'A') {
    return {
      valid: true,
      allowedModes: hasPreviousModeA ? ['A', 'B', 'C'] : ['A'],
    };
  }

  if (['B', 'C'].includes(requestedMode)) {
    if (hasPreviousModeA) {
      // TODO: Add attendance check when attendance system is implemented
      // For now, allow Mode B/C if previous Mode A exists
      // Future: hasPreviousModeA && attendance_completed === true
      return {
        valid: true,
        allowedModes: ['A', 'B', 'C'],
        message: "Mode B/C allowed (attendance check skipped for now)",
      };
    } else {
      return {
        valid: false,
        allowedModes: ['A'],
        message: "Mode B/C requires previous Mode A attempt",
        reason: 'no_previous_mode_a',
      };
    }
  }

  return {
    valid: false,
    allowedModes: hasPreviousModeA ? ['A', 'B', 'C'] : ['A'],
    message: `Invalid mode ${requestedMode} for backlog`,
    reason: 'invalid_mode',
  };
}

/**
 * Validate mode for IMPROVEMENT (passed course improvement)
 */
function validateImprovementMode(requestedMode: string, hasPreviousModeA: boolean): ModeValidationResult {
  if (requestedMode === 'A') {
    return {
      valid: false,
      allowedModes: hasPreviousModeA ? ['B', 'C'] : [],
      message: "Mode A not allowed for improvement",
      reason: 'improvement_mode_a_not_allowed',
    };
  }

  if (['B', 'C'].includes(requestedMode)) {
    if (hasPreviousModeA) {
      // TODO: Add attendance check when attendance system is implemented
      // For now, allow Mode B/C if previous Mode A exists
      return {
        valid: true,
        allowedModes: ['B', 'C'],
        message: "Mode B/C allowed for improvement (attendance check skipped for now)",
      };
    } else {
      return {
        valid: false,
        allowedModes: [],
        message: "Improvement requires previous Mode A attempt",
        reason: 'no_previous_mode_a',
      };
    }
  }

  return {
    valid: false,
    allowedModes: hasPreviousModeA ? ['B', 'C'] : [],
    message: `Invalid mode ${requestedMode} for improvement`,
    reason: 'invalid_mode',
  };
}

/**
 * Validate compatibility between registration type and mode
 */
export function validateModeTypeCompatibility(
  registrationType: string,
  registrationMode: string
): { valid: boolean; message?: string } {
  const validCombinations = [
    // Regular - only Mode A
    { type: 'regular', mode: 'A' },
    
    // Backlog - all modes (Mode B/C need previous Mode A check)
    { type: 'backlog', mode: 'A' },
    { type: 'backlog', mode: 'B' },
    { type: 'backlog', mode: 'C' },
    
    // Improvement - only Mode B/C
    { type: 'improvement', mode: 'B' },
    { type: 'improvement', mode: 'C' },
  ];

  const isValid = validCombinations.some(
    combo => combo.type === registrationType && combo.mode === registrationMode
  );

  if (!isValid) {
    return {
      valid: false,
      message: `Invalid combination: ${registrationType} with Mode ${registrationMode}`,
    };
  }

  return { valid: true };
}

/**
 * Get allowed modes for a course based on student's history
 */
export async function getAllowedModes(
  enrollmentNo: string,
  courseCode: string,
  attemptType: string
): Promise<string[]> {
  try {
    const previousAttempts = await getPreviousAttempts(enrollmentNo, courseCode);
    const hasPreviousModeA = previousAttempts.some(a => a.registration_mode === 'A');

    switch (attemptType) {
      case 'REGULAR':
        return ['A'];
      
      case 'BACKLOG':
        return hasPreviousModeA ? ['A', 'B', 'C'] : ['A'];
      
      case 'IMPROVEMENT':
        return hasPreviousModeA ? ['B', 'C'] : [];
      
      default:
        return [];
    }
  } catch (error) {
    console.error("Error getting allowed modes:", error);
    return [];
  }
}