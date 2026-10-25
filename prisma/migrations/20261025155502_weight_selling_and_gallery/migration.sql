-- CreateEnum
CREATE TYPE "ProductSaleMode" AS ENUM ('UNIT', 'WEIGHT');

-- CreateEnum
CREATE TYPE "GalleryMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "saleMode" "ProductSaleMode" NOT NULL DEFAULT 'UNIT',
ADD COLUMN     "weightGrams" INTEGER;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "saleMode" "ProductSaleMode" NOT NULL DEFAULT 'UNIT',
ADD COLUMN     "weightGrams" INTEGER;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "saleMode" "ProductSaleMode" NOT NULL DEFAULT 'UNIT';

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "mediaType" "GalleryMediaType" NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "thumbnailUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GalleryItem_isPublished_sortOrder_idx" ON "GalleryItem"("isPublished", "sortOrder");
