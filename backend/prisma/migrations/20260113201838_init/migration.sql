-- CreateTable
CREATE TABLE "FacultyNumber" (
    "faculty_no" TEXT NOT NULL,
    "admission_year" INTEGER NOT NULL,
    "branch_code" TEXT NOT NULL,
    "branch_name" TEXT NOT NULL,
    "roll_number" TEXT NOT NULL,
    "program_type" TEXT NOT NULL DEFAULT 'B.Tech',

    CONSTRAINT "FacultyNumber_pkey" PRIMARY KEY ("faculty_no")
);

-- CreateTable
CREATE TABLE "Student" (
    "enrollment_no" TEXT NOT NULL,
    "faculty_no" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "current_semester" INTEGER NOT NULL DEFAULT 1,
    "current_cpi" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("enrollment_no")
);

-- CreateTable
CREATE TABLE "Course" (
    "course_code" TEXT NOT NULL,
    "course_name" TEXT NOT NULL,
    "credits" INTEGER NOT NULL,
    "semester_no" INTEGER NOT NULL,
    "branch_code" TEXT NOT NULL,
    "is_elective" BOOLEAN NOT NULL DEFAULT false,
    "elective_group" TEXT,
    "course_type" TEXT NOT NULL DEFAULT 'Theory',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("course_code")
);

-- CreateTable
CREATE TABLE "CoursePrerequisite" (
    "prerequisite_id" SERIAL NOT NULL,
    "course_code" TEXT NOT NULL,
    "prerequisite_course_code" TEXT NOT NULL,
    "min_grade" TEXT NOT NULL DEFAULT 'P',

    CONSTRAINT "CoursePrerequisite_pkey" PRIMARY KEY ("prerequisite_id")
);

-- CreateTable
CREATE TABLE "ElectiveGroup" (
    "group_id" SERIAL NOT NULL,
    "group_code" TEXT NOT NULL,
    "group_name" TEXT,
    "branch_code" TEXT NOT NULL,
    "semester_no" INTEGER NOT NULL,
    "min_selection" INTEGER NOT NULL DEFAULT 1,
    "max_selection" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ElectiveGroup_pkey" PRIMARY KEY ("group_id")
);

-- CreateTable
CREATE TABLE "Teacher" (
    "teacher_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'teacher',
    "department" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Teacher_pkey" PRIMARY KEY ("teacher_id")
);

-- CreateTable
CREATE TABLE "GradeRecord" (
    "grade_id" SERIAL NOT NULL,
    "enrollment_no" TEXT NOT NULL,
    "faculty_no" TEXT NOT NULL,
    "course_code" TEXT NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "semester_type" INTEGER NOT NULL,
    "grade" TEXT,
    "grade_points" DECIMAL(65,30),
    "is_backlog" BOOLEAN NOT NULL DEFAULT false,
    "is_improvement" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GradeRecord_pkey" PRIMARY KEY ("grade_id")
);

-- CreateTable
CREATE TABLE "SemesterResult" (
    "result_id" SERIAL NOT NULL,
    "enrollment_no" TEXT NOT NULL,
    "faculty_no" TEXT NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "semester_no" INTEGER NOT NULL,
    "semester_type" INTEGER NOT NULL,
    "branch_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "spi" DECIMAL(65,30),
    "cpi" DECIMAL(65,30),
    "total_credits_earned" INTEGER NOT NULL DEFAULT 0,
    "result_status" TEXT,
    "result_declaration_date" TIMESTAMP(3),
    "is_result_declared" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,

    CONSTRAINT "SemesterResult_pkey" PRIMARY KEY ("result_id")
);

-- CreateTable
CREATE TABLE "CourseRegistration" (
    "registration_id" SERIAL NOT NULL,
    "enrollment_no" TEXT NOT NULL,
    "course_code" TEXT NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "semester_type" INTEGER NOT NULL,
    "registration_type" TEXT NOT NULL DEFAULT 'regular',
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseRegistration_pkey" PRIMARY KEY ("registration_id")
);

-- CreateTable
CREATE TABLE "CourseSchedule" (
    "schedule_id" SERIAL NOT NULL,
    "course_code" TEXT NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "semester_type" INTEGER NOT NULL,
    "day_of_week" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),

    CONSTRAINT "CourseSchedule_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "RegistrationPeriod" (
    "period_id" SERIAL NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "semester_type" INTEGER NOT NULL,
    "branch_code" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "period_type" TEXT NOT NULL DEFAULT 'regular',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistrationPeriod_pkey" PRIMARY KEY ("period_id")
);

-- CreateTable
CREATE TABLE "RegistrationRule" (
    "rule_id" SERIAL NOT NULL,
    "rule_name" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "rule_value" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationRule_pkey" PRIMARY KEY ("rule_id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "log_id" SERIAL NOT NULL,
    "action_type" TEXT NOT NULL,
    "performed_by" INTEGER,
    "action_details" TEXT,
    "affected_records" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("log_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_faculty_no_key" ON "Student"("faculty_no");

-- CreateIndex
CREATE UNIQUE INDEX "Student_email_key" ON "Student"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Teacher_email_key" ON "Teacher"("email");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_faculty_no_fkey" FOREIGN KEY ("faculty_no") REFERENCES "FacultyNumber"("faculty_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_course_code_fkey" FOREIGN KEY ("course_code") REFERENCES "Course"("course_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoursePrerequisite" ADD CONSTRAINT "CoursePrerequisite_prerequisite_course_code_fkey" FOREIGN KEY ("prerequisite_course_code") REFERENCES "Course"("course_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeRecord" ADD CONSTRAINT "GradeRecord_enrollment_no_fkey" FOREIGN KEY ("enrollment_no") REFERENCES "Student"("enrollment_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeRecord" ADD CONSTRAINT "GradeRecord_course_code_fkey" FOREIGN KEY ("course_code") REFERENCES "Course"("course_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SemesterResult" ADD CONSTRAINT "SemesterResult_enrollment_no_fkey" FOREIGN KEY ("enrollment_no") REFERENCES "Student"("enrollment_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_enrollment_no_fkey" FOREIGN KEY ("enrollment_no") REFERENCES "Student"("enrollment_no") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseRegistration" ADD CONSTRAINT "CourseRegistration_course_code_fkey" FOREIGN KEY ("course_code") REFERENCES "Course"("course_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseSchedule" ADD CONSTRAINT "CourseSchedule_course_code_fkey" FOREIGN KEY ("course_code") REFERENCES "Course"("course_code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_performed_by_fkey" FOREIGN KEY ("performed_by") REFERENCES "Teacher"("teacher_id") ON DELETE SET NULL ON UPDATE CASCADE;
