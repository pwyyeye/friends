import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ProfileModule } from '@/modules/profile/profile.module';
import { UploadModule } from '@/modules/upload/upload.module';

@Module({
  imports: [ProfileModule, UploadModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}