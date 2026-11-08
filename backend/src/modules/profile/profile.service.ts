import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';
import { UploadService } from '@/modules/upload/upload.service';
import {
  ProfileFieldsDto,
  SaveDraftDto,
  SubmitProfileDto,
} from './profile.dto';
import { PROFILE_OPTIONS } from './profile.options';

export function profileAge(birthDate?: string | null) {
  if (!birthDate) return null;
  const today = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai',
  }).format(new Date());
  return (
    Number(today.slice(0, 4)) -
    Number(birthDate.slice(0, 4)) -
    (today.slice(5) < birthDate.slice(5) ? 1 : 0)
  );
}
export function validateProfile(p: ProfileFieldsDto) {
  if (
    !p.relationship ||
    !p.gender ||
    !p.birthDate ||
    !p.height ||
    !p.cityId ||
    !p.education ||
    !p.income
  )
    throw new BizException(BizCode.BAD_REQUEST, '请完整填写孩子的基础资料');
  const date = new Date(`${p.birthDate}T00:00:00Z`);
  if ((profileAge(p.birthDate) ?? 0) > 60)
    throw new BizException(
      BizCode.BAD_REQUEST,
      '孩子年龄需在 18–60 周岁之间',
    );
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== p.birthDate ||
    Number(p.birthDate.slice(0, 4)) < 1900 ||
    (profileAge(p.birthDate) ?? 0) < 18
  )
    throw new BizException(
      BizCode.BAD_REQUEST,
      '请填写真实出生日期，孩子须年满 18 周岁',
    );
  for (const [min, max, name] of [
    [p.preference?.birthYearMin, p.preference?.birthYearMax, '出生年份'],
    [p.preference?.heightMin, p.preference?.heightMax, '身高'],
  ] as const) {
    if (min != null && max != null && min > max)
      throw new BizException(BizCode.BAD_REQUEST, `${name}下限不能大于上限`);
  }
  const adultYear =
    Number(
      new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' })
        .format(new Date())
        .slice(0, 4),
    ) - 18;
  const seniorYear = adultYear - 42; // 60 周岁对应的出生年份
  if (
    (p.preference?.birthYearMin ?? seniorYear) < seniorYear ||
    (p.preference?.birthYearMax ?? seniorYear) < seniorYear ||
    (p.preference?.birthYearMin ?? adultYear) > adultYear ||
    (p.preference?.birthYearMax ?? adultYear) > adultYear
  )
    throw new BizException(
      BizCode.BAD_REQUEST,
      '择偶出生年份应在 18–60 周岁范围内',
    );
}
@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly upload: UploadService,
  ) {}
  owned(userId: bigint) {
    return this.prisma.childProfile.findUnique({
      where: { registrationSlot: `primary:${userId}` },
    });
  }
  async decorate(payload: unknown) {
    if (!payload) return null;
    const p = payload as ProfileFieldsDto;
    const ids = [
      p.cityId,
      p.hometownCityId,
      p.workCityId,
      p.preference?.cityId,
    ].filter((x): x is number => x != null);
    const cities = await this.prisma.city.findMany({
      where: { id: { in: ids.map(BigInt) } },
    });
    const city = (id?: number | null) =>
      cities.find((c) => c.id === BigInt(id ?? 0))?.name ?? null;
    const label = (
      options: { value: string; label: string }[],
      value?: string | null,
    ) => options.find((x) => x.value === value)?.label ?? null;
    return {
      ...p,
      age: profileAge(p.birthDate),
      cityName: city(p.cityId),
      hometownCityName: city(p.hometownCityId),
      workCityName: city(p.workCityId),
      educationLabel: label(PROFILE_OPTIONS.education, p.education),
      incomeLabel: label(PROFILE_OPTIONS.income, p.income),
      maritalStatusLabel: label(PROFILE_OPTIONS.maritalStatus, p.maritalStatus),
      carStatusLabel: label(PROFILE_OPTIONS.carStatus, p.carStatus),
      preference: {
        ...p.preference,
        cityName: city(p.preference?.cityId),
        educationLabel: label(
          PROFILE_OPTIONS.education,
          p.preference?.educationMin,
        ),
      },
      photos: (p.photoOssKeys ?? []).map((ossKey) => ({
        ossKey,
        url: this.upload.toPublicUrl(ossKey),
      })),
    };
  }
  async mine(userId: bigint) {
    const p = await this.owned(userId);
    if (!p) return null;
    const review = await this.prisma.userProfilePending.findFirst({
      where: { profileId: p.id },
      orderBy: { id: 'desc' },
    });
    return {
      id: String(p.id),
      profileNumber: `C${String(p.id).padStart(6, '0')}`,
      draftRevision: p.draftRevision,
      currentStep: p.currentStep,
      submittedRevision: p.submittedRevision,
      approvedRevision: p.approvedRevision,
      profileStatus: p.profileStatus,
      matchmakingStatus: p.matchmakingStatus,
      draft: await this.decorate(p.draft),
      approved: await this.decorate(p.approvedPayload),
      latestSubmission: review
        ? {
            id: String(review.id),
            status: review.status,
            rejectReason: review.rejectReason,
            createdAt: review.createdAt,
            payload: await this.decorate(review.payloadJson),
          }
        : null,
      updatedAt: p.updatedAt,
    };
  }
  private async validateReferences(
    userId: bigint,
    profileId: bigint,
    p: ProfileFieldsDto,
  ) {
    const ids = [
      ...new Set(
        [
          p.cityId,
          p.hometownCityId,
          p.workCityId,
          p.preference?.cityId,
        ].filter((x): x is number => x != null),
      ),
    ];
    if (
      (await this.prisma.city.count({
        where: { id: { in: ids.map(BigInt) }, status: 1 },
      })) !== ids.length
    )
      throw new BizException(BizCode.DICT_NOT_FOUND, '所选城市不可用');
    const keys = p.photoOssKeys ?? [];
    if (
      keys.length &&
      (await this.prisma.uploadedFile.count({
        where: { userId, profileId, committed: true, ossKey: { in: keys } },
      })) !== keys.length
    )
      throw new BizException(
        BizCode.BAD_REQUEST,
        '照片尚未上传完成或不属于这个孩子的档案',
      );
  }
  async saveDraft(userId: bigint, dto: SaveDraftDto) {
    // Atomic upsert and revision checks prevent duplicate children and stale overwrites.
    const p = await this.prisma.childProfile
      .upsert({
        where: { registrationSlot: `primary:${userId}` },
        update: {},
        create: {
          ownerAccountId: userId,
          registrationSlot: `primary:${userId}`,
          draft: {},
        },
      })
      .catch(async (error) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return this.prisma.childProfile.findUniqueOrThrow({
            where: { registrationSlot: `primary:${userId}` },
          });
        }
        throw error;
      });
    await this.validateReferences(userId, p.id, dto.payload);
    const payload = JSON.parse(
      JSON.stringify({
        ...dto.payload,
        traits: dto.payload.traits ?? [],
        advantages: dto.payload.advantages ?? [],
        photoOssKeys: dto.payload.photoOssKeys ?? [],
        preference: {
          ...dto.payload.preference,
          tags: dto.payload.preference?.tags ?? [],
        },
      }),
    ) as Prisma.InputJsonObject;
    const result = await this.prisma.childProfile.updateMany({
      where: {
        id: p.id,
        ownerAccountId: userId,
        draftRevision: dto.expectedRevision,
      },
      data: {
        draft: payload,
        currentStep: dto.currentStep ?? undefined,
        draftRevision: { increment: 1 },
      },
    });
    if (!result.count)
      throw new BizException(
        BizCode.BAD_REQUEST,
        '资料已在其他页面更新，请刷新后再保存',
        409,
      );
    // Return the revision this write owns, even if another editor saves before the follow-up read.
    return {
      ...(await this.mine(userId)),
      draftRevision: dto.expectedRevision + 1,
      currentStep: dto.currentStep ?? p.currentStep,
      draft: await this.decorate(payload),
    };
  }
  async submit(userId: bigint, dto: SubmitProfileDto) {
    const p = await this.owned(userId);
    if (!p) throw new BizException(BizCode.PROFILE_NOT_FOUND);
    if (p.draftRevision !== dto.expectedRevision)
      throw new BizException(
        BizCode.BAD_REQUEST,
        '资料已更新，请刷新后再提交',
        409,
      );
    validateProfile(p.draft as unknown as ProfileFieldsDto);
    await this.validateReferences(
      userId,
      p.id,
      p.draft as unknown as ProfileFieldsDto,
    );
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.childProfile.updateMany({
        where: {
          id: p.id,
          ownerAccountId: userId,
          draftRevision: dto.expectedRevision,
          OR: [
            { submittedRevision: null },
            { submittedRevision: { not: dto.expectedRevision } },
            { profileStatus: 3 },
          ],
        },
        data: {
          profileStatus: 1,
          submittedRevision: dto.expectedRevision,
          consentVersion: dto.consentVersion,
          consentAt: new Date(),
        },
      });
      if (!claimed.count)
        throw new BizException(
          BizCode.BAD_REQUEST,
          '资料已经提交或已更新，请刷新后再试',
          409,
        );
      await tx.userProfilePending.updateMany({
        where: { profileId: p.id, status: 1 },
        data: { status: 4 },
      });
      await tx.userProfilePending.create({
        data: {
          profileId: p.id,
          draftRevision: dto.expectedRevision,
          consentVersion: dto.consentVersion,
          consentAt: new Date(),
          payloadJson: p.draft as Prisma.InputJsonObject,
        },
      });
    });
    return this.mine(userId);
  }
  async myStatus(userId: bigint) {
    const p = await this.mine(userId);
    return {
      profileStatus: p?.profileStatus ?? 0,
      latestReject:
        p?.latestSubmission?.status === 3
          ? { reason: p.latestSubmission.rejectReason }
          : null,
    };
  }
  async adminPendingList(page: number, pageSize: number) {
    const take = Math.min(Math.max(pageSize || 20, 1), 100),
      where = { status: 1 };
    const [total, rows] = await Promise.all([
      this.prisma.userProfilePending.count({ where }),
      this.prisma.userProfilePending.findMany({
        where,
        skip: (Math.max(page || 1, 1) - 1) * take,
        take,
        orderBy: { id: 'asc' },
        include: { profile: { include: { owner: true } } },
      }),
    ]);
    return {
      total,
      items: await Promise.all(
        rows.map(async (r) => ({
          id: String(r.id),
          profileId: String(r.profileId),
          parentName: r.profile.owner.nickname,
          phone:
            r.profile.owner.phone.slice(0, 3) +
            '****' +
            r.profile.owner.phone.slice(-4),
          payload: await this.decorate(r.payloadJson),
          createdAt: r.createdAt,
        })),
      ),
    };
  }
  async adminPendingDetail(id: bigint, role: string) {
    const r = await this.prisma.userProfilePending.findUnique({
      where: { id },
      include: { profile: { include: { owner: true } } },
    });
    if (!r) throw new BizException(BizCode.PROFILE_NOT_FOUND);
    return {
      id: String(r.id),
      profileId: String(r.profileId),
      parentName: r.profile.owner.nickname,
      phone:
        role === 'super_admin'
          ? r.profile.owner.phone
          : r.profile.owner.phone.slice(0, 3) +
            '****' +
            r.profile.owner.phone.slice(-4),
      payload: await this.decorate(r.payloadJson),
      status: r.status,
      rejectReason: r.rejectReason,
      createdAt: r.createdAt,
    };
  }
  private async review(
    id: bigint,
    adminId: bigint,
    approved: boolean,
    reason?: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const r = await tx.userProfilePending.findUnique({ where: { id } });
      if (!r || r.status !== 1)
        throw new BizException(
          BizCode.BAD_REQUEST,
          '该资料已处理或已被新版本替代',
        );
      // Use the same profile-then-review lock order as submission.
      const updated = await tx.childProfile.updateMany({
        where: {
          id: r.profileId,
          profileStatus: 1,
          submittedRevision: r.draftRevision,
        },
        data: {
          profileStatus: approved ? 2 : 3,
          ...(approved
            ? {
                approvedPayload: r.payloadJson as Prisma.InputJsonObject,
                approvedRevision: r.draftRevision,
              }
            : {}),
        },
      });
      if (!updated.count)
        throw new BizException(
          BizCode.BAD_REQUEST,
          '该资料已有新提交，请刷新审核列表',
          409,
        );
      const claimed = await tx.userProfilePending.updateMany({
        where: { id, status: 1 },
        data: {
          status: approved ? 2 : 3,
          rejectReason: reason?.trim() ?? null,
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
      });
      if (!claimed.count)
        throw new BizException(BizCode.BAD_REQUEST, '该资料已处理');
      await tx.auditLog.create({
        data: {
          adminId,
          action: approved ? 'profile.approve' : 'profile.reject',
          targetType: 'child_profile',
          targetId: r.profileId,
          payloadJson: { reviewId: String(id), reason: reason ?? null },
        },
      });
      return { ok: true };
    });
  }
  approve(id: bigint, adminId: bigint) {
    return this.review(id, adminId, true);
  }
  reject(id: bigint, adminId: bigint, reason: string) {
    return this.review(id, adminId, false, reason);
  }
}
