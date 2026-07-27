import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';

function maskPhone(phone: string | null | undefined): string | null {
  if (!phone || phone.length < 7) return phone ?? null;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

function publicUrlFor(key: string | null | undefined): string | null {
  if (!key) return null;
  // 注意：必须与 upload.service 的 URL 规则保持一致
  // mock 模式: http://localhost:<PORT>/api/v1/upload/mock-file/<key>
  // aliyun  : <OSS_PUBLIC_BASE>/<key>
  const provider = process.env.OSS_PROVIDER ?? 'aliyun';
  if (provider === 'mock') {
    const port = process.env.PORT ?? '3000';
    return `http://localhost:${port}/api/v1/upload/mock-file/${key}`;
  }
  const base = process.env.OSS_PUBLIC_BASE ?? '';
  return `${base}/${key}`;
}

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
    return {
      id: String(u.id),
      phone: maskPhone(u.phone),
      nickname: u.nickname,
      inviteCode: u.inviteCode,
      avatarUrl: publicUrlFor(u.avatarOssKey),
      avatarOssKey: u.avatarOssKey,
      photos: u.photos.map((p) => ({ ossKey: p.ossKey, url: p.url })),
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
    };
  }

  /** 我的资料（已通过的版本，含完整画像） */
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
    return {
      nickname: u.nickname,
      gender: u.gender,
      age: u.age,
      city: u.city ? { id: String(u.city.id), name: u.city.name } : null,
      height: u.height,
      occupation: u.occupation
        ? { id: String(u.occupation.id), name: u.occupation.name }
        : null,
      occupationCustom: u.occupationCustom,
      avatarUrl: publicUrlFor(u.avatarOssKey),
      avatarOssKey: u.avatarOssKey,
      photos: u.photos.map((p) => ({ ossKey: p.ossKey, url: p.url })),
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