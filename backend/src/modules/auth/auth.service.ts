import { randomUUID } from "crypto";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "@/prisma/prisma.service";
import { BizException } from "@/common/exceptions";
import { BizCode } from "@/common/constants";
import { JwtPayload } from "@/common/decorators";

const BCRYPT_COST = 12;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * 生成 6 位数字邀请码，冲突重试
   */
  private async generateInviteCode(): Promise<string> {
    const MAX = 5;
    for (let i = 0; i < MAX; i++) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const exists = await this.prisma.user.findUnique({
        where: { inviteCode: code },
        select: { id: true },
      });
      if (!exists) return code;
    }
    throw new BizException(BizCode.REFERRER_CODE_CONFLICT);
  }

  async register(input: {
    phone: string;
    password: string;
    inviteCode?: string;
    nickname?: string;
  }) {
    const code = (input.inviteCode ?? "").trim();
    let referrerId: bigint | null = null;

    if (code) {
      // 填了邀请码：必须能命中一个状态正常的介绍人
      const referrer = await this.prisma.user.findUnique({
        where: { inviteCode: code },
        select: { id: true, status: true, cancelStatus: true },
      });
      if (!referrer) {
        throw new BizException(BizCode.REFERRER_CODE_INVALID, "邀请码无效");
      }
      if (referrer.status !== 1 || referrer.cancelStatus !== 0) {
        throw new BizException(BizCode.USER_DISABLED, "介绍人账号已被禁用");
      }
      referrerId = referrer.id;
    }
    // 未填邀请码：referrerId 保持 null，不绑定介绍人

    const exists = await this.prisma.user.findUnique({
      where: { phone: input.phone },
      select: { id: true },
    });
    if (exists) {
      throw new BizException(BizCode.USER_PHONE_REGISTERED);
    }

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_COST);
    const inviteCode = await this.generateInviteCode();

    const user = await this.prisma.user.create({
      data: {
        phone: input.phone,
        passwordHash,
        nickname: input.nickname ?? null,
        referrerId,
        inviteCode,
        status: 1,
        termsVersion: "2026-10-06",
        termsAcceptedAt: new Date(),
      },
      select: { id: true, phone: true, inviteCode: true, referrerId: true },
    });

    return this.userLogin(input.phone, input.password);
  }

  async userLogin(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        passwordHash: true,
        status: true,
        authVersion: true,
        cancelStatus: true,
        nickname: true,
        phone: true,
        inviteCode: true,
        avatarOssKey: true,
      },
    });
    if (!user) throw new BizException(BizCode.USER_INVALID_PASSWORD);
    if (user.cancelStatus !== 0) throw new BizException(BizCode.USER_CANCELING);
    if (user.status !== 1) throw new BizException(BizCode.USER_DISABLED);

    const ok =
      user.passwordHash && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) throw new BizException(BizCode.USER_INVALID_PASSWORD);

    const token = await this.signToken({
      sub: String(user.id),
      role: "user",
      authVersion: user.authVersion,
    });

    return {
      accessToken: token,
      user: {
        id: String(user.id),
        phone: user.phone,
        nickname: user.nickname,
        inviteCode: user.inviteCode,
        avatarOssKey: user.avatarOssKey,
      },
    };
  }

  async adminLogin(username: string, password: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { username },
      select: {
        id: true,
        passwordHash: true,
        role: true,
        status: true,
      },
    });
    if (!admin || admin.status !== 1) {
      throw new BizException(BizCode.USER_INVALID_PASSWORD);
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) throw new BizException(BizCode.USER_INVALID_PASSWORD);

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const token = await this.signToken({
      sub: String(admin.id),
      role: admin.role as "super_admin" | "operator",
    });

    return {
      accessToken: token,
      admin: {
        id: String(admin.id),
        username,
        role: admin.role,
      },
    };
  }

  async logout(jti: string, userId?: string, adminId?: string, exp?: number) {
    if (!jti) return;
    const expiresAt = new Date(
      (exp ?? Math.floor(Date.now() / 1000) + 7 * 86400) * 1000,
    );
    await this.prisma.tokenBlacklist.upsert({
      where: { jti },
      update: {},
      create: {
        jti,
        userId: userId ? BigInt(userId) : null,
        adminId: adminId ? BigInt(adminId) : null,
        expiresAt,
      },
    });
  }

  private async signToken(
    payload: Omit<JwtPayload, "iat" | "exp">,
  ): Promise<string> {
    // secret/expiresIn 由 app.module 中全局注册的 JwtModule 注入,
    // 不在这里重复传 secret,避免双实例导致签发/校验 secret 不一致
    return this.jwtService.signAsync(
      { ...payload, jti: randomUUID() },
      { audience: "friends-parent-v1" },
    );
  }
}
