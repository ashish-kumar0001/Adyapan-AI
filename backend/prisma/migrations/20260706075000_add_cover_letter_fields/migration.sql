-- AlterTable
ALTER TABLE "cover_letters" ADD COLUMN "resume_id" TEXT,
ADD COLUMN "job_description" TEXT,
ADD COLUMN "tone" TEXT NOT NULL DEFAULT 'Professional',
ADD COLUMN "letter_type" TEXT NOT NULL DEFAULT 'Full-Time',
ADD COLUMN "greeting" TEXT,
ADD COLUMN "introduction" TEXT,
ADD COLUMN "body" TEXT,
ADD COLUMN "closing" TEXT,
ADD COLUMN "pdf_url" TEXT,
ADD COLUMN "docx_url" TEXT;

-- AddForeignKey
ALTER TABLE "cover_letters" ADD CONSTRAINT "cover_letters_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
