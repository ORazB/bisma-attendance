/*
  Warnings:

  - Changed the type of `requestedEventType` on the `AttendanceRequest` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "AttendanceRequest" DROP COLUMN "requestedEventType",
ADD COLUMN     "requestedEventType" "AttendanceStatus" NOT NULL;
