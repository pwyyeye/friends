import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProfileService } from './profile.service';
import { SubmitProfileDto, RejectProfileDto } from './profile.dto';
import { Roles, JwtPayload } from '@/common/decorators';

@ApiTags('profile')
@Controller('api/v1/profile')
export class ProfileController {
  constructor(private readonly svc: ProfileService) {}

  @Post('submit')
  @ApiOperation({ summary: '提交资料进入待审核' })
  async submit(@Req() req: { user: JwtPayload }, @Body() dto: SubmitProfileDto) {
    return this.svc.submit(BigInt(req.user.sub), dto);
  }

  @Get('status')
  @ApiOperation({ summary: '我的资料审核状态' })
  async status(@Req() req: { user: JwtPayload }) {
    return this.svc.myStatus(BigInt(req.user.sub));
  }
}

@ApiTags('admin-profile')
@Controller('api/v1/admin/profiles/pending')
export class AdminProfileController {
  constructor(private readonly svc: ProfileService) {}

  @Get()
  @Roles('super_admin', 'operator')
  @ApiOperation({ summary: '待审核资料列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  async list(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
  ) {
    return this.svc.adminPendingList(Number(page), Number(pageSize));
  }

  @Get(':id')
  @Roles('super_admin', 'operator')
  @ApiOperation({ summary: '待审核详情' })
  async detail(@Param('id') id: string) {
    return this.svc.adminPendingDetail(BigInt(id));
  }

  @Post(':id/approve')
  @Roles('super_admin', 'operator')
  @ApiOperation({ summary: '审核通过' })
  async approve(@Req() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.svc.approve(BigInt(id), BigInt(req.user.sub));
  }

  @Post(':id/reject')
  @Roles('super_admin', 'operator')
  @ApiOperation({ summary: '审核驳回（带原因）' })
  async reject(
    @Req() req: { user: JwtPayload },
    @Param('id') id: string,
    @Body() body: RejectProfileDto,
  ) {
    return this.svc.reject(BigInt(id), BigInt(req.user.sub), body.reason);
  }
}