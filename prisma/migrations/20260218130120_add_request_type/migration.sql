/*
  Warnings:

  - Added the required column `requestType` to the `AttendanceRequest` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttendanceRequestType" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterTable
ALTER TABLE "AttendanceRequest" ADD COLUMN     "requestType" "AttendanceRequestType" NOT NULL;
