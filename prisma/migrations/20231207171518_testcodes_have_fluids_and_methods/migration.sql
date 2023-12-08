-- AlterTable
ALTER TABLE `TestCode` ADD COLUMN `method` VARCHAR(32) NOT NULL DEFAULT 'Confirmation',
    ADD COLUMN `sampleType` VARCHAR(32) NOT NULL DEFAULT 'UT';
