import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';

@Injectable()
export class ReferrerService {
  constructor(private readonly prisma: PrismaService) {}

  /** 用户端：我的邀请码 */
  async myInviteCode(userId: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { inviteCode: true, nickname: true, avatarOssKey: true },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    return {
      inviteCode: u.inviteCode,
      nickname: u.nickname,
      avatarOssKey: u.avatarOssKey,
    };
  }

  /** 用户端：我邀请过的人 */
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
      id: String(u.id),
      nickname: u.nickname,
      avatarOssKey: u.avatarOssKey,
      gender: u.gender,
      age: u.age,
      profileStatus: u.profileStatus,
      status: u.status,
      createdAt: u.createdAt,
    }));
  }

  /** 管理端：介绍人列表 */
  async adminListReferrers(page: number, pageSize: number, keyword?: string) {
    const skip = (page - 1) * pageSize;
    const where = keyword
      ? {
          OR: [
            { nickname: { contains: keyword } },
            { phone: { contains: keyword } },
            { inviteCode: { contains: keyword } },
          ],
        }
      : {};
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
          createdAt: true,
          _count: { select: { invitees: true } },
        },
      }),
    ]);
    return {
      total,
      items: items.map((u) => ({
        id: String(u.id),
        phone: u.phone ? u.phone.slice(0, 3) + '****' + u.phone.slice(-4) : null,
        nickname: u.nickname,
        inviteCode: u.inviteCode,
        status: u.status,
        profileStatus: u.profileStatus,
        inviteeCount: u._count.invitees,
        createdAt: u.createdAt,
      })),
    };
  }

  /** 管理端：某介绍人邀请的用户 */
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

  /** 管理端：转让介绍人 */
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
        select: { id: true, status: true, cancelStatus: true },
      }),
    ]);
    if (!user) throw new BizException(BizCode.USER_NOT_FOUND);
    if (!newRef || newRef.status !== 1) {
      throw new BizException(BizCode.REFERRER_CODE_INVALID, '目标介绍人不存在或已禁用');
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