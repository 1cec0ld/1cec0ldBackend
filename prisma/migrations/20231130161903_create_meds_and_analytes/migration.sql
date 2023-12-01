-- CreateTable
CREATE TABLE `Medication` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lisMedCode` VARCHAR(32) NOT NULL,
    `description` VARCHAR(2048) NOT NULL,
    `testable` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL,
    `analyteId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Analyte` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(32) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Analyte_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Medication` ADD CONSTRAINT `Medication_analyteId_fkey` FOREIGN KEY (`analyteId`) REFERENCES `Analyte`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
