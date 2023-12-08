-- CreateTable
CREATE TABLE `Order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `requisitionNumber` VARCHAR(32) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_requisitionNumber_key`(`requisitionNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TestCode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(128) NOT NULL,
    `description` VARCHAR(2048) NOT NULL,
    `testCode` VARCHAR(32) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `parentId` INTEGER NULL,

    UNIQUE INDEX `TestCode_testCode_key`(`testCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AnalyteToTestCode` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_AnalyteToTestCode_AB_unique`(`A`, `B`),
    INDEX `_AnalyteToTestCode_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_DiagnosisCodeToPatient` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_DiagnosisCodeToPatient_AB_unique`(`A`, `B`),
    INDEX `_DiagnosisCodeToPatient_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_MedicationToPatient` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_MedicationToPatient_AB_unique`(`A`, `B`),
    INDEX `_MedicationToPatient_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TestCode` ADD CONSTRAINT `TestCode_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `TestCode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AnalyteToTestCode` ADD CONSTRAINT `_AnalyteToTestCode_A_fkey` FOREIGN KEY (`A`) REFERENCES `Analyte`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AnalyteToTestCode` ADD CONSTRAINT `_AnalyteToTestCode_B_fkey` FOREIGN KEY (`B`) REFERENCES `TestCode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DiagnosisCodeToPatient` ADD CONSTRAINT `_DiagnosisCodeToPatient_A_fkey` FOREIGN KEY (`A`) REFERENCES `DiagnosisCode`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_DiagnosisCodeToPatient` ADD CONSTRAINT `_DiagnosisCodeToPatient_B_fkey` FOREIGN KEY (`B`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_MedicationToPatient` ADD CONSTRAINT `_MedicationToPatient_A_fkey` FOREIGN KEY (`A`) REFERENCES `Medication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_MedicationToPatient` ADD CONSTRAINT `_MedicationToPatient_B_fkey` FOREIGN KEY (`B`) REFERENCES `Patient`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
