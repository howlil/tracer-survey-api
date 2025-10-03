/*
  Warnings:

  - The values [S2,S3,D3] on the enum `SurveyRules_degree` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `code` on the `Permission` table. All the data in the column will be lost.
  - You are about to drop the column `code` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `surveyId` on the `Question` table. All the data in the column will be lost.
  - You are about to drop the column `pin` on the `Respondent` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Survey` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `Survey` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Survey` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Survey` table. All the data in the column will be lost.
  - You are about to drop the column `maxGraduatedYear` on the `SurveyRules` table. All the data in the column will be lost.
  - You are about to drop the column `minGraduatedYear` on the `SurveyRules` table. All the data in the column will be lost.
  - The values [S2,S3,D3] on the enum `SurveyRules_degree` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `SurveyMaster` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[permissionName]` on the table `Permission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codeId` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `placeholder` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `searchplaceholder` to the `Question` table without a default value. This is not possible if the table is not empty.
  - Added the required column `greatingOpening` to the `Survey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `greetingClosing` to the `Survey` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Question` DROP FOREIGN KEY `Question_surveyId_fkey`;

-- DropForeignKey
ALTER TABLE `Survey` DROP FOREIGN KEY `Survey_surveyMasterId_fkey`;

-- DropIndex
DROP INDEX `Permission_code_key` ON `Permission`;

-- DropIndex
DROP INDEX `Question_code_key` ON `Question`;

-- DropIndex
DROP INDEX `Question_surveyId_fkey` ON `Question`;

-- DropIndex
DROP INDEX `Respondent_pin_key` ON `Respondent`;

-- DropIndex
DROP INDEX `Survey_surveyMasterId_fkey` ON `Survey`;

-- AlterTable
ALTER TABLE `Alumni` MODIFY `degree` ENUM('S1', 'PASCA', 'PROFESI') NOT NULL;

-- AlterTable
ALTER TABLE `Permission` DROP COLUMN `code`,
    ADD COLUMN `action` VARCHAR(191) NULL,
    ADD COLUMN `resource` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Question` DROP COLUMN `code`,
    DROP COLUMN `surveyId`,
    ADD COLUMN `codeId` VARCHAR(191) NOT NULL,
    ADD COLUMN `placeholder` VARCHAR(191) NOT NULL,
    ADD COLUMN `searchplaceholder` VARCHAR(191) NOT NULL,
    MODIFY `questionType` ENUM('ESSAY', 'LONG_TEST', 'SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'MATRIX_SINGLE_CHOICE', 'COMBO_BOX') NOT NULL;

-- AlterTable
ALTER TABLE `Respondent` DROP COLUMN `pin`;

-- AlterTable
ALTER TABLE `Survey` DROP COLUMN `description`,
    DROP COLUMN `endDate`,
    DROP COLUMN `startDate`,
    DROP COLUMN `title`,
    ADD COLUMN `greatingOpening` JSON NOT NULL,
    ADD COLUMN `greetingClosing` JSON NOT NULL;

-- AlterTable
ALTER TABLE `SurveyRules` DROP COLUMN `maxGraduatedYear`,
    DROP COLUMN `minGraduatedYear`,
    MODIFY `degree` ENUM('S1', 'PASCA', 'PROFESI') NOT NULL;

-- DropTable
DROP TABLE `SurveyMaster`;

-- CreateTable
CREATE TABLE `PinAlumni` (
    `pin` VARCHAR(191) NOT NULL,
    `alumniId` VARCHAR(191) NOT NULL,
    `managerId` VARCHAR(191) NULL,
    `pinType` ENUM('ALUMNI', 'MANAGER') NOT NULL,

    PRIMARY KEY (`pin`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CodeQuestion` (
    `code` VARCHAR(191) NOT NULL,
    `surveyId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Faq` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Permission_permissionName_key` ON `Permission`(`permissionName`);

-- AddForeignKey
ALTER TABLE `PinAlumni` ADD CONSTRAINT `PinAlumni_alumniId_fkey` FOREIGN KEY (`alumniId`) REFERENCES `Alumni`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PinAlumni` ADD CONSTRAINT `PinAlumni_managerId_fkey` FOREIGN KEY (`managerId`) REFERENCES `Manager`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CodeQuestion` ADD CONSTRAINT `CodeQuestion_surveyId_fkey` FOREIGN KEY (`surveyId`) REFERENCES `Survey`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Question` ADD CONSTRAINT `Question_codeId_fkey` FOREIGN KEY (`codeId`) REFERENCES `CodeQuestion`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;
