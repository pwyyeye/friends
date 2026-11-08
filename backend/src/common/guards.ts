import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { TokenExpiredError } from "jsonwebtoken";
import { BizException } from "./exceptions";
import { BizCode } from "./constants";
import { IS_PUBLIC_KEY, ROLES_KEY, JwtPayload } from "./decorators";

/**
 * JWT 鉴权守卫：
 * - @Public() 跳过
 * - @Roles('super_admin','operator') 限制角色
 * - 从 Authorization: Bearer xxx 提取 token
 * - 校验账号状态及退出登录后的 token 黑名单
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest();
    const auth = req.headers["authorization"] as string | undefined;
    if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
      throw new BizException(BizCode.UNAUTHORIZED, "未登录", 401);
    }
    const token = auth.substring(7).trim();
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        audience: "friends-parent-v1",
      });
    } catch (err) {
      // 区分"过期"和"签名/格式错误",便于排查
      if (err instanceof TokenExpiredError) {
        throw new BizException(BizCode.TOKEN_EXPIRED, "token 已过期", 401);
      }
      throw new BizException(BizCode.UNAUTHORIZED, "token 无效", 401);
    }

    const requiredRoles = this.reflector.getAllAndOverride<
      string[] | undefined
    >(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (requiredRoles && requiredRoles.length > 0) {
      if (!requiredRoles.includes(payload.role)) {
        throw new BizException(BizCode.FORBIDDEN, "权限不足", 403);
      }
    }

    if (
      !/^\d+$/.test(payload.sub) ||
      !payload.jti ||
      (await this.prisma.tokenBlacklist.findUnique({
        where: { jti: payload.jti },
      }))
    )
      throw new BizException(BizCode.UNAUTHORIZED, "登录已失效", 401);
    const account =
      payload.role === "user"
        ? await this.prisma.user.findUnique({
            where: { id: BigInt(payload.sub) },
          })
        : await this.prisma.admin.findUnique({
            where: { id: BigInt(payload.sub) },
          });
    if (
      !account ||
      account.status !== 1 ||
      ("cancelStatus" in account && account.cancelStatus !== 0) ||
      ("role" in account && account.role !== payload.role) ||
      (payload.role === "user" &&
        ("authVersion" in account
          ? account.authVersion !== (payload.authVersion ?? 0)
          : true))
    )
      throw new BizException(
        BizCode.UNAUTHORIZED,
        "账号不可用，请重新登录",
        401,
      );

    // 写入 req，供后续使用
    req.user = payload;
    return true;
  }
}
