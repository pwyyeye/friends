import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';
import { SubmitProfileDto } from '@/modules/profile/profile.dto';
import { UpdateUserDto } from '@/modules/user/user.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

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
    // 校验字典 id
    if (dto.cityId) {
      const exists = await this.prisma.city.findUnique({
        where: { id: BigInt(dto.cityId) },
      });
      if (!exists) throw new BizException(BizCode.DICT_NOT_FOUND, '城市不存在');
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
      include: { user: true },
    });
    if (!p) throw new BizException(BizCode.PROFILE_NOT_FOUND);
    return {
      id: String(p.id),
      userId: String(p.user.id),
      phone: p.user.phone,
      nickname: p.user.nickname,
      payload: p.payloadJson,
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