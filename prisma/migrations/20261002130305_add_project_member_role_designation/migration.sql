-- AlterTable
ALTER TABLE `ProjectMember` ADD COLUMN `designation` VARCHAR(191) NULL,
    ADD COLUMN `role` VARCHAR(191) NOT NULL DEFAULT 'member';
