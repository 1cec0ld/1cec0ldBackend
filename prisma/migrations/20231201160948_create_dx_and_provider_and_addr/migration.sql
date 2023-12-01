-- CreateTable
CREATE TABLE `DiagnosisCode` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `diagnosisCode` VARCHAR(32) NOT NULL,
    `description` VARCHAR(2048) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Provider` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `npi` VARCHAR(32) NOT NULL,
    `fullName` VARCHAR(512) NOT NULL,
    `firstName` VARCHAR(128) NOT NULL,
    `lastName` VARCHAR(128) NOT NULL,
    `title` VARCHAR(128) NOT NULL,
    `signatureBlob` BLOB NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Provider_npi_key`(`npi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Address` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `address1` VARCHAR(128) NOT NULL,
    `address2` VARCHAR(128) NULL,
    `city` VARCHAR(64) NOT NULL,
    `state` VARCHAR(128) NOT NULL,
    `zip` VARCHAR(32) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
