import { Module } from '@nestjs/common';
import { ProfileController, AdminProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UploadModule } from '@/modules/upload/upload.module';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';

@Module({
  imports: [UploadModule],
  controllers: [ProfileController, AdminProfileController, RecommendationController],
  providers: [ProfileService, RecommendationService],
  exports: [ProfileService, RecommendationService],
})
export class ProfileModule {}
