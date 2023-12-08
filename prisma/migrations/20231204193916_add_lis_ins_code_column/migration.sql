/*
  Warnings:

  - A unique constraint covering the columns `[lisInsuranceCode]` on the table `InsuranceCompany` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lisInsuranceCode` to the `InsuranceCompany` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `InsuranceCompany` ADD COLUMN `lisInsuranceCode` VARCHAR(32) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `InsuranceCompany_lisInsuranceCode_key` ON `InsuranceCompany`(`lisInsuranceCode`);
