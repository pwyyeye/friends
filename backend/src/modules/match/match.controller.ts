import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MatchService } from './match.service';
import { CreateMatchDto } from './match.dto';
import { Roles, JwtPayload } from '@/common/decorators';

@ApiTags('admin-match')
@Controller('api/v1/admin/matches')
export class AdminMatchController {
  constructor(private readonly svc: MatchService) {}

  @Post()
  @Roles('super_admin', 'operator')
  @ApiOperation({ summary: '新增牵线记录' })
  async create(@Req() req: { user: JwtPayload }, @Body() dto: CreateMatchDto) {
    return this.svc.create(
      {
        userAId: BigInt(dto.userAId),
        userBId: BigInt(dto.userBId),
        referrerId: BigInt(dto.referrerId),
        matchedAt: new Date(dto.matchedAt),
        note: dto.note,
      },
      BigInt(req.user.sub),
    );
  }

  @Get()
  @Roles('super_admin', 'operator')
  @ApiOperation({ summary: '牵线记录列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'referrerId', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  async list(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('referrerId') referrerId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.svc.adminList({
      page: Number(page),
      pageSize: Number(pageSize),
      referrerId,
      from,
      to,
    });
  }
}