/*
  Warnings:

  - Changed the type of `name` on the `Major` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "MajorList" AS ENUM ('PPLG', 'TJKT', 'DKV', 'AKUNTANSI');

-- AlterTable
ALTER TABLE "Major" DROP COLUMN "name",
ADD COLUMN     "name" "MajorList" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Major_name_key" ON "Major"("name");
