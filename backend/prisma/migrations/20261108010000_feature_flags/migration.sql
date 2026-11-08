CREATE TABLE `feature_flags` (
  `key` VARCHAR(50) NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT true,
  `updatedBy` BIGINT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
