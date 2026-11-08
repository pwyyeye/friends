import { Body, Controller, Get, Param, Put, Query, Req } from "@nestjs/common";
import {
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "@/prisma/prisma.service";
import { ProfileService } from "@/modules/profile/profile.service";
import { BizException } from "@/common/exceptions";
import { BizCode } from "@/common/constants";
import { JwtPayload, Roles } from "@/common/decorators";

const phone = (p: string) => p.slice(0, 3) + "****" + p.slice(-4);
class UpdateAccountDto {
  @IsOptional() @IsString() @MaxLength(50) @Matches(/\S/) nickname?: string;
  @IsOptional() @IsIn([0, 1]) status?: number;
}
class ResetPasswordDto {
  @IsString()
  @MinLength(6, { message: "密码至少需要 6 位" })
  @MaxLength(32, { message: "密码最多为 32 位" })
  password!: string;
}
@Controller("api/v1/admin/users")
@Roles("super_admin", "operator")
export class AdminUserController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profile: ProfileService,
  ) {}
  @Get()
  async list(
    @Query("page") page = 1,
    @Query("pageSize") pageSize = 20,
    @Query("keyword") keyword?: string,
    @Query("profileStatus") profileStatus?: string,
    @Query("status") status?: string,
  ) {
    const where: any = {};
    if (keyword)
      where.OR = [
        { nickname: { contains: keyword } },
        { phone: { contains: keyword } },
        { inviteCode: { contains: keyword } },
      ];
    if (profileStatus)
      where.childProfiles = { some: { profileStatus: Number(profileStatus) } };
    if (status !== undefined && status !== "") where.status = Number(status);
    const take = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        take,
        skip: (Math.max(Number(page) || 1, 1) - 1) * take,
        orderBy: { id: "desc" },
        include: {
          childProfiles: true,
          referrer: { select: { id: true, nickname: true, inviteCode: true } },
        },
      }),
    ]);
    return {
      total,
      items: await Promise.all(
        rows.map(async (u) => ({
          id: String(u.id),
          phone: phone(u.phone),
          nickname: u.nickname,
          inviteCode: u.inviteCode,
          status: u.status,
          cancelStatus: u.cancelStatus,
          createdAt: u.createdAt,
          referrer: u.referrer
            ? { ...u.referrer, id: String(u.referrer.id) }
            : null,
          children: await Promise.all(
            u.childProfiles.map(async (p) => ({
              id: String(p.id),
              profileStatus: p.profileStatus,
              draft: await this.profile.decorate(p.draft),
            })),
          ),
        })),
      ),
    };
  }
  @Get(":id")
  async detail(@Req() req: { user: JwtPayload }, @Param("id") id: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
      include: {
        childProfiles: true,
        referrer: { select: { id: true, nickname: true, inviteCode: true } },
      },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    return {
      id: String(u.id),
      nickname: u.nickname,
      phone: req.user.role === "super_admin" ? u.phone : phone(u.phone),
      inviteCode: u.inviteCode,
      status: u.status,
      cancelStatus: u.cancelStatus,
      createdAt: u.createdAt,
      referrer: u.referrer
        ? { ...u.referrer, id: String(u.referrer.id) }
        : null,
      childProfile: await this.profile.mine(u.id),
    };
  }
  @Put(":id")
  async update(
    @Req() req: { user: JwtPayload },
    @Param("id") id: string,
    @Body() body: UpdateAccountDto,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
    });
    if (!target) throw new BizException(BizCode.USER_NOT_FOUND);
    return this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: target.id },
        data: { nickname: body.nickname?.trim(), status: body.status },
      });
      await tx.auditLog.create({
        data: {
          adminId: BigInt(req.user.sub),
          action: body.status === 0 ? "user.disable" : "user.update",
          targetType: "user",
          targetId: u.id,
          payloadJson: { ...body },
        },
      });
      return { id: String(u.id), status: u.status };
    });
  }
  @Put(":id/password")
  async resetPassword(
    @Req() req: { user: JwtPayload },
    @Param("id") id: string,
    @Body() body: ResetPasswordDto,
  ) {
    const target = await this.prisma.user.findUnique({
      where: { id: BigInt(id) },
      select: { id: true },
    });
    if (!target) throw new BizException(BizCode.USER_NOT_FOUND);

    const passwordHash = await bcrypt.hash(body.password, 12);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: target.id },
        data: {
          passwordHash,
          authVersion: { increment: 1 },
        },
      });
      await tx.auditLog.create({
        data: {
          adminId: BigInt(req.user.sub),
          action: "user.password_reset",
          targetType: "user",
          targetId: target.id,
          payloadJson: { passwordReset: true },
        },
      });
    });

    return { id: String(target.id), passwordReset: true };
  }
}
@Controller("api/v1/admin/children")
@Roles("super_admin", "operator")
export class AdminChildController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profile: ProfileService,
  ) {}
  @Get()
  async list(
    @Query("page") page = 1,
    @Query("pageSize") pageSize = 20,
    @Query("approved") approved?: string,
    @Query("profileStatus") profileStatus?: string,
  ) {
    const where: any = {};
    if (profileStatus !== undefined && profileStatus !== "")
      where.profileStatus = Number(profileStatus);
    if (approved === "true")
      Object.assign(where, {
        profileStatus: 2,
        matchmakingStatus: "active",
        owner: { status: 1, cancelStatus: 0 },
      });
    const take = Math.min(Math.max(Number(pageSize) || 20, 1), 100);
    const [total, rows] = await Promise.all([
      this.prisma.childProfile.count({ where }),
      this.prisma.childProfile.findMany({
        where,
        take,
        skip: (Math.max(Number(page) || 1, 1) - 1) * take,
        orderBy: { id: "desc" },
        include: { owner: true },
      }),
    ]);
    return {
      total,
      items: await Promise.all(
        rows.map(async (p) => ({
          id: String(p.id),
          profileNumber: `C${String(p.id).padStart(6, "0")}`,
          ownerAccountId: String(p.ownerAccountId),
          parentName: p.owner.nickname,
          phone: phone(p.owner.phone),
          profileStatus: p.profileStatus,
          payload: await this.profile.decorate(
            approved === "true" ? p.approvedPayload : p.draft,
          ),
          updatedAt: p.updatedAt,
        })),
      ),
    };
  }
}
