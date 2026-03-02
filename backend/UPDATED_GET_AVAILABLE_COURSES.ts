// Updated getAvailableCourses method with backlog/improvement separation
// This separates courses into: regularCourses (auto-selected), backlogCourses (optional), improvementCourses (optional)

static async getAvailableCourses(req: Request, res: Response) {
  try {
    const enrollmentNo = req.user?.enrollmentNo;

    if (!enrollmentNo) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Check registration deadline
    const registrationDeadline = await prisma.registrationRule.findFirst({
      where: { rule_name: "REGISTRATION_DEADLINE", is_active: true },
    });

    const isRegistrationOpen = registrationDeadline && registrationDeadline.rule_value
      ? new Date(registrationDeadline.rule_value) > new Date()
      : true;

    if (!isRegistrationOpen) {
      res.status(403).json({ 
        error: "Registration window closed",
        deadline: registrationDeadline?.rule_value,
      });
      return;
    }

    // Get student details
    const student = await prisma.student.findUnique({
      where: { enrollment_no: enrollmentNo },
      include: { faculty: true },
    });

    if (!student) {
      res.status(404).json({ error: "Student not found" });
      return;
    }

    // Get all grade records for the student
    const allGradeRecords = await prisma.gradeRecord.findMany({
      where: { enrollment_no: enrollmentNo },
      include: { course: true },
    });

    // Get current registrations
    const currentYear = new Date().getFullYear();
    const semesterType = student.current_semester % 2 === 1 ? 1 : 2;
    
    const registrations = await prisma.courseRegistration.findMany({
      where: {
        enrollment_no: enrollmentNo,
        academic_year: currentYear,
        semester_type: semesterType,
        deleted_at: null,
      },
    });

    const registeredCodes = registrations.map((r) => r.course_code);

    // 1. REGULAR COURSES (Current semester - auto-selected)
    const currentSemesterCourses = await prisma.course.findMany({
      where: {
        branch_code: student.faculty?.branch_code,
        semester_no: student.current_semester,
      },
      include: {
        prerequisites: {
          include: { prerequisite: true },
        },
      },
    });

    const regularCourses = currentSemesterCourses
      .filter(course => !registeredCodes.includes(course.course_code))
      .map(course => ({
        courseCode: course.course_code,
        courseName: course.course_name,
        credits: course.credits,
        semester: course.semester_no,
        isElective: course.is_elective,
        electiveGroup: course.elective_group,
        courseType: course.course_type,
        isAutoSelected: true,
        registrationType: "regular",
        prerequisites: course.prerequisites?.map((p: any) => ({
          courseCode: p.prerequisite_course_code,
          courseName: p.prerequisite.course_name,
          minGrade: p.min_grade,
        })) || [],
      }));

    // 2. BACKLOG COURSES (Failed courses - optional)
    const failedGrades = allGradeRecords.filter(record => 
      record.grade === 'E' || record.grade === 'F'
    );

    // Group by course to count attempts
    const courseAttemptsMap = new Map<string, any[]>();
    allGradeRecords.forEach(record => {
      if (!courseAttemptsMap.has(record.course_code)) {
        courseAttemptsMap.set(record.course_code, []);
      }
      courseAttemptsMap.get(record.course_code)!.push(record);
    });

    const backlogCourses = failedGrades
      .filter(record => {
        // Check if not already passed in a later attempt
        const attempts = courseAttemptsMap.get(record.course_code) || [];
        const hasPassed = attempts.some(a => 
          a.grade && ['D', 'C', 'B', 'B+', 'A', 'A+'].includes(a.grade)
        );
        return !hasPassed && !registeredCodes.includes(record.course_code);
      })
      .map(record => {
        const attempts = courseAttemptsMap.get(record.course_code) || [];
        const lastAttempt = attempts[attempts.length - 1];
        
        return {
          courseCode: record.course.course_code,
          courseName: record.course.course_name,
          credits: record.course.credits,
          semester: record.course.semester_no,
          isElective: record.course.is_elective,
          electiveGroup: record.course.elective_group,
          courseType: record.course.course_type,
          isAutoSelected: false,
          registrationType: "backlog",
          previousAttempts: attempts.length,
          lastGrade: lastAttempt.grade,
          lastGradePoints: Number(lastAttempt.grade_points),
        };
      });

    // Remove duplicates from backlog courses
    const uniqueBacklogCourses = Array.from(
      new Map(backlogCourses.map(c => [c.courseCode, c])).values()
    );

    // 3. IMPROVEMENT COURSES (Passed with low grades - optional)
    const lowGrades = allGradeRecords.filter(record => 
      record.grade === 'C' || record.grade === 'D'
    );

    const improvementCourses = lowGrades
      .filter(record => {
        // Check if this is the best attempt
        const attempts = courseAttemptsMap.get(record.course_code) || [];
        const bestAttempt = attempts.reduce((best, curr) => 
          Number(curr.grade_points) > Number(best.grade_points) ? curr : best
        );
        return bestAttempt.grade_id === record.grade_id && 
               !registeredCodes.includes(record.course_code);
      })
      .map(record => ({
        courseCode: record.course.course_code,
        courseName: record.course.course_name,
        credits: record.course.credits,
        semester: record.course.semester_no,
        isElective: record.course.is_elective,
        electiveGroup: record.course.elective_group,
        courseType: record.course.course_type,
        isAutoSelected: false,
        registrationType: "improvement",
        currentGrade: record.grade,
        currentGradePoints: Number(record.grade_points),
        previousAttempts: (courseAttemptsMap.get(record.course_code) || []).length,
      }));

    // Remove duplicates from improvement courses
    const uniqueImprovementCourses = Array.from(
      new Map(improvementCourses.map(c => [c.courseCode, c])).values()
    );

    // Get elective groups for current semester
    const groups = await prisma.electiveGroup.findMany({
      where: {
        branch_code: student.faculty?.branch_code,
        semester_no: student.current_semester,
      },
    });

    const electiveGroups = groups.map(group => ({
      groupCode: group.group_code,
      groupName: group.group_name,
      minSelection: group.min_selection,
      maxSelection: group.max_selection,
      courses: regularCourses.filter(c => c.electiveGroup === group.group_code),
    }));

    res.json({
      regularCourses,
      backlogCourses: uniqueBacklogCourses,
      improvementCourses: uniqueImprovementCourses,
      electiveGroups,
      deadlines: {
        registration: registrationDeadline?.rule_value || null,
        modification: await prisma.registrationRule.findFirst({
          where: { rule_name: "MODIFICATION_DEADLINE", is_active: true },
        }).then(r => r?.rule_value || null),
      },
    });
  } catch (error) {
    console.error("Error fetching available courses:", error);
    res.status(500).json({ error: "Failed to fetch available courses" });
  }
}
