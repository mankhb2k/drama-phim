-- Add missing Movie.originalTitle (DB was out of sync with migration)
ALTER TABLE "Movie" ADD COLUMN IF NOT EXISTS "originalTitle" TEXT;

-- Add missing index on Movie.slug
CREATE INDEX IF NOT EXISTS "Movie_slug_idx" ON "Movie"("slug");

-- Remove Episode.title to match schema (schema has "name" only)
ALTER TABLE "Episode" DROP COLUMN IF EXISTS "title";
