-- CreateEnum
CREATE TYPE "PartRequestStatus" AS ENUM ('PENDING', 'FULFILLED', 'REJECTED');

-- CreateTable
CREATE TABLE "SparePartRequest" (
    "id" TEXT NOT NULL,
    "repairJobId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "sparePartId" TEXT,
    "partName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "note" TEXT,
    "status" "PartRequestStatus" NOT NULL DEFAULT 'PENDING',
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SparePartRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SparePartRequest_repairJobId_idx" ON "SparePartRequest"("repairJobId");

-- CreateIndex
CREATE INDEX "SparePartRequest_requestedById_status_idx" ON "SparePartRequest"("requestedById", "status");

-- CreateIndex
CREATE INDEX "SparePartRequest_status_createdAt_idx" ON "SparePartRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "SparePartRequest" ADD CONSTRAINT "SparePartRequest_repairJobId_fkey" FOREIGN KEY ("repairJobId") REFERENCES "RepairJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePartRequest" ADD CONSTRAINT "SparePartRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePartRequest" ADD CONSTRAINT "SparePartRequest_sparePartId_fkey" FOREIGN KEY ("sparePartId") REFERENCES "SparePart"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SparePartRequest" ADD CONSTRAINT "SparePartRequest_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
