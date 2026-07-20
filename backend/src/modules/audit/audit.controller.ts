import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '@/prisma/prisma.service';
import { Roles } from '@/common/decorators';

@ApiTags('admin-audit')
@Controller('api/v1/admin/audit-logs')
@Roles('super_admin', 'operator')
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: '操作日志' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'adminId', required: false })
  async list(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 30,
    @Query('action') action?: string,
    @Query('adminId') adminId?: string,
  ) {
    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (adminId) where.adminId = BigInt(adminId);
    const skip = (Math.max(Number(page), 1) - 1) * Math.min(Math.max(Number(pageSize), 1), 200);
    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { username: true, role: true } } },
      }),
    ]);
    return {
      total,
      items: items.map((a) => ({
        id: String(a.id),
        admin: { username: a.admin?.username ?? null, role: a.admin?.role ?? null },
        action: a.action,
        targetType: a.targetType,
        targetId: a.targetId ? String(a.targetId) : null,
        payload: a.payloadJson,
        createdAt: a.createdAt,
      })),
    };
  }
}