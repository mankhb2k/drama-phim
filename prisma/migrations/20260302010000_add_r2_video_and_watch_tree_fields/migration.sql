-- Enums for storage/source metadata
CREATE TYPE "StorageProvider" AS ENUM ('EXTERNAL', 'R2');
CREATE TYPE "ServerSourceType" AS ENUM ('EMBED', 'DIRECT_VIDEO');

-- Movie channel for tree watch URL (/watch/{channel}/{movieSlug}/{episodeSlug})
ALTER TABLE "Movie"
ADD COLUMN "channel" TEXT NOT NULL DEFAULT 'nsh';

-- Episode canonical segment for tree watch URL (e.g. tap-1)
ALTER TABLE "Episode"
ADD COLUMN "watchSlug" TEXT;

-- Server metadata for R2/object-storage sources
ALTER TABLE "Server"
ADD COLUMN "sourceType" "ServerSourceType" NOT NULL DEFAULT 'EMBED',
ADD COLUMN "storageProvider" "StorageProvider" NOT NULL DEFAULT 'EXTERNAL',
ADD COLUMN "objectKey" TEXT,
ADD COLUMN "playbackUrl" TEXT,
ADD COLUMN "subtitleUrl" TEXT,
ADD COLUMN "vastTagUrl" TEXT,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "fileSizeBytes" INTEGER,
ADD COLUMN "durationSeconds" INTEGER;

-- Seed watchSlug from existing episodeNumber for compatibility
UPDATE "Episode"
SET "watchSlug" = CONCAT('tap-', "episodeNumber")
WHERE "watchSlug" IS NULL;

-- Keep unique watch slug inside each movie
CREATE UNIQUE INDEX "Episode_movieId_watchSlug_key" ON "Episode"("movieId", "watchSlug");
