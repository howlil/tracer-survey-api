/*
  Warnings:

  - You are about to drop the column `surveyMasterId` on the `Survey` table. All the data in the column will be lost.
  - You are about to drop the column `version` on the `Survey` table. All the data in the column will be lost.
  - You are about to drop the column `targetRole` on the `SurveyRules` table. All the data in the column will be lost.
  - Added the required column `description` to the `Survey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetRole` to the `Survey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `facultyId` to the `SurveyRules` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `SurveyRules` DROP FOREIGN KEY `SurveyRules_majorId_fkey`;

-- DropIndex
DROP INDEX `SurveyRules_majorId_fkey` ON `SurveyRules`;

-- AlterTable
ALTER TABLE `Survey` DROP COLUMN `surveyMasterId`,
    DROP COLUMN `version`,
    ADD COLUMN `description` VARCHAR(191) NOT NULL,
    ADD COLUMN `targetRole` ENUM('ALUMNI', 'MANAGER') NOT NULL;

-- AlterTable
ALTER TABLE `SurveyRules` DROP COLUMN `targetRole`,
    ADD COLUMN `facultyId` VARCHAR(191) NOT NULL,
    MODIFY `majorId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `SurveyRules` ADD CONSTRAINT `SurveyRules_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `Faculty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
