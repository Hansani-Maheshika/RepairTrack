-- Atomic counters prevent duplicate public codes under concurrent requests.
CREATE TABLE "CodeSequence" (
    "key" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CodeSequence_pkey" PRIMARY KEY ("key")
);

