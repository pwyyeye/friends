import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './common/guards';
import { UserModule } from './modules/user/user.module';
import { ReferrerModule } from './modules/referrer/referrer.module';
import { ProfileModule } from './modules/profile/profile.module';
import { MatchModule } from './modules/match/match.module';
import { UploadModule } from './modules/upload/upload.module';
import { DictModule } from './modules/dict/dict.module';
import { AuditModule } from './modules/audit/audit.module';
import { StatsModule } from './modules/stats/stats.module';
import { HealthModule } from './modules/health/health.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') ?? '7d' },
      }),
      global: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60_000,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    UserModule,
    ReferrerModule,
    ProfileModule,
    MatchModule,
    UploadModule,
    DictModule,
    AuditModule,
    StatsModule,
    HealthModule,
    AdminModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AppModule {}