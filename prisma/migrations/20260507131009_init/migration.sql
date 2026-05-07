-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLEANER', 'MANAGER');

-- CreateEnum
CREATE TYPE "Rating" AS ENUM ('BAD', 'OK', 'GOOD');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "shift" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrance" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "floorsTotal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entrance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleanerAssignment" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "entranceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CleanerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "entranceId" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "rating" "Rating" NOT NULL,
    "comment" TEXT,
    "photoPath" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewCleaner" (
    "reviewId" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,

    CONSTRAINT "ReviewCleaner_pkey" PRIMARY KEY ("reviewId","cleanerId")
);

-- CreateTable
CREATE TABLE "Cleaning" (
    "id" TEXT NOT NULL,
    "cleanerId" TEXT NOT NULL,
    "entranceId" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "photoPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cleaning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QrCode" (
    "id" TEXT NOT NULL,
    "entranceId" TEXT NOT NULL,
    "floor" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QrCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE INDEX "CleanerAssignment_entranceId_idx" ON "CleanerAssignment"("entranceId");

-- CreateIndex
CREATE UNIQUE INDEX "CleanerAssignment_cleanerId_entranceId_key" ON "CleanerAssignment"("cleanerId", "entranceId");

-- CreateIndex
CREATE INDEX "Review_entranceId_createdAt_idx" ON "Review"("entranceId", "createdAt");

-- CreateIndex
CREATE INDEX "ReviewCleaner_cleanerId_idx" ON "ReviewCleaner"("cleanerId");

-- CreateIndex
CREATE INDEX "Cleaning_cleanerId_createdAt_idx" ON "Cleaning"("cleanerId", "createdAt");

-- CreateIndex
CREATE INDEX "Cleaning_entranceId_createdAt_idx" ON "Cleaning"("entranceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_token_key" ON "QrCode"("token");

-- CreateIndex
CREATE UNIQUE INDEX "QrCode_entranceId_floor_key" ON "QrCode"("entranceId", "floor");

-- AddForeignKey
ALTER TABLE "CleanerAssignment" ADD CONSTRAINT "CleanerAssignment_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleanerAssignment" ADD CONSTRAINT "CleanerAssignment_entranceId_fkey" FOREIGN KEY ("entranceId") REFERENCES "Entrance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_entranceId_fkey" FOREIGN KEY ("entranceId") REFERENCES "Entrance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCleaner" ADD CONSTRAINT "ReviewCleaner_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewCleaner" ADD CONSTRAINT "ReviewCleaner_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cleaning" ADD CONSTRAINT "Cleaning_cleanerId_fkey" FOREIGN KEY ("cleanerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cleaning" ADD CONSTRAINT "Cleaning_entranceId_fkey" FOREIGN KEY ("entranceId") REFERENCES "Entrance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QrCode" ADD CONSTRAINT "QrCode_entranceId_fkey" FOREIGN KEY ("entranceId") REFERENCES "Entrance"("id") ON DELETE CASCADE ON UPDATE CASCADE;
