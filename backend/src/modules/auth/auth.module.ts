import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthController,
  AdminAuthController,
  AuthMeController,
} from './auth.controller';

@Module({
  controllers: [AuthController, AdminAuthController, AuthMeController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}