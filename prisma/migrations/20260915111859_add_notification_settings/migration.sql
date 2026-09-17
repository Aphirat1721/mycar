/*
  Warnings:

  - You are about to drop the column `applicationId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `eventType` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `meetingBookingId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `providerMessageId` on the `Notification` table. All the data in the column will be lost.
  - You are about to drop the column `recipientUserId` on the `Notification` table. All the data in the column will be lost.
  - Added the required column `type` to the `Notification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('MEETING_BOOKING_CREATED', 'MEETING_BOOKING_UPDATED', 'MEETING_BOOKING_CANCELLED');

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_applicationId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_meetingBookingId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_recipientUserId_fkey";

-- DropIndex
DROP INDEX "Notification_channel_eventType_createdAt_idx";

-- DropIndex
DROP INDEX "Notification_meetingBookingId_eventType_idx";

-- DropIndex
DROP INDEX "Notification_recipientUserId_readAt_createdAt_idx";

-- DropIndex
DROP INDEX "Notification_status_createdAt_idx";

-- AlterTable
ALTER TABLE "Notification" DROP COLUMN "applicationId",
DROP COLUMN "errorMessage",
DROP COLUMN "eventType",
DROP COLUMN "meetingBookingId",
DROP COLUMN "providerMessageId",
DROP COLUMN "recipientUserId",
ADD COLUMN     "error" TEXT,
ADD COLUMN     "resource" VARCHAR(120),
ADD COLUMN     "resourceId" VARCHAR(120),
ADD COLUMN     "type" "NotificationType" NOT NULL,
ADD COLUMN     "userId" UUID NOT NULL;

-- DropEnum
DROP TYPE "NotificationEventType";

-- CreateTable
CREATE TABLE "NotificationSetting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(100) NOT NULL,
    "labelTh" VARCHAR(200) NOT NULL,
    "value" TEXT,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "description" VARCHAR(500),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationSetting_key_key" ON "NotificationSetting"("key");

-- CreateIndex
CREATE INDEX "NotificationSetting_isSecret_idx" ON "NotificationSetting"("isSecret");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_channel_status_createdAt_idx" ON "Notification"("channel", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_resource_resourceId_idx" ON "Notification"("resource", "resourceId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
