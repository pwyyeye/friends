-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_cityId_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_occupationId_fkey`;

-- DropForeignKey
ALTER TABLE `user_interests` DROP FOREIGN KEY `user_interests_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user_interests` DROP FOREIGN KEY `user_interests_interestTagId_fkey`;

-- DropForeignKey
ALTER TABLE `user_custom_interests` DROP FOREIGN KEY `user_custom_interests_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user_requirements` DROP FOREIGN KEY `user_requirements_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user_requirements` DROP FOREIGN KEY `user_requirements_targetCityId_fkey`;

-- DropForeignKey
ALTER TABLE `user_photos` DROP FOREIGN KEY `user_photos_userId_fkey`;

-- DropForeignKey
ALTER TABLE `user_profiles_pending` DROP FOREIGN KEY `user_profiles_pending_userId_fkey`;

-- DropForeignKey
ALTER TABLE `match_records` DROP FOREIGN KEY `match_records_userAId_fkey`;

-- DropForeignKey
ALTER TABLE `match_records` DROP FOREIGN KEY `match_records_userBId_fkey`;

-- DropForeignKey
ALTER TABLE `match_records` DROP FOREIGN KEY `match_records_referrerId_fkey`;

-- DropIndex
DROP INDEX `users_phone_idx` ON `users`;

-- DropIndex
DROP INDEX `users_inviteCode_idx` ON `users`;

-- DropIndex
DROP INDEX `user_profiles_pending_userId_status_idx` ON `user_profiles_pending`;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `age`,
    DROP COLUMN `cityId`,
    DROP COLUMN `gender`,
    DROP COLUMN `height`,
    DROP COLUMN `occupationCustom`,
    DROP COLUMN `occupationId`,
    DROP COLUMN `profileStatus`,
    MODIFY `passwordHash` VARCHAR(255) NULL;

-- AlterTable
ALTER TABLE `user_profiles_pending` DROP COLUMN `userId`,
    ADD COLUMN `draftRevision` INTEGER NOT NULL,
    ADD COLUMN `profileId` BIGINT NOT NULL;

-- AlterTable
ALTER TABLE `match_records` DROP COLUMN `userAId`,
    DROP COLUMN `userBId`,
    ADD COLUMN `profileAId` BIGINT NOT NULL,
    ADD COLUMN `profileBId` BIGINT NOT NULL,
    MODIFY `referrerId` BIGINT NULL;

-- AlterTable
ALTER TABLE `uploaded_files` ADD COLUMN `committed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `profileId` BIGINT NOT NULL;

-- DropTable
DROP TABLE `user_interests`;

-- DropTable
DROP TABLE `user_custom_interests`;

-- DropTable
DROP TABLE `user_requirements`;

-- DropTable
DROP TABLE `user_photos`;

-- CreateTable
CREATE TABLE `child_profiles` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `ownerAccountId` BIGINT NOT NULL,
    `registrationSlot` VARCHAR(80) NOT NULL,
    `draft` JSON NOT NULL,
    `approvedPayload` JSON NULL,
    `draftRevision` INTEGER NOT NULL DEFAULT 0,
    `submittedRevision` INTEGER NULL,
    `approvedRevision` INTEGER NULL,
    `profileStatus` INTEGER NOT NULL DEFAULT 0,
    `matchmakingStatus` VARCHAR(20) NOT NULL DEFAULT 'active',
    `consentVersion` VARCHAR(30) NULL,
    `consentAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `child_profiles_registrationSlot_key`(`registrationSlot`),
    INDEX `child_profiles_ownerAccountId_idx`(`ownerAccountId`),
    INDEX `child_profiles_profileStatus_idx`(`profileStatus`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `user_profiles_pending_profileId_status_idx` ON `user_profiles_pending`(`profileId`, `status`);

-- CreateIndex
CREATE INDEX `uploaded_files_userId_profileId_idx` ON `uploaded_files`(`userId`, `profileId`);

-- AddForeignKey
ALTER TABLE `child_profiles` ADD CONSTRAINT `child_profiles_ownerAccountId_fkey` FOREIGN KEY (`ownerAccountId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_profiles_pending` ADD CONSTRAINT `user_profiles_pending_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `child_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_records` ADD CONSTRAINT `match_records_profileAId_fkey` FOREIGN KEY (`profileAId`) REFERENCES `child_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_records` ADD CONSTRAINT `match_records_profileBId_fkey` FOREIGN KEY (`profileBId`) REFERENCES `child_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_records` ADD CONSTRAINT `match_records_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `uploaded_files` ADD CONSTRAINT `uploaded_files_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `child_profiles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

