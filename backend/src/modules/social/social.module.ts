import { Module } from '@nestjs/common';
import { ProfileModule } from '@/modules/profile/profile.module';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';

@Module({
  imports: [ProfileModule],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
