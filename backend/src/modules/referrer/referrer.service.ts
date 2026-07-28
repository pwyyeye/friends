import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';

const BCRYPT_COST = 12;

@Injectable()
export class ReferrerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // ===================== 私有工具 =====================

  /** 拼出 H5 注册链接 */
  private buildInviteUrl(code: string): string {
    const base =
      this.config.get<string>('H5_PUBLIC_URL') ?? 'http://localhost:5173';
    return `${base.replace(/\/$/, '')}/#/register?code=${code}`;
  }

  /** 生成 6 位数字邀请码，冲突时重试 */
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

  /** 8 位字母+数字随机密码（去歧义字符） */
  private generateRandomPassword(): string {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  }

  /** 渲染二维码 PNG */
  private async makeQrcode(code: string): Promise<Buffer> {
    const url = this.buildInviteUrl(code);
    return QRCode.toBuffer(url, {
      type: 'png',
      width: 320,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#1f2937', light: '#ffffff' },
    });
  }

  /** 通用：脱敏手机号 */
  private maskPhone(p?: string | null) {
    return p ? p.slice(0, 3) + '****' + p.slice(-4) : null;
  }

  // ===================== 用户端 =====================

  /** 我的邀请码 + 推广链接 */
  async myInviteCode(userId: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        inviteCode: true,
        nickname: true,
        avatarOssKey: true,
        isReferrer: true,
        status: true,
      },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    return {
      inviteCode: u.inviteCode,
      nickname: u.nickname,
      avatarOssKey: u.avatarOssKey,
      isReferrer: u.isReferrer,
      status: u.status,
      inviteUrl: u.inviteCode ? this.buildInviteUrl(u.inviteCode) : null,
    };
  }

  /** 我邀请过的人 */
  async myInvitees(userId: bigint) {
    const list = await this.prisma.user.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nickname: true,
        avatarOssKey: true,
        gender: true,
        age: true,
        profileStatus: true,
        status: true,
        createdAt: true,
      },
    });
    return list.map((u) => ({
      ...u,
      id: String(u.id),
    }));
  }

  /** 我的推广二维码 PNG（已登录用户） */
  async myInviteQrcode(userId: bigint): Promise<Buffer> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { inviteCode: true, status: true },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    if (u.status !== 1) throw new BizException(BizCode.USER_DISABLED, '账号已被禁用');
    if (!u.inviteCode) throw new BizException(BizCode.REFERRER_CODE_INVALID, '邀请码不存在');
    return this.makeQrcode(u.inviteCode);
  }

  // ===================== 管理端 =====================

  /** 介绍人列表（isReferrer=true） */
  async adminListReferrers(page: number, pageSize: number, keyword?: string) {
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = { isReferrer: true };
    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword } },
        { phone: { contains: keyword } },
        { inviteCode: { contains: keyword } },
      ];
    }
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          phone: true,
          nickname: true,
          inviteCode: true,
          status: true,
          profileStatus: true,
          isReferrer: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { invitees: true } },
        },
      }),
    ]);
    return {
      total,
      items: items.map((u) => ({
        id: String(u.id),
        phone: this.maskPhone(u.phone),
        nickname: u.nickname,
        inviteCode: u.inviteCode,
        status: u.status,
        profileStatus: u.profileStatus,
        isReferrer: u.isReferrer,
        inviteeCount: u._count.invitees,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
    };
  }

  /** 待发展介绍人（isReferrer=false） */
  async adminListCandidates(page: number, pageSize: number, keyword?: string) {
    const skip = (page - 1) * pageSize;
    const where: Record<string, unknown> = { isReferrer: false };
    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword } },
        { phone: { contains: keyword } },
        { inviteCode: { contains: keyword } },
      ];
    }
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true,
          phone: true,
          nickname: true,
          inviteCode: true,
          status: true,
          profileStatus: true,
          isReferrer: true,
          createdAt: true,
        },
      }),
    ]);
    return {
      total,
      items: items.map((u) => ({
        id: String(u.id),
        phone: this.maskPhone(u.phone),
        nickname: u.nickname,
        inviteCode: u.inviteCode,
        status: u.status,
        profileStatus: u.profileStatus,
        isReferrer: u.isReferrer,
        createdAt: u.createdAt,
      })),
    };
  }

  /** 介绍人详情 */
  async adminGetReferrer(id: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        phone: true,
        nickname: true,
        inviteCode: true,
        status: true,
        profileStatus: true,
        isReferrer: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { invitees: true } },
      },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    return {
      id: String(u.id),
      phone: u.phone,
      nickname: u.nickname,
      inviteCode: u.inviteCode,
      status: u.status,
      profileStatus: u.profileStatus,
      isReferrer: u.isReferrer,
      inviteeCount: u._count.invitees,
      inviteUrl: u.inviteCode ? this.buildInviteUrl(u.inviteCode) : null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    };
  }

  /** 新建介绍人（手机号已注册则直接升级；未注册则创建账号） */
  async adminCreateReferrer(input: {
    phone: string;
    nickname: string;
    password?: string;
    adminId: bigint;
  }) {
    const exists = await this.prisma.user.findUnique({
      where: { phone: input.phone },
      select: { id: true, inviteCode: true, status: true },
    });
    let user: {
      id: bigint;
      phone: string;
      nickname: string | null;
      inviteCode: string | null;
      isReferrer: boolean;
      status: number;
    };
    let initialPassword: string | null = null;
    if (exists) {
      if (exists.status === 0) {
        throw new BizException(BizCode.USER_DISABLED, '该手机号已被禁用，请先启用');
      }
      user = await this.prisma.user.update({
        where: { id: exists.id },
        data: {
          isReferrer: true,
          nickname: input.nickname,
          // 没有邀请码时补一个
          ...(exists.inviteCode ? {} : { inviteCode: await this.generateInviteCode() }),
        },
      });
    } else {
      initialPassword = input.password?.trim() || this.generateRandomPassword();
      const passwordHash = await bcrypt.hash(initialPassword, BCRYPT_COST);
      const inviteCode = await this.generateInviteCode();
      user = await this.prisma.user.create({
        data: {
          phone: input.phone,
          passwordHash,
          nickname: input.nickname,
          inviteCode,
          isReferrer: true,
          status: 1,
          profileStatus: 0,
        },
      });
    }
    await this.prisma.auditLog.create({
      data: {
        adminId: input.adminId,
        action: 'referrer.create',
        targetType: 'user',
        targetId: user.id,
        payloadJson: {
          phone: input.phone,
          nickname: input.nickname,
          upgraded: !!exists,
        },
      },
    });
    return {
      id: String(user.id),
      phone: user.phone,
      nickname: user.nickname,
      inviteCode: user.inviteCode,
      isReferrer: user.isReferrer,
      upgraded: !!exists,
      initialPassword,
    };
  }

  /** 编辑介绍人 */
  async adminUpdateReferrer(
    id: bigint,
    body: { nickname?: string; status?: number },
    adminId: bigint,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, isReferrer: true, status: true },
    });
    if (!target) throw new BizException(BizCode.USER_NOT_FOUND);
    if (!target.isReferrer) {
      throw new BizException(BizCode.FORBIDDEN, '该用户不是介绍人');
    }
    const data: Record<string, unknown> = {};
    if (body.nickname !== undefined) data.nickname = body.nickname;
    if (body.status !== undefined) data.status = body.status;
    const updated = await this.prisma.user.update({ where: { id }, data });
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: body.status === 0 ? 'referrer.disable' : 'referrer.update',
        targetType: 'user',
        targetId: id,
        payloadJson: body as object,
      },
    });
    return {
      id: String(updated.id),
      nickname: updated.nickname,
      status: updated.status,
      isReferrer: updated.isReferrer,
    };
  }

  /** 提升为介绍人（给已存在的用户挂 isReferrer=true 并补齐 inviteCode） */
  async adminPromoteReferrer(id: bigint, adminId: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, isReferrer: true, inviteCode: true, status: true },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    if (u.status === 0) {
      throw new BizException(BizCode.USER_DISABLED, '账号已被禁用，无法设为介绍人');
    }
    if (u.isReferrer) {
      return {
        id: String(u.id),
        inviteCode: u.inviteCode,
        isReferrer: true,
        inviteUrl: u.inviteCode ? this.buildInviteUrl(u.inviteCode) : null,
        already: true,
      };
    }
    const inviteCode = u.inviteCode ?? (await this.generateInviteCode());
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isReferrer: true, inviteCode },
    });
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'referrer.promote',
        targetType: 'user',
        targetId: id,
        payloadJson: { inviteCode },
      },
    });
    return {
      id: String(updated.id),
      inviteCode: updated.inviteCode,
      isReferrer: true,
      inviteUrl: updated.inviteCode ? this.buildInviteUrl(updated.inviteCode) : null,
      already: false,
    };
  }

  /** 取消介绍人身份 */
  async adminDemoteReferrer(id: bigint, adminId: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, isReferrer: true, _count: { select: { invitees: true } } },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    if (!u.isReferrer) {
      throw new BizException(BizCode.FORBIDDEN, '该用户不是介绍人');
    }
    if (u._count.invitees > 0) {
      throw new BizException(
        BizCode.FORBIDDEN,
        `该介绍人已有 ${u._count.invitees} 名邀请用户，请先转让后再降级`,
      );
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isReferrer: false },
    });
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'referrer.demote',
        targetType: 'user',
        targetId: id,
        payloadJson: {},
      },
    });
    return { id: String(updated.id), isReferrer: false };
  }

  /** 某介绍人邀请的用户 */
  async adminInvitees(referrerId: bigint) {
    return this.prisma.user.findMany({
      where: { referrerId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        phone: true,
        nickname: true,
        gender: true,
        age: true,
        profileStatus: true,
        status: true,
        createdAt: true,
      },
    });
  }

  /** 某介绍人的推广二维码 PNG */
  async adminInviteQrcode(id: bigint, opts: { force?: boolean } = {}): Promise<Buffer> {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: { inviteCode: true, isReferrer: true },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    if (!u.inviteCode) throw new BizException(BizCode.REFERRER_CODE_INVALID, '邀请码不存在');
    if (!opts.force && !u.isReferrer) {
      throw new BizException(BizCode.FORBIDDEN, '该用户不是介绍人');
    }
    return this.makeQrcode(u.inviteCode);
  }

  /** 推广链接（JSON，给前端做兜底展示） */
  async adminInviteUrl(id: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id },
      select: { inviteCode: true, isReferrer: true, nickname: true, status: true },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    if (!u.inviteCode) throw new BizException(BizCode.REFERRER_CODE_INVALID, '邀请码不存在');
    return {
      inviteCode: u.inviteCode,
      inviteUrl: this.buildInviteUrl(u.inviteCode),
      isReferrer: u.isReferrer,
      nickname: u.nickname,
      status: u.status,
    };
  }

  /** 转让介绍人 */
  async transferReferrer(
    userId: bigint,
    newReferrerId: bigint,
    adminId: bigint,
    reason: string,
  ) {
    if (userId === newReferrerId) {
      throw new BizException(BizCode.MATCH_REFERRER_CONFLICT, '不能转给自己');
    }
    const [user, newRef] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, referrerId: true, cancelStatus: true },
      }),
      this.prisma.user.findUnique({
        where: { id: newReferrerId },
        select: { id: true, status: true, cancelStatus: true, isReferrer: true },
      }),
    ]);
    if (!user) throw new BizException(BizCode.USER_NOT_FOUND);
    if (!newRef || newRef.status !== 1 || !newRef.isReferrer) {
      throw new BizException(
        BizCode.REFERRER_CODE_INVALID,
        '目标介绍人不存在、未启用或非介绍人',
      );
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { referrerId: newReferrerId },
      });
      await tx.referrerHistory.create({
        data: {
          userId,
          oldReferrerId: user.referrerId,
          newReferrerId,
          reason,
          operatedBy: adminId,
        },
      });
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'user.transfer_referrer',
          targetType: 'user',
          targetId: userId,
          payloadJson: {
            oldReferrerId: user.referrerId ? String(user.referrerId) : null,
            newReferrerId: String(newReferrerId),
            reason,
          },
        },
      });
      return { ok: true };
    });
  }
}
