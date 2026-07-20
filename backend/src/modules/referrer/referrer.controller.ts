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
import { ReferrerService } from './referrer.service';
import { Roles, JwtPayload } from '@/common/decorators';

@ApiTags('referrer')
@Controller('api/v1')
export class ReferrerController {
  constructor(private readonly svc: ReferrerService) {}

  @Get('me/invite-code')
  @ApiOperation({ summary: '我的邀请码' })
  async myInviteCode(@Req() req: { user: JwtPayload }) {
    return this.svc.myInviteCode(BigInt(req.user.sub));
  }

  @Get('me/invites')
  @ApiOperation({ summary: '我邀请过的人' })
  async myInvitees(@Req() req: { user: JwtPayload }) {
    return this.svc.myInvitees(BigInt(req.user.sub));
  }
}

@ApiTags('admin-referrer')
@Controller('api/v1/admin/referrers')
export class AdminReferrerController {
  constructor(private readonly svc: ReferrerService) {}

  @Get()
  @ApiOperation({ summary: '介绍人列表（管理端）' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'keyword', required: false })
  async list(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('keyword') keyword?: string,
  ) {
    return this.svc.adminListReferrers(Number(page), Number(pageSize), keyword);
  }

  @Get(':id/invitees')
  @ApiOperation({ summary: '某介绍人邀请的用户' })
  async invitees(@Param('id') id: string) {
    return this.svc.adminInvitees(BigInt(id));
  }
}

@ApiTags('admin-user')
@Controller('api/v1/admin/users')
export class AdminUserReferrerController {
  constructor(private readonly svc: ReferrerService) {}

  @Post(':id/transfer-referrer')
  @Roles('super_admin')
  @ApiOperation({ summary: '转让介绍人（仅 super_admin）' })
  async transfer(
    @Req() req: { user: JwtPayload },
    @Param('id') id: string,
    @Body() body: { newReferrerId: string; reason: string },
  ) {
    return this.svc.transferReferrer(
      BigInt(id),
      BigInt(body.newReferrerId),
      BigInt(req.user.sub),
      body.reason,
    );
  }
}