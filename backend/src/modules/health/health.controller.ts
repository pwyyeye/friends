import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Roles } from '@/common/decorators';

@ApiTags('admin-health')
@Controller('api/v1/admin/health')
@Roles('super_admin', 'operator')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  @ApiOperation({ summary: '健康检查（DB）' })
  async health() {
    const start = Date.now();
    let mysql: { status: 'ok' | 'fail'; latencyMs: number; error?: string } = {
      status: 'ok',
      latencyMs: 0,
    };
    let oss: { status: 'ok' | 'skip'; note?: string } = { status: 'skip', note: 'OSS_PROVIDER=mock 不检测' };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      mysql = { status: 'ok', latencyMs: Date.now() - start };
    } catch (e) {
      mysql = {
        status: 'fail',
        latencyMs: Date.now() - start,
        error: (e as Error).message,
      };
    }

    const provider = this.config.get<string>('OSS_PROVIDER');
    if (provider === 'aliyun') {
      const ak = !!this.config.get<string>('OSS_ACCESS_KEY');
      const sk = !!this.config.get<string>('OSS_SECRET_KEY');
      oss = ak && sk
        ? { status: 'ok', note: '凭证已配置（未实际请求）' }
        : { status: 'fail' as any, note: '凭证缺失' } as any;
    }

    const ok = mysql.status === 'ok' && (oss.status === 'ok' || oss.status === 'skip');
    return {
      status: ok ? 'ok' : 'fail',
      checks: { mysql, oss },
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
    };
  }
}