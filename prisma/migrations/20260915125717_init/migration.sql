-- CreateEnum
CREATE TYPE "DealType" AS ENUM ('RENT', 'SALE', 'BOTH');

-- CreateEnum
CREATE TYPE "PropKind" AS ENUM ('RETAIL', 'OFFICE', 'WAREHOUSE', 'LAND', 'BUILDING');

-- CreateEnum
CREATE TYPE "PropStatus" AS ENUM ('ACTIVE', 'RESERVED', 'CLOSED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('OBJECT', 'SEARCH', 'OWNER', 'CONTACT', 'PRESENTATION');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'IN_WORK', 'QUALIFIED', 'REJECTED', 'DEAL');

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "kind" "PropKind" NOT NULL,
    "dealType" "DealType" NOT NULL,
    "status" "PropStatus" NOT NULL DEFAULT 'ACTIVE',
    "district" TEXT NOT NULL,
    "address" TEXT,
    "landmark" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "areaM2" DOUBLE PRECISION NOT NULL,
    "ceilingM" DOUBLE PRECISION,
    "floor" TEXT,
    "entrance" TEXT,
    "powerKw" DOUBLE PRECISION,
    "hasWetPoint" BOOLEAN NOT NULL DEFAULT false,
    "priceSale" DECIMAL(14,2),
    "priceRentM2" DECIMAL(10,2),
    "priceRentTotal" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'KZT',
    "utilitiesIncluded" BOOLEAN NOT NULL DEFAULT false,
    "isExclusive" BOOLEAN NOT NULL DEFAULT false,
    "isHot" BOOLEAN NOT NULL DEFAULT false,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "descriptionMd" TEXT NOT NULL,
    "advantages" TEXT[],
    "presentationUrl" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "PropKind" NOT NULL,
    "dealType" "DealType" NOT NULL,
    "district" TEXT,
    "areaM2" DOUBLE PRECISION,
    "amountLabel" TEXT,
    "durationLabel" TEXT,
    "task" TEXT NOT NULL,
    "solution" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "coverUrl" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "type" "LeadType" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "comment" TEXT,
    "propertyId" TEXT,
    "briefKind" "PropKind",
    "briefAreaFrom" DOUBLE PRECISION,
    "briefAreaTo" DOUBLE PRECISION,
    "briefBudget" TEXT,
    "briefDistricts" TEXT[],
    "briefBusiness" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "pagePath" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "role" TEXT,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Property_slug_key" ON "Property"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Property_externalId_key" ON "Property"("externalId");

-- CreateIndex
CREATE INDEX "Property_kind_dealType_status_idx" ON "Property"("kind", "dealType", "status");

-- CreateIndex
CREATE INDEX "Property_district_idx" ON "Property"("district");

-- CreateIndex
CREATE INDEX "Property_isHot_isFeatured_idx" ON "Property"("isHot", "isFeatured");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_order_idx" ON "PropertyImage"("propertyId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "Case_slug_key" ON "Case"("slug");

-- CreateIndex
CREATE INDEX "Lead_status_createdAt_idx" ON "Lead"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
