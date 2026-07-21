-- AlterTable
ALTER TABLE `ProductVariant` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `estampa` VARCHAR(191) NOT NULL DEFAULT 'Liso';
