import { Body, Controller, Get, Put, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtPayload, Public, Roles } from '@/common/decorators';
import { UpdateFeatureFlagsDto } from './features.dto';
import { FeaturesService } from './features.service';

@ApiTags('features')
@Controller('api/v1')
export class FeaturesController {
  constructor(private readonly features: FeaturesService) {}

  @Public()
  @Get('features')
  @ApiOperation({ summary: '用户端可用功能开关' })
  flags() {
    return this.features.getFlags();
  }

  @Roles('super_admin', 'operator')
  @Get('admin/features')
  @ApiOperation({ summary: '后台功能开关配置' })
  adminList() {
    return this.features.adminList();
  }

  @Roles('super_admin', 'operator')
  @Put('admin/features')
  @ApiOperation({ summary: '保存后台功能开关' })
  update(
    @Req() req: { user: JwtPayload },
    @Body() dto: UpdateFeatureFlagsDto,
  ) {
    return this.features.update(dto, BigInt(req.user.sub));
  }
}
