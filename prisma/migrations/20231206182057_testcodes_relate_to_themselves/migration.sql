/*
  Warnings:

  - You are about to drop the column `parentId` on the `TestCode` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `TestCode` DROP FOREIGN KEY `TestCode_parentId_fkey`;

-- AlterTable
ALTER TABLE `TestCode` DROP COLUMN `parentId`;

-- CreateTable
CREATE TABLE `_TestCodeToTestCode` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_TestCodeToTestCode_AB_unique`(`A`, `B`),
    INDEX `_TestCodeToTestCode_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_TestCodeToTestCode` ADD CONSTRAINT `_TestCodeToTestCode_A_fkey` FOREIGN KEY (`A`) REFERENCES `TestCode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_TestCodeToTestCode` ADD CONSTRAINT `_TestCodeToTestCode_B_fkey` FOREIGN KEY (`B`) REFERENCES `TestCode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
