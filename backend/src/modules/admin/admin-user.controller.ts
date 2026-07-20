import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';
import { JwtPayload, Roles } from '@/common/decorators';

@ApiTags('admin-user')
@Controller('api/v1/admin/users')
export class AdminUserController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: '用户列表（脱敏）' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'keyword', required: false, description: '昵称/手机号/邀请码' })
  @ApiQuery({ name: 'profileStatus', required: false })
  @ApiQuery({ name: 'status', required: false })
  async list(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 20,
    @Query('keyword') keyword?: string,
    @Query('profileStatus') profileStatus?: string,
    @Query('status') status?: string,
  ) {
    const where: Record<string, unknown> = {};
    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword } },
        { phone: { contains: keyword } },
        { inviteCode: { contains: keyword } },
      ];
    }
    if (profileStatus !== undefined && profileStatus !== '') {
      where.profileStatus = Number(profileStatus);
    }
    if (status !== undefined && status !== '') {
      where.status = Number(status);
    }
    const skip = (Math.max(Number(page), 1) - 1) * Number(pageSize);
    const take = Math.min(Math.max(Number(pageSize), 1), 100);
    const [total, items] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          city: { select: { name: true } },
          occupation: { select: { name: true } },
          referrer: { select: { id: true, nickname: true, inviteCode: true } },
        },
      }),
    ]);
    return {
      total,
      items: items.map((u) => ({
        id: String(u.id),
        phone: u.phone ? u.phone.slice(0, 3) + '****' + u.phone.slice(-4) : null,
        nickname: u.nickname,
        gender: u.gender,
        age: u.age,
        city: u.city?.name ?? null,
        height: u.height,
        occupation: u.occupation?.name ?? u.occupationCustom ?? null,
        avatarOssKey: u.avatarOssKey,
        inviteCode: u.inviteCode,
        referrer: u.referrer
          ? {
              id: String(u.referrer.id),
              nickname: u.referrer.nickname,
              inviteCode: u.referrer.inviteCode,
            }
          : null,
        profileStatus: u.profileStatus,
        status: u.status,
        cancelStatus: u.cancelStatus,
        createdAt: u.createdAt,
      })),
    };
  }

  @Get(':id')
  @Roles('super_admin', 'operator')
  @ApiOperation({ summary: '用户详情（含手机号完整版，仅 super_admin 可见完整）' })
  async detail(
    @Req() req: { user: JwtPayload },
    @Param('id') id: string,
  ) {
    const u = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
      include: {
        city: true,
        occupation: true,
        referrer: { select: { id: true, nickname: true, inviteCode: true } },
        interests: { include: { interestTag: true } },
        customInterests: true,
        requirement: { include: { targetCity: true } },
      },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    const showFullPhone = req.user.role === 'super_admin';
    return {
      id: String(u.id),
      phone: showFullPhone
        ? u.phone
        : u.phone
          ? u.phone.slice(0, 3) + '****' + u.phone.slice(-4)
          : null,
      nickname: u.nickname,
      gender: u.gender,
      age: u.age,
      city: u.city ? { id: String(u.city.id), name: u.city.name } : null,
      height: u.height,
      occupation: u.occupation ? { id: String(u.occupation.id), name: u.occupation.name } : null,
      occupationCustom: u.occupationCustom,
      avatarOssKey: u.avatarOssKey,
      inviteCode: u.inviteCode,
      referrer: u.referrer
        ? {
            id: String(u.referrer.id),
            nickname: u.referrer.nickname,
            inviteCode: u.referrer.inviteCode,
          }
        : null,
      profileStatus: u.profileStatus,
      status: u.status,
      cancelStatus: u.cancelStatus,
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
              ? {
                  id: String(u.requirement.targetCity.id),
                  name: u.requirement.targetCity.name,
                }
              : null,
            selfDesc: u.requirement.selfDesc,
          }
        : null,
      createdAt: u.createdAt,
    };
  }

  @Put(':id')
  @Roles('super_admin', 'operator')
  @ApiOperation({ summary: '编辑/禁用用户' })
  async update(
    @Req() req: { user: JwtPayload },
    @Param('id') id: string,
    @Body()
    body: {
      nickname?: string;
      status?: number;
    },
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, status: true },
    });
    if (!target) throw new BizException(BizCode.USER_NOT_FOUND);

    const updated = await this.prisma.user.update({
      where: { id: BigInt(id) },
      data: {
        nickname: body.nickname,
        status: body.status !== undefined ? body.status : target.status,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId: BigInt(req.user.sub),
        action: body.status === 0 ? 'user.disable' : 'user.update',
        targetType: 'user',
        targetId: BigInt(id),
        payloadJson: body as object,
      },
    });

    return { id: String(updated.id), status: updated.status };
  }
}