import { Controller, Get, Param, Query, Req } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtPayload, Roles } from '@/common/decorators';
import { RecommendationQueryDto } from './recommendation.dto';
import { RecommendationService } from './recommendation.service';

@ApiTags('recommendations')
@Controller('api/v1/recommendations')
@Roles('user')
export class RecommendationController {
  constructor(private readonly recommendations: RecommendationService) {}
  @Get()
  today(@Req() req: { user: JwtPayload }, @Query() query: RecommendationQueryDto) {
    return this.recommendations.today(BigInt(req.user.sub), query);
  }
  @Get(':id')
  detail(@Req() req: { user: JwtPayload }, @Param('id') id: string) {
    return this.recommendations.detail(BigInt(req.user.sub), id);
  }
}
