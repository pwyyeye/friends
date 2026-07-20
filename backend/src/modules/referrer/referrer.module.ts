import { Module } from '@nestjs/common';
import {
  ReferrerController,
  AdminReferrerController,
  AdminUserReferrerController,
} from './referrer.controller';
import { ReferrerService } from './referrer.service';

@Module({
  controllers: [
    ReferrerController,
    AdminReferrerController,
    AdminUserReferrerController,
  ],
  providers: [ReferrerService],
  exports: [ReferrerService],
})
export class ReferrerModule {}