-- CreateTable
CREATE TABLE "R2Folder" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "R2Folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "R2File" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "folderId" TEXT,
    "displayName" TEXT NOT NULL,
    "sizeBytes" INTEGER,
    "mimeType" TEXT,
    "lastModifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "R2File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "R2Folder_bucket_idx" ON "R2Folder"("bucket");

-- CreateIndex
CREATE INDEX "R2Folder_parentId_idx" ON "R2Folder"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "R2Folder_bucket_prefix_key" ON "R2Folder"("bucket", "prefix");

-- CreateIndex
CREATE INDEX "R2File_folderId_idx" ON "R2File"("folderId");

-- CreateIndex
CREATE INDEX "R2File_bucket_displayName_idx" ON "R2File"("bucket", "displayName");

-- CreateIndex
CREATE UNIQUE INDEX "R2File_bucket_key_key" ON "R2File"("bucket", "key");

-- AddForeignKey
ALTER TABLE "R2Folder" ADD CONSTRAINT "R2Folder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "R2Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "R2File" ADD CONSTRAINT "R2File_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "R2Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
