/*
  Warnings:

  - A unique constraint covering the columns `[publicId]` on the table `Movie` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `publicId` to the `Movie` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Movie" ADD COLUMN     "publicId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "R2File" ADD COLUMN     "episodeId" INTEGER,
ADD COLUMN     "movieId" INTEGER;

-- AlterTable
ALTER TABLE "Server" ADD COLUMN     "r2FileId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Movie_publicId_key" ON "Movie"("publicId");

-- CreateIndex
CREATE INDEX "R2File_movieId_idx" ON "R2File"("movieId");

-- CreateIndex
CREATE INDEX "R2File_episodeId_idx" ON "R2File"("episodeId");

-- CreateIndex
CREATE INDEX "Server_r2FileId_idx" ON "Server"("r2FileId");

-- AddForeignKey
ALTER TABLE "Server" ADD CONSTRAINT "Server_r2FileId_fkey" FOREIGN KEY ("r2FileId") REFERENCES "R2File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "R2File" ADD CONSTRAINT "R2File_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "Movie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "R2File" ADD CONSTRAINT "R2File_episodeId_fkey" FOREIGN KEY ("episodeId") REFERENCES "Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
