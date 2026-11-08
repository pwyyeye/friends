import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Req,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { Public } from "@/common/decorators";
import {
  RegisterDto,
  LoginDto,
  AdminLoginDto,
  SendSmsDto,
  VerifySmsDto,
  SmsLoginDto,
} from "./auth.dto";
import { JwtPayload } from "@/common/decorators";
import { PrismaService } from "@/prisma/prisma.service";
import { BizException } from "@/common/exceptions";
import { BizCode } from "@/common/constants";

@ApiTags("auth")
@Controller("api/v1/auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get("methods")
  methods() {
    return { password: true, sms: false, smsProvider: "disabled" };
  }

  @Public()
  @Get("invite/:code")
  async invite(@Param("code") code: string) {
    if (!/^\d{6}$/.test(code))
      throw new BizException(BizCode.REFERRER_CODE_INVALID);
    const account = await this.prisma.user.findUnique({
      where: { inviteCode: code },
      select: { nickname: true, status: true, cancelStatus: true },
    });
    if (!account || account.status !== 1 || account.cancelStatus !== 0)
      throw new BizException(BizCode.REFERRER_CODE_INVALID);
    return { nickname: account.nickname, inviteCode: code };
  }

  // Reserved contracts: replace the disabled gateway when a real SMS provider is configured.
  private smsUnavailable(): never {
    throw new BizException(
      BizCode.EXTERNAL_DEPENDENCY_ERROR,
      "短信验证码暂未启用，请使用手机号和密码",
      503,
    );
  }

  @Public()
  @Post("sms/send")
  @ApiOperation({ summary: "预留：发送短信验证码（当前关闭）" })
  sendSms(@Body() _dto: SendSmsDto) {
    return this.smsUnavailable();
  }

  @Public()
  @Post("sms/verify")
  @ApiOperation({ summary: "预留：校验短信验证码（当前关闭）" })
  verifySms(@Body() _dto: VerifySmsDto) {
    return this.smsUnavailable();
  }

  @Public()
  @Post("sms/login")
  @ApiOperation({ summary: "预留：验证码登录/注册（当前关闭）" })
  smsLogin(@Body() _dto: SmsLoginDto) {
    return this.smsUnavailable();
  }

  @Public()
  @Post("register")
  @ApiOperation({ summary: "用户注册（含介绍人编码校验）" })
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "用户登录，返回 JWT" })
  async login(@Body() dto: LoginDto) {
    return this.auth.userLogin(dto.phone, dto.password);
  }
}

@ApiTags("admin-auth")
@Controller("api/v1/admin/auth")
export class AdminAuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  @ApiOperation({ summary: "管理员登录" })
  async login(@Body() dto: AdminLoginDto) {
    return this.auth.adminLogin(dto.username, dto.password);
  }
}

@ApiTags("auth")
@Controller("api/v1/auth")
export class AuthMeController {
  constructor(private readonly auth: AuthService) {}

  @Post("logout")
  @HttpCode(200)
  @ApiOperation({ summary: "登出（token 拉黑）" })
  async logout(@Req() req: { user: JwtPayload }) {
    const jti = req.user?.jti;
    const sub = req.user?.sub;
    const isAdmin = req.user?.role !== "user";
    await this.auth.logout(
      jti ?? "",
      isAdmin ? undefined : sub,
      isAdmin ? sub : undefined,
      req.user.exp,
    );
    return { ok: true };
  }
}
