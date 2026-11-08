import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { UserService } from "./user.service";
import { UpdateUserDto } from "./user.dto";
import { JwtPayload, Roles } from "@/common/decorators";
import { ProfileService } from "@/modules/profile/profile.service";

@ApiTags("user")
@Controller("api/v1")
@Roles("user")
export class UserController {
  constructor(
    private readonly user: UserService,
    private readonly profile: ProfileService,
  ) {}

  @Get("me")
  @ApiOperation({ summary: "我的基本信息" })
  async me(@Req() req: { user: JwtPayload }) {
    return this.user.me(BigInt(req.user.sub));
  }

  @Get("profile")
  @ApiOperation({ summary: "我的资料（已通过的版本）" })
  async myProfile(@Req() req: { user: JwtPayload }) {
    return this.user.myProfile(BigInt(req.user.sub));
  }

  @Put("me")
  @ApiOperation({ summary: "修改家长称呼" })
  async updateProfile(
    @Req() req: { user: JwtPayload },
    @Body() dto: UpdateUserDto,
  ) {
    return this.user.updateAccount(BigInt(req.user.sub), dto.nickname);
  }

  @Post("account/cancel")
  @HttpCode(200)
  @ApiOperation({ summary: "申请注销（30 天冷静期）" })
  async cancel(@Req() req: { user: JwtPayload }) {
    return this.user.requestCancel(BigInt(req.user.sub));
  }
}
