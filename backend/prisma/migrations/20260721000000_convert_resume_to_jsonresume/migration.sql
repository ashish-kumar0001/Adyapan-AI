-- Convert Resume table from legacy format to JSON Resume format
-- This migration consolidates personalInfo, education, experience, projects,
-- skills, certifications, achievements, and languages into a single
-- resume_data JSONB column following the JSON Resume schema.

-- Step 1: Add the new resume_data column
ALTER TABLE "resumes" ADD COLUMN "resume_data" JSONB NOT NULL DEFAULT '{}';

-- Step 2: Migrate existing data to resume_data (JSON Resume format)
-- This converts legacy fields to the JSON Resume schema structure
UPDATE "resumes" SET "resume_data" = jsonb_build_object(
  '$schema', 'https://raw.githubusercontent.com/jsonresume/jsonresume.org/master/packages/schema/schema.json',
  'basics', jsonb_build_object(
    'name', COALESCE(("personal_info"->>'fullName'), ''),
    'email', COALESCE(("personal_info"->>'email'), ''),
    'phone', COALESCE(("personal_info"->>'phone'), ''),
    'url', COALESCE(("personal_info"->>'website'), ("personal_info"->>'portfolio'), ''),
    'summary', COALESCE(("personal_info"->>'summary'), ''),
    'location', CASE WHEN ("personal_info"->>'location') IS NOT NULL AND ("personal_info"->>'location') != ''
      THEN jsonb_build_object('city', "personal_info"->>'location')
      ELSE NULL END,
    'profiles', (
      SELECT COALESCE(jsonb_agg(profile), '[]'::jsonb)
      FROM (
        SELECT jsonb_build_object('network', 'LinkedIn', 'url', "personal_info"->>'linkedin', 'username', regexp_replace("personal_info"->>'linkedin', '.*/', '')) AS profile
        WHERE "personal_info"->>'linkedin' IS NOT NULL AND "personal_info"->>'linkedin' != ''
        UNION ALL
        SELECT jsonb_build_object('network', 'GitHub', 'url', "personal_info"->>'github', 'username', regexp_replace("personal_info"->>'github', '.*/', ''))
        WHERE "personal_info"->>'github' IS NOT NULL AND "personal_info"->>'github' != ''
      ) profiles
    )
  ),
  'work', (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'name', item->>'company',
        'position', item->>'role',
        'startDate', item->>'startDate',
        'endDate', item->>'endDate',
        'summary', item->>'description',
        'highlights', CASE WHEN item->>'description' IS NOT NULL
          THEN string_to_array(item->>'description', E'\n')
          ELSE '{}'::text[] END
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE("experience", '[]'::jsonb)) AS item
  ),
  'education', (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'institution', item->>'institution',
        'area', item->>'fieldOfStudy',
        'studyType', item->>'degree',
        'startDate', item->>'startDate',
        'endDate', item->>'endDate',
        'score', item->>'grade'
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE("education", '[]'::jsonb)) AS item
  ),
  'projects', (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'name', COALESCE(item->>'name', item->>'title', ''),
        'description', item->>'description',
        'keywords', CASE WHEN item->>'techStack' IS NOT NULL AND item->>'techStack' != ''
          THEN string_to_array(item->>'techStack', ',')
          ELSE '{}'::text[] END
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE("projects", '[]'::jsonb)) AS item
  ),
  'skills', CASE WHEN "skills" IS NOT NULL AND jsonb_array_length("skills") > 0
    THEN jsonb_build_array(jsonb_build_object(
      'name', 'Technical Skills',
      'level', 'Professional',
      'keywords', "skills"
    ))
    ELSE '[]'::jsonb END,
  'certificates', (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'name', item->>'name',
        'issuer', item->>'issuer',
        'date', item->>'date'
      )
    ), '[]'::jsonb)
    FROM jsonb_array_elements(COALESCE("certifications", '[]'::jsonb)) AS item
  ),
  'awards', CASE WHEN "achievements" IS NOT NULL AND jsonb_array_length("achievements") > 0
    THEN (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('title', value)), '[]'::jsonb)
      FROM jsonb_array_elements_text("achievements")
    )
    ELSE '[]'::jsonb END,
  'languages', CASE WHEN "languages" IS NOT NULL AND jsonb_array_length("languages") > 0
    THEN (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('language', value, 'fluency', 'Fluent')), '[]'::jsonb)
      FROM jsonb_array_elements_text("languages")
    )
    ELSE '[]'::jsonb END
);

-- Step 3: Drop the old columns
ALTER TABLE "resumes" DROP COLUMN "personal_info";
ALTER TABLE "resumes" DROP COLUMN "education";
ALTER TABLE "resumes" DROP COLUMN "experience";
ALTER TABLE "resumes" DROP COLUMN "projects";
ALTER TABLE "resumes" DROP COLUMN "skills";
ALTER TABLE "resumes" DROP COLUMN "certifications";
ALTER TABLE "resumes" DROP COLUMN "achievements";
ALTER TABLE "resumes" DROP COLUMN "languages";
