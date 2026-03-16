-- CreateTable
CREATE TABLE "csv_column_configs" (
    "config_id" SERIAL NOT NULL,
    "upload_type" TEXT NOT NULL,
    "column_order" JSONB NOT NULL,
    "created_by" TEXT NOT NULL,
    "updated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "csv_column_configs_pkey" PRIMARY KEY ("config_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "csv_column_configs_upload_type_key" ON "csv_column_configs"("upload_type");
