import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtPayload, Roles } from '@/common/decorators';
import {
  NotificationSettingDto,
  SocialListQueryDto,
} from './social.dto';
import { SocialService } from './social.service';

@ApiTags('social')
@Controller('api/v1/social')
@Roles('user')
export class SocialController {
  constructor(private readonly social: SocialService) {}

  @Get('summary')
  @ApiOperation({ summary: '互动记录统计与未读状态' })
  summary(@Req() req: { user: JwtPayload }) {
    return this.social.summary(BigInt(req.user.sub));
  }

  @Get('activities')
  @ApiOperation({ summary: '收藏、浏览、了解意向和点赞记录' })
  list(
    @Req() req: { user: JwtPayload },
    @Query() query: SocialListQueryDto,
  ) {
    return this.social.list(BigInt(req.user.sub), query.kind);
  }

  @Post('profiles/:profileId/:kind')
  @HttpCode(200)
  @ApiOperation({ summary: '记录资料互动' })
  record(
    @Req() req: { user: JwtPayload },
    @Param('profileId') profileId: string,
    @Param('kind') kind: string,
  ) {
    return this.social.record(BigInt(req.user.sub), profileId, kind);
  }

  @Delete('profiles/:profileId/:kind')
  @ApiOperation({ summary: '取消资料互动' })
  remove(
    @Req() req: { user: JwtPayload },
    @Param('profileId') profileId: string,
    @Param('kind') kind: string,
  ) {
    return this.social.remove(BigInt(req.user.sub), profileId, kind);
  }

  @Put('notifications')
  @ApiOperation({ summary: '保存站内通知开关' })
  notifications(
    @Req() req: { user: JwtPayload },
    @Body() dto: NotificationSettingDto,
  ) {
    return this.social.updateNotifications(
      BigInt(req.user.sub),
      dto.enabled,
    );
  }
}
