import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';
import { UploadService } from '@/modules/upload/upload.service';

function maskPhone(phone: string | null | undefined): string | null {
  if (!phone || phone.length < 7) return phone ?? null;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
  ) {}

  /** URL 生成代理到 UploadService —— 单点真源（mock 走 MOCK_BASE_URL，aliyun 走 OSS_PUBLIC_BASE） */
  private publicUrlFor(key: string | null | undefined): string | null {
    return this.upload.toPublicUrl(key);
  }

  /** 当前用户基本信息（不含详细资料） */
  async me(userId: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrer: { select: { id: true, nickname: true, inviteCode: true } },
        photos: { orderBy: { sort: 'asc' } },
      },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);

    // 最近一次驳回原因（用于「我的」页直接展示，无需再调 /profile/status）
    const latestReject = await this.prisma.userProfilePending.findFirst({
      where: { userId, status: 3 },
      orderBy: { createdAt: 'desc' },
      select: { rejectReason: true, createdAt: true },
    });

    return {
      id: String(u.id),
      phone: maskPhone(u.phone),
      nickname: u.nickname,
      inviteCode: u.inviteCode,
      avatarUrl: this.publicUrlFor(u.avatarOssKey),
      avatarOssKey: u.avatarOssKey,
      photos: u.photos.map((p) => ({
        ossKey: p.ossKey,
        // 优先用服务端按当前配置生成的 URL（mock 走 MOCK_BASE_URL，aliyun 走 OSS_PUBLIC_BASE）；
        // 老数据里 p.url 可能是前端拼的，直接用 toPublicUrl 更可靠
        url: this.publicUrlFor(p.ossKey) ?? p.url ?? '',
      })),
      profileStatus: u.profileStatus,
      referrer: u.referrer
        ? {
            id: String(u.referrer.id),
            nickname: u.referrer.nickname,
            inviteCode: u.referrer.inviteCode,
          }
        : null,
      status: u.status,
      cancelStatus: u.cancelStatus,
      latestReject: latestReject
        ? { reason: latestReject.rejectReason, at: latestReject.createdAt }
        : null,
    };
  }

  /** 我的资料（含完整画像）。驳回状态（profileStatus=3）会把最近一次被驳回的提交合并进来。 */
  async myProfile(userId: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        city: true,
        occupation: true,
        interests: { include: { interestTag: true } },
        customInterests: true,
        requirement: { include: { targetCity: true } },
        photos: { orderBy: { sort: 'asc' } },
      },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);

    const base = {
      nickname: u.nickname,
      gender: u.gender,
      age: u.age,
      city: u.city ? { id: String(u.city.id), name: u.city.name } : null,
      height: u.height,
      occupation: u.occupation
        ? { id: String(u.occupation.id), name: u.occupation.name }
        : null,
      occupationCustom: u.occupationCustom,
      avatarUrl: this.publicUrlFor(u.avatarOssKey),
      avatarOssKey: u.avatarOssKey,
      photos: u.photos.map((p) => ({
        ossKey: p.ossKey,
        url: this.publicUrlFor(p.ossKey) ?? p.url ?? '',
      })),
      interests: u.interests.map((i) => ({
        id: String(i.interestTag.id),
        name: i.interestTag.name,
      })),
      customInterests: u.customInterests.map((c) => c.tagText),
      requirement: u.requirement
        ? {
            targetGender: u.requirement.targetGender,
            targetAgeMin: u.requirement.targetAgeMin,
            targetAgeMax: u.requirement.targetAgeMax,
            targetCity: u.requirement.targetCity
              ? { id: String(u.requirement.targetCity.id), name: u.requirement.targetCity.name }
              : null,
            selfDesc: u.requirement.selfDesc,
          }
        : null,
    };

    // 驳回状态：把最近一次被驳回的 payloadJson 合并进来，让用户看到自己提交的内容以便修改重提
    if (u.profileStatus === 3) {
      const rejected = await this.prisma.userProfilePending.findFirst({
        where: { userId, status: 3 },
        orderBy: { createdAt: 'desc' },
      });
      if (rejected?.payloadJson) {
        const overlay = await this.resolvePendingPayload(
          rejected.payloadJson as Record<string, unknown>,
        );
        return { ...base, ...overlay };
      }
    }

    return base;
  }

  /**
   * 把 user_profiles_pending.payloadJson（用户提交时被驳回的版本）展开成 /profile 需要的形态：
   * 数字 id 还原成 {id,name}、avatar/photo 还原成可访问 URL。
   */
  private async resolvePendingPayload(p: Record<string, unknown>) {
    const numId = (v: unknown) => (v === null || v === undefined ? null : Number(v));

    let cityObj: { id: string; name: string } | null = null;
    const cityId = numId(p.cityId);
    if (cityId !== null) {
      const c = await this.prisma.city.findUnique({ where: { id: BigInt(cityId) } });
      if (c) cityObj = { id: String(c.id), name: c.name };
    }

    let occObj: { id: string; name: string } | null = null;
    const occId = numId(p.occupationId);
    if (occId !== null) {
      const o = await this.prisma.occupation.findUnique({ where: { id: BigInt(occId) } });
      if (o) occObj = { id: String(o.id), name: o.name };
    }

    const interestIds = Array.isArray(p.interestTagIds)
      ? (p.interestTagIds as unknown[]).map((x) => Number(x)).filter((n) => !Number.isNaN(n))
      : [];
    const interestRows = interestIds.length
      ? await this.prisma.interestTag.findMany({ where: { id: { in: interestIds.map((n) => BigInt(n)) } } })
      : [];
    const interestMap = new Map<bigint, string>(
      interestRows.map((it) => [it.id, it.name] as const),
    );
    const interests = interestIds
      .map((id) => {
        const name = interestMap.get(BigInt(id));
        return name ? { id: String(id), name } : null;
      })
      .filter((x): x is { id: string; name: string } => x !== null);

    const avatarOssKey = typeof p.avatarOssKey === 'string' ? p.avatarOssKey : null;
    const photoOssKeys = Array.isArray(p.photoOssKeys)
      ? (p.photoOssKeys as unknown[]).filter((x): x is string => typeof x === 'string')
      : [];

    // photos：先尝试从 UserPhoto 取 url；取不到就用 publicUrlFor 兜底
    let photos: { ossKey: string; url: string }[] = [];
    if (photoOssKeys.length) {
      const rows = await this.prisma.userPhoto.findMany({
        where: { ossKey: { in: photoOssKeys } },
      });
      const urlMap = new Map(rows.map((r) => [r.ossKey, r.url]));
      photos = photoOssKeys.map((k) => ({ ossKey: k, url: urlMap.get(k) ?? this.publicUrlFor(k) ?? '' }));
    }

    const req = (p.requirement as Record<string, unknown> | undefined) ?? undefined;
    let reqOut: Record<string, unknown> | null = null;
    if (req) {
      let targetCityObj: { id: string; name: string } | null = null;
      const tcId = numId(req.targetCityId);
      if (tcId !== null) {
        const tc = await this.prisma.city.findUnique({ where: { id: BigInt(tcId) } });
        if (tc) targetCityObj = { id: String(tc.id), name: tc.name };
      }
      reqOut = {
        targetGender: numId(req.targetGender) ?? 0,
        targetAgeMin: numId(req.targetAgeMin),
        targetAgeMax: numId(req.targetAgeMax),
        targetCity: targetCityObj,
        selfDesc: typeof req.selfDesc === 'string' ? req.selfDesc : '',
      };
    }

    return {
      nickname: typeof p.nickname === 'string' ? p.nickname : null,
      gender: numId(p.gender),
      age: numId(p.age),
      city: cityObj,
      height: numId(p.height),
      occupation: occObj,
      occupationCustom: typeof p.occupationCustom === 'string' ? p.occupationCustom : null,
      avatarOssKey,
      avatarUrl: this.publicUrlFor(avatarOssKey),
      photos,
      interests,
      customInterests: Array.isArray(p.customInterests)
        ? (p.customInterests as unknown[]).filter((x): x is string => typeof x === 'string')
        : [],
      requirement: reqOut,
    };
  }

  async requestCancel(userId: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { cancelStatus: true },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    if (u.cancelStatus === 1) return { cancelStatus: 1 };
    return this.prisma.user.update({
      where: { id: userId },
      data: { cancelStatus: 1, cancelAt: new Date() },
      select: { cancelStatus: true, cancelAt: true },
    });
  }
}