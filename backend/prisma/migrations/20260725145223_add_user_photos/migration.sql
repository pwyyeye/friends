-- CreateTable
CREATE TABLE `user_photos` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `userId` BIGINT NOT NULL,
    `ossKey` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_photos_userId_idx`(`userId`),
    UNIQUE INDEX `user_photos_userId_ossKey_key`(`userId`, `ossKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_photos` ADD CONSTRAINT `user_photos_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
