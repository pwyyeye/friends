import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import {
  AuthController,
  AdminAuthController,
  AuthMeController,
} from './auth.controller';

@Module({
  imports: [JwtModule.register({}), ConfigModule],
  controllers: [AuthController, AdminAuthController, AuthMeController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}