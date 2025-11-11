/*
  Warnings:

  - You are about to drop the column `greatingOpening` on the `Survey` table. All the data in the column will be lost.
  - Added the required column `greetingOpening` to the `Survey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Survey` DROP COLUMN `greatingOpening`,
    ADD COLUMN `greetingOpening` JSON NOT NULL;

-- CreateIndex
CREATE INDEX `Alumni_graduatedYear_idx` ON `Alumni`(`graduatedYear`);

-- CreateIndex
CREATE INDEX `Alumni_degree_idx` ON `Alumni`(`degree`);

-- CreateIndex
CREATE INDEX `Question_sortOrder_idx` ON `Question`(`sortOrder`);

-- CreateIndex
CREATE INDEX `Survey_status_idx` ON `Survey`(`status`);

-- CreateIndex
CREATE INDEX `Survey_targetRole_idx` ON `Survey`(`targetRole`);

-- CreateIndex
CREATE INDEX `SurveyRules_majorId_idx` ON `SurveyRules`(`majorId`);

-- AddForeignKey
ALTER TABLE `SurveyRules` ADD CONSTRAINT `SurveyRules_majorId_fkey` FOREIGN KEY (`majorId`) REFERENCES `Major`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Alumni` RENAME INDEX `Alumni_majorId_fkey` TO `Alumni_majorId_idx`;

-- RenameIndex
ALTER TABLE `Major` RENAME INDEX `Major_facultyId_fkey` TO `Major_facultyId_idx`;

-- RenameIndex
ALTER TABLE `Question` RENAME INDEX `Question_codeId_fkey` TO `Question_codeId_idx`;

-- RenameIndex
ALTER TABLE `Question` RENAME INDEX `Question_groupQuestionId_fkey` TO `Question_groupQuestionId_idx`;

-- RenameIndex
ALTER TABLE `SurveyRules` RENAME INDEX `SurveyRules_facultyId_fkey` TO `SurveyRules_facultyId_idx`;

-- RenameIndex
ALTER TABLE `SurveyRules` RENAME INDEX `SurveyRules_surveyId_fkey` TO `SurveyRules_surveyId_idx`;
