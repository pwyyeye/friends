import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { BizException } from "@/common/exceptions";
import { BizCode } from "@/common/constants";
@Injectable()
export class MatchService {
  constructor(private readonly prisma: PrismaService) {}
  async create(
    input: {
      profileAId: bigint;
      profileBId: bigint;
      referrerId?: bigint;
      matchedAt: Date;
      note?: string;
    },
    adminId: bigint,
  ) {
    if (input.profileAId === input.profileBId)
      throw new BizException(
        BizCode.MATCH_SAME_USER,
        "请选择两个不同孩子的资料",
      );
    return this.prisma.$transaction(async (tx) => {
      const profiles = await tx.childProfile.findMany({
        where: { id: { in: [input.profileAId, input.profileBId] } },
        include: { owner: true },
      });
      if (
        profiles.length !== 2 ||
        profiles.some(
          (p) =>
            p.profileStatus !== 2 ||
            !p.approvedPayload ||
            p.owner.status !== 1 ||
            p.owner.cancelStatus !== 0 ||
            p.matchmakingStatus !== "active",
        )
      )
        throw new BizException(
          BizCode.BAD_REQUEST,
          "只能为账号正常且审核通过的孩子建立牵线记录",
        );
      if (input.referrerId) {
        const r = await tx.user.findUnique({ where: { id: input.referrerId } });
        if (!r || !r.isReferrer || r.status !== 1 || r.cancelStatus !== 0)
          throw new BizException(BizCode.REFERRER_CODE_INVALID);
        if (profiles.some((p) => p.ownerAccountId === r.id))
          throw new BizException(BizCode.MATCH_REFERRER_CONFLICT);
      }
      const m = await tx.matchRecord.create({
        data: { ...input, createdBy: adminId },
      });
      await tx.auditLog.create({
        data: {
          adminId,
          action: "match.create",
          targetType: "match",
          targetId: m.id,
          payloadJson: {
            profileAId: String(input.profileAId),
            profileBId: String(input.profileBId),
            referrerId: input.referrerId ? String(input.referrerId) : null,
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
    const where: any = {};
    if (params.referrerId) where.referrerId = BigInt(params.referrerId);
    if (params.from || params.to)
      where.matchedAt = {
        ...(params.from ? { gte: new Date(params.from) } : {}),
        ...(params.to ? { lte: new Date(params.to) } : {}),
      };
    const take = Math.min(Math.max(params.pageSize || 20, 1), 100);
    const [total, rows] = await Promise.all([
      this.prisma.matchRecord.count({ where }),
      this.prisma.matchRecord.findMany({
        where,
        take,
        skip: (Math.max(params.page || 1, 1) - 1) * take,
        orderBy: { matchedAt: "desc" },
        include: {
          profileA: { include: { owner: true } },
          profileB: { include: { owner: true } },
          referrer: true,
          createdByAdmin: true,
        },
      }),
    ]);
    const child = (p: (typeof rows)[number]["profileA"]) => ({
      id: String(p.id),
      nickname: (p.approvedPayload as any)?.nickname || "未填写称呼",
      parentName: p.owner.nickname,
      phone: p.owner.phone.slice(0, 3) + "****" + p.owner.phone.slice(-4),
    });
    return {
      total,
      items: rows.map((m) => ({
        id: String(m.id),
        profileA: child(m.profileA),
        profileB: child(m.profileB),
        referrer: m.referrer
          ? { id: String(m.referrer.id), nickname: m.referrer.nickname }
          : null,
        matchedAt: m.matchedAt,
        note: m.note,
        createdBy: m.createdByAdmin.username,
      })),
    };
  }
}
