/*
  Warnings:

  - A unique constraint covering the columns `[normalized_name]` on the table `skills` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "normalized_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "skills_normalized_name_key" ON "skills"("normalized_name");
