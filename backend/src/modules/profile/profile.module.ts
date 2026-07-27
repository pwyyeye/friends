import { Module } from '@nestjs/common';
import { ProfileController, AdminProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { UploadModule } from '@/modules/upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [ProfileController, AdminProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}