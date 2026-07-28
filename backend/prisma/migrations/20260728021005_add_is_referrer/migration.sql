-- AlterTable
ALTER TABLE `users` ADD COLUMN `isReferrer` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `users_isReferrer_idx` ON `users`(`isReferrer`);
