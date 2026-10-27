-- AlterTable
ALTER TABLE "GalleryItem" ADD COLUMN     "homeCaption" TEXT,
ADD COLUMN     "showOnHome" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MusicTrack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MusicTrack_isActive_sortOrder_idx" ON "MusicTrack"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "GalleryItem_mediaType_isPublished_showOnHome_idx" ON "GalleryItem"("mediaType", "isPublished", "showOnHome");
