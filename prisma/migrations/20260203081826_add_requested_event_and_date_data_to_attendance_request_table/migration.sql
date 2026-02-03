/*
  Warnings:

  - Added the required column `requestedDate` to the `AttendanceRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `requestedEventType` to the `AttendanceRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AttendanceRequest" ADD COLUMN     "requestedDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "requestedEventType" TEXT NOT NULL;
