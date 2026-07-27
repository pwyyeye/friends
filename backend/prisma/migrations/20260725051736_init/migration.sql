-- CreateTable
CREATE TABLE `cities` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `pinyin` VARCHAR(50) NULL,
    `province` VARCHAR(50) NULL,
    `level` INTEGER NOT NULL DEFAULT 4,
    `status` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `cities_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `occupations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `category` VARCHAR(50) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `occupations_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `interest_tags` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(30) NOT NULL,
    `category` VARCHAR(30) NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `interest_tags_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `phone` VARCHAR(20) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `nickname` VARCHAR(50) NULL,
    `gender` INTEGER NULL,
    `age` INTEGER NULL,
    `cityId` BIGINT NULL,
    `height` INTEGER NULL,
    `occupationId` BIGINT NULL,
    `occupationCustom` VARCHAR(100) NULL,
    `avatarOssKey` VARCHAR(255) NULL,
    `inviteCode` VARCHAR(8) NULL,
    `referrerId` BIGINT NULL,
    `profileStatus` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `cancelStatus` INTEGER NOT NULL DEFAULT 0,
    `cancelAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_phone_key`(`phone`),
    UNIQUE INDEX `users_inviteCode_key`(`inviteCode`),
    INDEX `users_phone_idx`(`phone`),
    INDEX `users_inviteCode_idx`(`inviteCode`),
    INDEX `users_referrerId_idx`(`referrerId`),
    INDEX `users_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_interests` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `interestTagId` BIGINT NOT NULL,

    UNIQUE INDEX `user_interests_userId_interestTagId_key`(`userId`, `interestTagId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_custom_interests` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `tagText` VARCHAR(50) NOT NULL,
    `promoted` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_custom_interests_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_requirements` (
    `userId` BIGINT NOT NULL,
    `targetGender` INTEGER NOT NULL DEFAULT 0,
    `targetAgeMin` INTEGER NULL,
    `targetAgeMax` INTEGER NULL,
    `targetCityId` BIGINT NULL,
    `selfDesc` TEXT NULL,

    PRIMARY KEY (`userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_profiles_pending` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `payloadJson` JSON NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `rejectReason` VARCHAR(500) NULL,
    `reviewedBy` BIGINT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `user_profiles_pending_userId_status_idx`(`userId`, `status`),
    INDEX `user_profiles_pending_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `match_records` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userAId` BIGINT NOT NULL,
    `userBId` BIGINT NOT NULL,
    `referrerId` BIGINT NOT NULL,
    `matchedAt` DATETIME(3) NOT NULL,
    `note` TEXT NULL,
    `createdBy` BIGINT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `match_records_referrerId_idx`(`referrerId`),
    INDEX `match_records_matchedAt_idx`(`matchedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `referrer_history` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `oldReferrerId` BIGINT NULL,
    `newReferrerId` BIGINT NOT NULL,
    `reason` VARCHAR(500) NULL,
    `operatedBy` BIGINT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `referrer_history_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admins` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(20) NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `lastLoginAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `adminId` BIGINT NOT NULL,
    `action` VARCHAR(50) NOT NULL,
    `targetType` VARCHAR(30) NOT NULL,
    `targetId` BIGINT NULL,
    `payloadJson` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_adminId_idx`(`adminId`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `uploaded_files` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `ossKey` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `size` INTEGER NOT NULL,
    `mimeType` VARCHAR(50) NOT NULL,
    `purpose` VARCHAR(20) NOT NULL DEFAULT 'avatar',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uploaded_files_ossKey_key`(`ossKey`),
    INDEX `uploaded_files_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `token_blacklist` (
    `jti` VARCHAR(64) NOT NULL,
    `userId` BIGINT NULL,
    `adminId` BIGINT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `token_blacklist_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`jti`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_cityId_fkey` FOREIGN KEY (`cityId`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_occupationId_fkey` FOREIGN KEY (`occupationId`) REFERENCES `occupations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_interests` ADD CONSTRAINT `user_interests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_interests` ADD CONSTRAINT `user_interests_interestTagId_fkey` FOREIGN KEY (`interestTagId`) REFERENCES `interest_tags`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_custom_interests` ADD CONSTRAINT `user_custom_interests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_requirements` ADD CONSTRAINT `user_requirements_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_requirements` ADD CONSTRAINT `user_requirements_targetCityId_fkey` FOREIGN KEY (`targetCityId`) REFERENCES `cities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_profiles_pending` ADD CONSTRAINT `user_profiles_pending_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_profiles_pending` ADD CONSTRAINT `user_profiles_pending_reviewedBy_fkey` FOREIGN KEY (`reviewedBy`) REFERENCES `admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_records` ADD CONSTRAINT `match_records_userAId_fkey` FOREIGN KEY (`userAId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_records` ADD CONSTRAINT `match_records_userBId_fkey` FOREIGN KEY (`userBId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_records` ADD CONSTRAINT `match_records_referrerId_fkey` FOREIGN KEY (`referrerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `match_records` ADD CONSTRAINT `match_records_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `admins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrer_history` ADD CONSTRAINT `referrer_history_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrer_history` ADD CONSTRAINT `referrer_history_newReferrerId_fkey` FOREIGN KEY (`newReferrerId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `referrer_history` ADD CONSTRAINT `referrer_history_operatedBy_fkey` FOREIGN KEY (`operatedBy`) REFERENCES `admins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `admins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `uploaded_files` ADD CONSTRAINT `uploaded_files_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `token_blacklist` ADD CONSTRAINT `token_blacklist_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
