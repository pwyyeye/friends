import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';
import { RecommendationService } from '@/modules/profile/recommendation.service';
import { FeaturesService } from '@/modules/features/features.service';
import {
  SOCIAL_INTERACTION_KINDS,
  SocialInteractionKind,
} from './social.dto';

@Injectable()
export class SocialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly recommendations: RecommendationService,
    private readonly features: FeaturesService,
  ) {}

  private validKind(kind: string): SocialInteractionKind {
    if (!SOCIAL_INTERACTION_KINDS.includes(kind as SocialInteractionKind)) {
      throw new BizException(BizCode.BAD_REQUEST, '不支持的互动类型');
    }
    return kind as SocialInteractionKind;
  }

  private async target(userId: bigint, profileId: string) {
    if (!/^\d+$/.test(profileId)) {
      throw new BizException(BizCode.PROFILE_NOT_FOUND, '资料不存在', 404);
    }
    const profile = await this.prisma.childProfile.findFirst({
      where: {
        id: BigInt(profileId),
        ownerAccountId: { not: userId },
        profileStatus: 2,
        approvedPayload: { not: Prisma.DbNull },
        matchmakingStatus: 'active',
        owner: { status: 1, cancelStatus: 0 },
      },
      select: { id: true },
    });
    if (!profile) {
      throw new BizException(BizCode.PROFILE_NOT_FOUND, '资料不存在', 404);
    }
    return profile.id;
  }

  async record(userId: bigint, profileId: string, kindValue: string) {
    const kind = this.validKind(kindValue);
    await this.assertKindEnabled(kind);
    const targetProfileId = await this.target(userId, profileId);
    const now = new Date();
    await this.prisma.profileInteraction.upsert({
      where: {
        actorUserId_targetProfileId_kind: {
          actorUserId: userId,
          targetProfileId,
          kind,
        },
      },
      create: { actorUserId: userId, targetProfileId, kind },
      update: { updatedAt: now },
    });
    return { profileId: String(targetProfileId), kind, active: true };
  }

  async remove(userId: bigint, profileId: string, kindValue: string) {
    const kind = this.validKind(kindValue);
    await this.assertKindEnabled(kind);
    if (!/^\d+$/.test(profileId)) {
      throw new BizException(BizCode.PROFILE_NOT_FOUND, '资料不存在', 404);
    }
    await this.prisma.profileInteraction.deleteMany({
      where: {
        actorUserId: userId,
        targetProfileId: BigInt(profileId),
        kind,
      },
    });
    return { profileId, kind, active: false };
  }

  async list(
    userId: bigint,
    kindValue: SocialInteractionKind = 'favorite',
  ) {
    const kind = this.validKind(kindValue);
    await this.assertKindEnabled(kind);
    const interactions = await this.prisma.profileInteraction.findMany({
      where: { actorUserId: userId, kind },
      orderBy: { updatedAt: 'desc' },
      take: 100,
      select: {
        targetProfileId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const cards = await this.recommendations.cardsByIds(
      userId,
      interactions.map(item => String(item.targetProfileId)),
    );
    const times = new Map(
      interactions.map(item => [
        String(item.targetProfileId),
        item.updatedAt,
      ]),
    );
    const items: Array<Record<string, unknown> & { id: string }> = [];
    for (const card of cards) {
      if (!card) continue;
      const profileCard = card as unknown as Record<string, unknown> & {
        id: string;
      };
      items.push({
        ...profileCard,
        interactedAt: times.get(profileCard.id) ?? null,
      });
    }
    return {
      kind,
      total: interactions.length,
      items,
    };
  }

  async summary(userId: bigint) {
    const own = await this.prisma.childProfile.findUnique({
      where: { registrationSlot: `primary:${userId}` },
      select: { id: true },
    });
    const [user, outgoingGroups, incomingGroups, latest] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { notificationEnabled: true },
      }),
      this.prisma.profileInteraction.groupBy({
        by: ['kind'],
        where: { actorUserId: userId },
        _count: { _all: true },
      }),
      own
        ? this.prisma.profileInteraction.groupBy({
            by: ['kind'],
            where: { targetProfileId: own.id },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      own
        ? this.prisma.profileInteraction.findMany({
            where: { targetProfileId: own.id },
            orderBy: { updatedAt: 'desc' },
            take: 20,
            select: {
              id: true,
              kind: true,
              updatedAt: true,
              actorUser: { select: { nickname: true } },
            },
          })
        : Promise.resolve([]),
    ]);
    if (!user) throw new BizException(BizCode.USER_NOT_FOUND);

    const grouped = (
      groups: { kind: string; _count: { _all: number } }[],
    ) =>
      Object.fromEntries(
        groups.map(group => [group.kind, group._count._all]),
      ) as Partial<Record<SocialInteractionKind, number>>;
    const outgoing = grouped(outgoingGroups);
    const incoming = grouped(incomingGroups);

    return {
      notificationEnabled: user.notificationEnabled,
      counts: {
        favorite: outgoing.favorite ?? 0,
        view: outgoing.view ?? 0,
        unlock: outgoing.unlock ?? 0,
        like: outgoing.like ?? 0,
        receivedFavorite: incoming.favorite ?? 0,
        receivedView: incoming.view ?? 0,
        receivedUnlock: incoming.unlock ?? 0,
        receivedLike: incoming.like ?? 0,
      },
      latest: latest.map(item => ({
        id: String(item.id),
        kind: item.kind,
        actorName: item.actorUser.nickname || '一位家长',
        at: item.updatedAt,
      })),
    };
  }

  async updateNotifications(userId: bigint, enabled: boolean) {
    await this.features.assertEnabled('messages');
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { notificationEnabled: enabled },
      select: { notificationEnabled: true },
    });
    return user;
  }

  private assertKindEnabled(kind: SocialInteractionKind) {
    if (kind === 'favorite') return this.features.assertEnabled('favorite');
    if (kind === 'unlock') return this.features.assertEnabled('unlock');
    if (kind === 'like') return this.features.assertEnabled('likes');
    return Promise.resolve();
  }
}
