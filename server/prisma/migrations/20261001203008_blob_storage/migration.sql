-- CreateTable
CREATE TABLE "Blob" (
    "key" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "contentType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Blob_pkey" PRIMARY KEY ("key")
);
