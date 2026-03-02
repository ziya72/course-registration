-- CreateTable
CREATE TABLE "RegistrationPhase" (
    "phase_id" SERIAL NOT NULL,
    "phase_name" TEXT NOT NULL,
    "phase_label" TEXT NOT NULL,
    "academic_year" INTEGER NOT NULL,
    "semester_type" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegistrationPhase_pkey" PRIMARY KEY ("phase_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RegistrationPhase_phase_name_academic_year_semester_type_key" ON "RegistrationPhase"("phase_name", "academic_year", "semester_type");
