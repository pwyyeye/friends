import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@/prisma/prisma.service';
import { Roles } from '@/common/decorators';

@ApiTags('admin-stats')
@Controller('api/v1/admin/stats')
@Roles('super_admin', 'operator')
export class StatsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('dashboard')
  @ApiOperation({ summary: '看板数据' })
  async dashboard() {
    const now = new Date();
    const day7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    const day30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    const [
      totalUsers,
      totalReferrers,
      totalMatches,
      pendingProfiles,
      newUsers7,
      newUsers30,
      newMatches7,
      newMatches30,
      cancelCount,
    ] = await Promise.all([
      this.prisma.user.count({ where: { cancelStatus: { not: 2 } } }),
      this.prisma.user.count({
        where: { cancelStatus: { not: 2 }, invitees: { some: {} } },
      }),
      this.prisma.matchRecord.count(),
      this.prisma.userProfilePending.count({ where: { status: 1 } }),
      this.prisma.user.count({ where: { createdAt: { gte: day7 } } }),
      this.prisma.user.count({ where: { createdAt: { gte: day30 } } }),
      this.prisma.matchRecord.count({ where: { matchedAt: { gte: day7 } } }),
      this.prisma.matchRecord.count({ where: { matchedAt: { gte: day30 } } }),
      this.prisma.user.count({ where: { cancelStatus: 1 } }),
    ]);

    return {
      totalUsers,
      totalReferrers,
      totalMatches,
      pendingProfiles,
      newUsers7d: newUsers7,
      newUsers30d: newUsers30,
      newMatches7d: newMatches7,
      newMatches30d: newMatches30,
      cancelCount,
      successRate:
        totalUsers === 0
          ? '0%'
          : `${((totalMatches / totalUsers) * 100).toFixed(2)}%`,
    };
  }
}