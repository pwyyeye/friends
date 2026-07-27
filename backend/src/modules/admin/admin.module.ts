import { Module } from '@nestjs/common';
import { AdminUserController } from './admin-user.controller';
import { UploadModule } from '@/modules/upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [AdminUserController],
})
export class AdminModule {}