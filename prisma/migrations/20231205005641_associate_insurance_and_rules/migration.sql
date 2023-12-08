-- CreateTable
CREATE TABLE `_InsuranceCompanyToRule` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_InsuranceCompanyToRule_AB_unique`(`A`, `B`),
    INDEX `_InsuranceCompanyToRule_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_InsuranceCompanyToRule` ADD CONSTRAINT `_InsuranceCompanyToRule_A_fkey` FOREIGN KEY (`A`) REFERENCES `InsuranceCompany`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_InsuranceCompanyToRule` ADD CONSTRAINT `_InsuranceCompanyToRule_B_fkey` FOREIGN KEY (`B`) REFERENCES `Rule`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
