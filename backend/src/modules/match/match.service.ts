import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';

@Injectable()
export class MatchService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    input: {
      userAId: bigint;
      userBId: bigint;
      referrerId: bigint;
      matchedAt: Date;
      note?: string;
    },
    adminId: bigint,
  ) {
    if (input.userAId === input.userBId) {
      throw new BizException(BizCode.MATCH_SAME_USER);
    }
    if (
      input.referrerId === input.userAId ||
      input.referrerId === input.userBId
    ) {
      throw new BizException(BizCode.MATCH_REFERRER_CONFLICT);
    }

    const [a, b, r] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: input.userAId },
        select: { id: true, status: true },
      }),
      this.prisma.user.findUnique({
        where: { id: input.userBId },
        select: { id: true, status: true },
      }),
      this.prisma.user.findUnique({
        where: { id: input.referrerId },
        select: { id: true, status: true },
      }),
    ]);
    if (!a || !b || !r) {
      throw new BizException(BizCode.USER_NOT_FOUND, '相关用户不存在');
    }
    if (a.status !== 1 || b.status !== 1 || r.status !== 1) {
      throw new BizException(BizCode.USER_DISABLED, '存在已禁用账号');
    }

    return this.prisma.$transaction(async (tx) => {
      const m = await tx.matchRecord.create({
        data: {
          userAId: input.userAId,
          userBId: input.userBId,
          referrerId: input.referrerId,
          matchedAt: input.matchedAt,
          note: input.note,
          createdBy: adminId,
        },
      });
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'match.create',
          targetType: 'match',
          targetId: m.id,
          payloadJson: {
            userAId: String(input.userAId),
            userBId: String(input.userBId),
            referrerId: String(input.referrerId),
            matchedAt: input.matchedAt.toISOString(),
          },
        },
      });
      return { id: String(m.id) };
    });
  }

  async adminList(params: {
    page: number;
    pageSize: number;
    referrerId?: string;
    from?: string;
    to?: string;
  }) {
    const where: Record<string, unknown> = {};
    if (params.referrerId) where.referrerId = BigInt(params.referrerId);
    if (params.from || params.to) {
      where.matchedAt = {
        ...(params.from ? { gte: new Date(params.from) } : {}),
        ...(params.to ? { lte: new Date(params.to) } : {}),
      };
    }
    const skip = (params.page - 1) * params.pageSize;
    const [total, items] = await Promise.all([
      this.prisma.matchRecord.count({ where }),
      this.prisma.matchRecord.findMany({
        where,
        orderBy: { matchedAt: 'desc' },
        skip,
        take: params.pageSize,
        include: {
          userA: { select: { id: true, nickname: true, phone: true } },
          userB: { select: { id: true, nickname: true, phone: true } },
          referrer: { select: { id: true, nickname: true, inviteCode: true } },
          createdByAdmin: { select: { username: true } },
        },
      }),
    ]);
    return {
      total,
      items: items.map((m) => ({
        id: String(m.id),
        userA: {
          id: String(m.userA.id),
          nickname: m.userA.nickname,
          phone: m.userA.phone
            ? m.userA.phone.slice(0, 3) + '****' + m.userA.phone.slice(-4)
            : null,
        },
        userB: {
          id: String(m.userB.id),
          nickname: m.userB.nickname,
          phone: m.userB.phone
            ? m.userB.phone.slice(0, 3) + '****' + m.userB.phone.slice(-4)
            : null,
        },
        referrer: {
          id: String(m.referrer.id),
          nickname: m.referrer.nickname,
          inviteCode: m.referrer.inviteCode,
        },
        matchedAt: m.matchedAt,
        note: m.note,
        createdBy: m.createdByAdmin.username,
        createdAt: m.createdAt,
      })),
    };
  }
}