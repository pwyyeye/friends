import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Public } from '@/common/decorators';
import { RegisterDto, LoginDto, AdminLoginDto } from './auth.dto';
import { JwtPayload } from '@/common/decorators';

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: '用户注册（含介绍人编码校验）' })
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '用户登录，返回 JWT' })
  async login(@Body() dto: LoginDto) {
    return this.auth.userLogin(dto.phone, dto.password);
  }
}

@ApiTags('admin-auth')
@Controller('api/v1/admin/auth')
export class AdminAuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '管理员登录' })
  async login(@Body() dto: AdminLoginDto) {
    return this.auth.adminLogin(dto.username, dto.password);
  }
}

@ApiTags('auth')
@Controller('api/v1/auth')
export class AuthMeController {
  constructor(private readonly auth: AuthService) {}

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: '登出（token 拉黑）' })
  async logout(@Req() req: { user: JwtPayload }) {
    const jti = req.user?.jti;
    const sub = req.user?.sub;
    const isAdmin = req.user?.role !== 'user';
    await this.auth.logout(jti ?? '', sub, isAdmin ? sub : undefined);
    return { ok: true };
  }
}