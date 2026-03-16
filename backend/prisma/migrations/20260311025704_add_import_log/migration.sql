-- CreateTable
CREATE TABLE "ImportLog" (
    "import_id" SERIAL NOT NULL,
    "file_name" TEXT NOT NULL,
    "upload_type" TEXT NOT NULL,
    "total_rows" INTEGER NOT NULL,
    "valid_rows" INTEGER NOT NULL,
    "error_rows" INTEGER NOT NULL,
    "created" INTEGER NOT NULL DEFAULT 0,
    "updated" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by" TEXT NOT NULL,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL,
    "error_file" TEXT,
    "file_size" INTEGER NOT NULL,

    CONSTRAINT "ImportLog_pkey" PRIMARY KEY ("import_id")
);

-- CreateIndex
CREATE INDEX "ImportLog_uploaded_by_idx" ON "ImportLog"("uploaded_by");

-- CreateIndex
CREATE INDEX "ImportLog_uploaded_at_idx" ON "ImportLog"("uploaded_at");

-- CreateIndex
CREATE INDEX "ImportLog_upload_type_idx" ON "ImportLog"("upload_type");
