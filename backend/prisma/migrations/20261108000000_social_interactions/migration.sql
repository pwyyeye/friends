ALTER TABLE `users`
  ADD COLUMN `notificationEnabled` BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE `profile_interactions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `actorUserId` BIGINT NOT NULL,
  `targetProfileId` BIGINT NOT NULL,
  `kind` VARCHAR(20) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `profile_interactions_actorUserId_targetProfileId_kind_key`(
    `actorUserId`,
    `targetProfileId`,
    `kind`
  ),
  INDEX `profile_interactions_actorUserId_kind_updatedAt_idx`(
    `actorUserId`,
    `kind`,
    `updatedAt`
  ),
  INDEX `profile_interactions_targetProfileId_kind_updatedAt_idx`(
    `targetProfileId`,
    `kind`,
    `updatedAt`
  ),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `profile_interactions`
  ADD CONSTRAINT `profile_interactions_actorUserId_fkey`
    FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `profile_interactions_targetProfileId_fkey`
    FOREIGN KEY (`targetProfileId`) REFERENCES `child_profiles`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE;
