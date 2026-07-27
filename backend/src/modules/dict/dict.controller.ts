import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '@/prisma/prisma.service';
import { Public, Roles } from '@/common/decorators';

@ApiTags('dict')
@Controller('api/v1/dict')
export class DictController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('cities')
  @ApiOperation({ summary: '城市字典（用户端公开）' })
  async cities() {
    return this.prisma.city.findMany({
      where: { status: 1 },
      orderBy: [{ level: 'asc' }, { pinyin: 'asc' }],
      select: {
        id: true,
        name: true,
        pinyin: true,
        province: true,
        level: true,
      },
    });
  }

  @Public()
  @Get('occupations')
  @ApiOperation({ summary: '职业字典（用户端公开）' })
  async occupations() {
    return this.prisma.occupation.findMany({
      where: { status: 1 },
      orderBy: [{ category: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, category: true },
    });
  }

  @Public()
  @Get('interest-tags')
  @ApiOperation({ summary: '兴趣标签字典（用户端公开）' })
  async interestTags() {
    return this.prisma.interestTag.findMany({
      where: { status: 1 },
      orderBy: [{ category: 'asc' }, { sort: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, category: true },
    });
  }
}

@ApiTags('admin-dict')
@Controller('api/v1/admin/dict')
@Roles('super_admin', 'operator')
export class AdminDictController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('cities')
  async cities() {
    return this.prisma.city.findMany({
      orderBy: [{ level: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        name: true,
        pinyin: true,
        province: true,
        level: true,
        status: true,
      },
    });
  }

  @Get('occupations')
  async occupations() {
    return this.prisma.occupation.findMany({
      orderBy: [{ id: 'asc' }],
      select: { id: true, name: true, category: true, status: true },
    });
  }

  @Get('interest-tags')
  async interestTags() {
    return this.prisma.interestTag.findMany({
      orderBy: [{ sort: 'asc' }, { id: 'asc' }],
      select: { id: true, name: true, category: true, sort: true, status: true },
    });
  }

  @Get('custom-interests')
  async customInterests() {
    return this.prisma.userCustomInterest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, nickname: true, phone: true } },
      },
    });
  }
}