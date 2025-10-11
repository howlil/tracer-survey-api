/*
  Warnings:

  - Added the required column `degree` to the `Major` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Alumni` MODIFY `degree` ENUM('S1', 'PASCA', 'PROFESI', 'VOKASI') NOT NULL;

-- AlterTable
ALTER TABLE `Major` ADD COLUMN `degree` ENUM('S1', 'S2', 'S3', 'VOKASI', 'PROFESI') NOT NULL;

-- AlterTable
ALTER TABLE `Survey` MODIFY `description` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `SurveyRules` MODIFY `degree` ENUM('S1', 'PASCA', 'PROFESI', 'VOKASI') NOT NULL;
