import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { TokenExpiredError } from 'jsonwebtoken';
import { BizException } from './exceptions';
import { BizCode } from './constants';
import {
  IS_PUBLIC_KEY,
  ROLES_KEY,
  JwtPayload,
} from './decorators';

/**
 * JWT 鉴权守卫：
 * - @Public() 跳过
 * - @Roles('super_admin','operator') 限制角色
 * - 从 Authorization: Bearer xxx 提取 token
 * - 校验 jti 不在黑名单（可选，本期暂不在守卫里查表，留作日志告警）
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const auth = req.headers['authorization'] as string | undefined;
    if (!auth || !auth.toLowerCase().startsWith('bearer ')) {
      throw new BizException(BizCode.UNAUTHORIZED, '未登录', 401);
    }
    const token = auth.substring(7).trim();
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch (err) {
      // 区分"过期"和"签名/格式错误",便于排查
      if (err instanceof TokenExpiredError) {
        throw new BizException(BizCode.TOKEN_EXPIRED, 'token 已过期', 401);
      }
      throw new BizException(BizCode.UNAUTHORIZED, 'token 无效', 401);
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(payload.role)) {
        throw new BizException(BizCode.FORBIDDEN, '权限不足', 403);
      }
    }

    // 写入 req，供后续使用
    req.user = payload;
    return true;
  }
}