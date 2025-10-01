-- AlterTable
ALTER TABLE `BlastEmail` MODIFY `dateToSend` DATE NOT NULL;

-- AlterTable
ALTER TABLE `Survey` MODIFY `startDate` DATE NOT NULL,
    MODIFY `endDate` DATE NOT NULL;
