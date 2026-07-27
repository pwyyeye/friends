import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';
import { SubmitProfileDto } from '@/modules/profile/profile.dto';
import { UpdateUserDto } from '@/modules/user/user.dto';

const MAX_LIFESTYLE_PHOTOS = 9;

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 确保 City 表存在 id=areaCode 的记录。前端 cascader 用行政区代码当 cityId，
   * 这里缺什么补什么，name 用占位（审核/管理端会修正），保证 FK 写入不报错。
   */
  private async ensureCity(areaCode: bigint): Promise<void> {
    const exists = await this.prisma.city.findUnique({ where: { id: areaCode } });
    if (exists) return;
    await this.prisma.city.create({
      data: {
        id: areaCode,
        name: `code-${areaCode.toString()}`,
        pinyin: areaCode.toString(),
        province: '',
        level: 4,
        status: 1,
      },
    });
  }

  /** 用户端：修改基础资料（不触发审核） */
  async updateBaseInfo(userId: bigint, dto: UpdateUserDto) {
    const data: Record<string, unknown> = {};
    if (dto.nickname !== undefined) data.nickname = dto.nickname;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.age !== undefined) data.age = dto.age;
    if (dto.cityId !== undefined) data.cityId = dto.cityId;
    if (dto.height !== undefined) data.height = dto.height;
    if (dto.occupationId !== undefined) data.occupationId = dto.occupationId;
    if (dto.occupationCustom !== undefined) data.occupationCustom = dto.occupationCustom;
    if (dto.avatarOssKey !== undefined) data.avatarOssKey = dto.avatarOssKey;
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  /** 用户端：提交资料进入待审核池 */
  async submit(userId: bigint, dto: SubmitProfileDto) {
    // 城市：来自前端 area-data 的行政区代码（如 110100）；若 City 表不存在则按 area-data 自动 upsert
    if (dto.cityId !== undefined && dto.cityId !== null) {
      await this.ensureCity(BigInt(dto.cityId));
    }
    if (dto.requirement?.targetCityId !== undefined && dto.requirement.targetCityId !== null) {
      await this.ensureCity(BigInt(dto.requirement.targetCityId));
    }
    if (dto.occupationId) {
      const exists = await this.prisma.occupation.findUnique({
        where: { id: BigInt(dto.occupationId) },
      });
      if (!exists) throw new BizException(BizCode.DICT_NOT_FOUND, '职业不存在');
    }
    if (dto.interestTagIds.length) {
      const tags = await this.prisma.interestTag.findMany({
        where: { id: { in: dto.interestTagIds.map(BigInt) }, status: 1 },
      });
      if (tags.length !== new Set(dto.interestTagIds).size) {
        throw new BizException(BizCode.DICT_NOT_FOUND, '兴趣标签无效');
      }
    }

    // 校验生活照：必须属于当前用户（key 前缀 lifestyle/{userId}/）
    if (!dto.avatarOssKey || !dto.avatarOssKey.startsWith(`avatar/${userId}/`)) {
      throw new BizException(BizCode.BAD_REQUEST, '头像无效');
    }
    if (!Array.isArray(dto.photoOssKeys) || dto.photoOssKeys.length === 0) {
      throw new BizException(BizCode.BAD_REQUEST, '请至少上传 1 张生活照');
    }
    if (dto.photoOssKeys.length > MAX_LIFESTYLE_PHOTOS) {
      throw new BizException(BizCode.BAD_REQUEST, `生活照最多 ${MAX_LIFESTYLE_PHOTOS} 张`);
    }
    for (const k of dto.photoOssKeys) {
      if (!k.startsWith(`lifestyle/${userId}/`)) {
        throw new BizException(BizCode.BAD_REQUEST, '生活照 key 无效');
      }
    }
    // 这些 key 必须已经 commit 落到 UserPhoto
    const existingPhotos = await this.prisma.userPhoto.findMany({
      where: { userId, ossKey: { in: dto.photoOssKeys } },
      select: { ossKey: true },
    });
    if (existingPhotos.length !== new Set(dto.photoOssKeys).size) {
      throw new BizException(BizCode.BAD_REQUEST, '生活照未上传完成');
    }

    // 若已有 pending，先标 superseded
    await this.prisma.userProfilePending.updateMany({
      where: { userId, status: 1 },
      data: { status: 4 },
    });

    const pending = await this.prisma.userProfilePending.create({
      data: {
        userId,
        payloadJson: dto as unknown as object,
        status: 1,
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { profileStatus: 1 },
    });

    return { id: String(pending.id), status: 1 };
  }

  /** 用户端：我的资料审核状态 */
  async myStatus(userId: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profileStatus: true },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    const latest = await this.prisma.userProfilePending.findFirst({
      where: { userId, status: { in: [3] } }, // 最新一次驳回
      orderBy: { createdAt: 'desc' },
      select: { rejectReason: true, createdAt: true },
    });
    return {
      profileStatus: u.profileStatus,
      latestReject: latest
        ? { reason: latest.rejectReason, at: latest.createdAt }
        : null,
    };
  }

  /** 管理端：待审核列表 */
  async adminPendingList(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [total, items] = await Promise.all([
      this.prisma.userProfilePending.count({ where: { status: 1 } }),
      this.prisma.userProfilePending.findMany({
        where: { status: 1 },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              nickname: true,
              inviteCode: true,
              createdAt: true,
            },
          },
        },
      }),
    ]);
    return {
      total,
      items: items.map((p) => ({
        id: String(p.id),
        userId: String(p.user.id),
        phone: p.user.phone ? p.user.phone.slice(0, 3) + '****' + p.user.phone.slice(-4) : null,
        nickname: p.user.nickname,
        inviteCode: p.user.inviteCode,
        payload: p.payloadJson,
        createdAt: p.createdAt,
      })),
    };
  }

  /** 管理端：审核详情 */
  async adminPendingDetail(id: bigint) {
    const p = await this.prisma.userProfilePending.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            photos: { orderBy: { sort: 'asc' } },
          },
        },
      },
    });
    if (!p) throw new BizException(BizCode.PROFILE_NOT_FOUND);
    const dto = p.payloadJson as unknown as SubmitProfileDto & { photoOssKeys?: string[] };
    // 把 dto.photoOssKeys（ossKey 列表）解析成带 url 的对象
    const photoMap = new Map(p.user.photos.map((ph) => [ph.ossKey, ph.url]));
    const photos = (dto.photoOssKeys ?? []).map((key) => ({
      ossKey: key,
      url: photoMap.get(key) ?? null,
    }));
    return {
      id: String(p.id),
      userId: String(p.user.id),
      phone: p.user.phone,
      nickname: p.user.nickname,
      payload: p.payloadJson,
      photos,
      avatarUrl: photoMap.size ? null : null, // payload 不含 url；由前端单独渲染 payload.avatarOssKey
      status: p.status,
      rejectReason: p.rejectReason,
      reviewedAt: p.reviewedAt,
      createdAt: p.createdAt,
    };
  }

  /**
   * 管理端：通过审核 -> 事务合并到 users / user_interests / user_custom_interests / user_requirements
   */
  async approve(pendingId: bigint, adminId: bigint) {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.userProfilePending.findUnique({
        where: { id: pendingId },
      });
      if (!p) throw new BizException(BizCode.PROFILE_NOT_FOUND);
      if (p.status !== 1) {
        throw new BizException(BizCode.BAD_REQUEST, '该资料已处理');
      }
      const dto = p.payloadJson as unknown as SubmitProfileDto;

      // 1) 更新 users 基础字段
      await tx.user.update({
        where: { id: p.userId },
        data: {
          nickname: dto.nickname,
          gender: dto.gender,
          age: dto.age,
          cityId: dto.cityId ? BigInt(dto.cityId) : null,
          height: dto.height ?? null,
          occupationId: dto.occupationId ? BigInt(dto.occupationId) : null,
          occupationCustom: dto.occupationCustom ?? null,
          avatarOssKey: dto.avatarOssKey ?? null,
          profileStatus: 2,
        },
      });

      // 2) 重置兴趣：删旧 → 插新
      await tx.userInterest.deleteMany({ where: { userId: p.userId } });
      if (dto.interestTagIds?.length) {
        await tx.userInterest.createMany({
          data: dto.interestTagIds.map((id) => ({
            userId: p.userId,
            interestTagId: BigInt(id),
          })),
        });
      }
      await tx.userCustomInterest.deleteMany({ where: { userId: p.userId } });
      if (dto.customInterests?.length) {
        await tx.userCustomInterest.createMany({
          data: dto.customInterests.map((tagText) => ({
            userId: p.userId,
            tagText,
          })),
        });
      }

      // 2.5) 同步生活照：只保留 dto.photoOssKeys 里那几张（删除其它）
      if (Array.isArray(dto.photoOssKeys) && dto.photoOssKeys.length) {
        await tx.userPhoto.deleteMany({
          where: { userId: p.userId, NOT: { ossKey: { in: dto.photoOssKeys } } },
        });
        // 调整 sort：按 dto 顺序
        const photos = await tx.userPhoto.findMany({
          where: { userId: p.userId, ossKey: { in: dto.photoOssKeys } },
          select: { id: true, ossKey: true },
        });
        const byKey = new Map(photos.map((ph) => [ph.ossKey, ph.id]));
        for (let i = 0; i < dto.photoOssKeys.length; i++) {
          const id = byKey.get(dto.photoOssKeys[i]);
          if (id) {
            await tx.userPhoto.update({ where: { id }, data: { sort: i } });
          }
        }
      } else {
        await tx.userPhoto.deleteMany({ where: { userId: p.userId } });
      }

      // 3) upsert requirement
      if (dto.requirement) {
        await tx.userRequirement.upsert({
          where: { userId: p.userId },
          update: {
            targetGender: dto.requirement.targetGender,
            targetAgeMin: dto.requirement.targetAgeMin ?? null,
            targetAgeMax: dto.requirement.targetAgeMax ?? null,
            targetCityId: dto.requirement.targetCityId
              ? BigInt(dto.requirement.targetCityId)
              : null,
            selfDesc: dto.requirement.selfDesc ?? null,
          },
          create: {
            userId: p.userId,
            targetGender: dto.requirement.targetGender,
            targetAgeMin: dto.requirement.targetAgeMin ?? null,
            targetAgeMax: dto.requirement.targetAgeMax ?? null,
            targetCityId: dto.requirement.targetCityId
              ? BigInt(dto.requirement.targetCityId)
              : null,
            selfDesc: dto.requirement.selfDesc ?? null,
          },
        });
      }

      // 4) 更新 pending 状态
      await tx.userProfilePending.update({
        where: { id: pendingId },
        data: {
          status: 2,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      // 5) 写 audit
      await tx.auditLog.create({
        data: {
          adminId,
          action: 'profile.approve',
          targetType: 'profile_pending',
          targetId: pendingId,
          payloadJson: { userId: String(p.userId) },
        },
      });

      return { ok: true, userId: String(p.userId) };
    });
  }

  /** 管理端：驳回 */
  async reject(pendingId: bigint, adminId: bigint, reason: string) {
    return this.prisma.$transaction(async (tx) => {
      const p = await tx.userProfilePending.findUnique({
        where: { id: pendingId },
      });
      if (!p) throw new BizException(BizCode.PROFILE_NOT_FOUND);
      if (p.status !== 1) {
        throw new BizException(BizCode.BAD_REQUEST, '该资料已处理');
      }

      await tx.userProfilePending.update({
        where: { id: pendingId },
        data: {
          status: 3,
          rejectReason: reason,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: p.userId },
        data: { profileStatus: 3 },
      });

      await tx.auditLog.create({
        data: {
          adminId,
          action: 'profile.reject',
          targetType: 'profile_pending',
          targetId: pendingId,
          payloadJson: { userId: String(p.userId), reason },
        },
      });

      return { ok: true };
    });
  }
}