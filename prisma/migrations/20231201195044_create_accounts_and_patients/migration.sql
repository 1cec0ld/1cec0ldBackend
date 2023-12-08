/*
  Warnings:

  - Added the required column `accountId` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signatureFilename` to the `Provider` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Provider` ADD COLUMN `accountId` INTEGER NOT NULL,
    ADD COLUMN `signatureFilename` VARCHAR(16) NOT NULL;

-- AlterTable
ALTER TABLE `Rule` MODIFY `startDate` DATE NULL,
    MODIFY `endDate` DATE NULL;

-- CreateTable
CREATE TABLE `Account` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lisClientCode` VARCHAR(16) NOT NULL,
    `prefix` VARCHAR(16) NOT NULL,
    `dateActivated` DATE NOT NULL,
    `dateDeactivated` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Account_lisClientCode_key`(`lisClientCode`),
    UNIQUE INDEX `Account_prefix_key`(`prefix`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Patient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(128) NOT NULL,
    `lastName` VARCHAR(128) NOT NULL,
    `middleName` VARCHAR(128) NULL,
    `dateOfBirth` DATE NOT NULL,
    `lisPatientCode` VARCHAR(16) NOT NULL,
    `sex` VARCHAR(1) NOT NULL,
    `primaryInsuranceId` INTEGER NOT NULL,
    `primaryInsuranceNumber` VARCHAR(32) NOT NULL,
    `primaryInsuranceRelation` VARCHAR(32) NOT NULL,
    `secondaryInsuranceId` INTEGER NULL,
    `secondaryInsuranceNumber` VARCHAR(32) NULL,
    `secondaryInsuranceRelation` VARCHAR(32) NULL,
    `addressId` INTEGER NOT NULL,
    `accountId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Provider` ADD CONSTRAINT `Provider_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_primaryInsuranceId_fkey` FOREIGN KEY (`primaryInsuranceId`) REFERENCES `InsuranceCompany`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_secondaryInsuranceId_fkey` FOREIGN KEY (`secondaryInsuranceId`) REFERENCES `InsuranceCompany`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_addressId_fkey` FOREIGN KEY (`addressId`) REFERENCES `Address`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Patient` ADD CONSTRAINT `Patient_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `Account`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
