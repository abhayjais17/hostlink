-- CreateTable
CREATE TABLE `CommitLink` (
    `id` VARCHAR(191) NOT NULL,
    `taskId` VARCHAR(191) NOT NULL,
    `commitSha` VARCHAR(64) NOT NULL,
    `commitMessage` TEXT NOT NULL,
    `authorName` VARCHAR(191) NOT NULL,
    `authorEmail` VARCHAR(191) NULL,
    `authorUserId` VARCHAR(191) NULL,
    `githubUsername` VARCHAR(191) NULL,
    `branch` VARCHAR(191) NULL,
    `commitUrl` VARCHAR(512) NOT NULL,
    `committedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommitLink_taskId_idx`(`taskId`),
    UNIQUE INDEX `CommitLink_taskId_commitSha_key`(`taskId`, `commitSha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CommitLink` ADD CONSTRAINT `CommitLink_taskId_fkey` FOREIGN KEY (`taskId`) REFERENCES `Task`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommitLink` ADD CONSTRAINT `CommitLink_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
