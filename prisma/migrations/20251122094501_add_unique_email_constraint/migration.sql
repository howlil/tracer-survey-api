/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Respondent` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Manager` ADD COLUMN `phoneNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `Role` ADD COLUMN `facultyId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Respondent_email_key` ON `Respondent`(`email`);

-- CreateIndex
CREATE INDEX `Role_facultyId_idx` ON `Role`(`facultyId`);

-- AddForeignKey
ALTER TABLE `Role` ADD CONSTRAINT `Role_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `Faculty`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
