/*
  Warnings:

  - You are about to drop the column `minutesEarly` on the `Attendance` table. All the data in the column will be lost.
  - You are about to drop the column `minutesLate` on the `Attendance` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AttendanceRequest" DROP CONSTRAINT "AttendanceRequest_attendanceId_fkey";

-- AlterTable
ALTER TABLE "Attendance" DROP COLUMN "minutesEarly",
DROP COLUMN "minutesLate";

-- AlterTable
ALTER TABLE "AttendanceRequest" ALTER COLUMN "attendanceId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "AttendanceRequest" ADD CONSTRAINT "AttendanceRequest_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
