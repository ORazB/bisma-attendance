/*
  Warnings:

  - You are about to drop the column `name` on the `Grade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[value]` on the table `Grade` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Major` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `value` to the `Grade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Grade" DROP COLUMN "name",
ADD COLUMN     "value" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Grade_value_key" ON "Grade"("value");

-- CreateIndex
CREATE UNIQUE INDEX "Major_name_key" ON "Major"("name");
