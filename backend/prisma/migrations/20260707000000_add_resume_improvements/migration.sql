-- CreateTable
CREATE TABLE "resume_improvements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "ats_report_id" TEXT,
    "target_role" TEXT,
    "improvement_json" JSONB NOT NULL,
    "score_before" INTEGER NOT NULL,
    "score_after" INTEGER NOT NULL,
    "applied_count" INTEGER NOT NULL DEFAULT 0,
    "total_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_improvements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resume_versions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "resume_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "change_summary" TEXT,
    "resume_data" JSONB NOT NULL,
    "ats_score_before" INTEGER,
    "ats_score_after" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "resume_improvements_user_id_idx" ON "resume_improvements"("user_id");

-- CreateIndex
CREATE INDEX "resume_improvements_resume_id_idx" ON "resume_improvements"("resume_id");

-- CreateIndex
CREATE INDEX "resume_improvements_created_at_idx" ON "resume_improvements"("created_at");

-- CreateIndex
CREATE INDEX "resume_versions_user_id_idx" ON "resume_versions"("user_id");

-- CreateIndex
CREATE INDEX "resume_versions_resume_id_idx" ON "resume_versions"("resume_id");

-- CreateIndex
CREATE INDEX "resume_versions_created_at_idx" ON "resume_versions"("created_at");

-- AddForeignKey
ALTER TABLE "resume_improvements" ADD CONSTRAINT "resume_improvements_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resume_versions" ADD CONSTRAINT "resume_versions_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
