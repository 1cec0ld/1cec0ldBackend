/*
  Warnings:

  - You are about to drop the column `name` on the `InsuranceCompany` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[diagnosisCode]` on the table `DiagnosisCode` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lisMedCode]` on the table `Medication` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `companyName` to the `InsuranceCompany` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Analyte` ADD COLUMN `drugClassId` INTEGER NULL;

-- AlterTable
ALTER TABLE `InsuranceCompany` DROP COLUMN `name`,
    ADD COLUMN `companyName` VARCHAR(128) NOT NULL,
    ADD COLUMN `lisNote` VARCHAR(2048) NULL;

-- CreateTable
CREATE TABLE `DrugClass` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(32) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DrugClass_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `DiagnosisCode_diagnosisCode_key` ON `DiagnosisCode`(`diagnosisCode`);

-- CreateIndex
CREATE UNIQUE INDEX `Medication_lisMedCode_key` ON `Medication`(`lisMedCode`);

-- AddForeignKey
ALTER TABLE `Analyte` ADD CONSTRAINT `Analyte_drugClassId_fkey` FOREIGN KEY (`drugClassId`) REFERENCES `DrugClass`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
