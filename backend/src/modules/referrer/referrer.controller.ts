import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import type { Response } from "express";
import { ReferrerService } from "./referrer.service";
import { Roles, JwtPayload } from "@/common/decorators";

@ApiTags("referrer")
@Controller("api/v1")
@Roles("user")
export class ReferrerController {
  constructor(private readonly svc: ReferrerService) {}

  @Get("me/invite-code")
  @ApiOperation({ summary: "我的邀请码" })
  async myInviteCode(@Req() req: { user: JwtPayload }) {
    return this.svc.myInviteCode(BigInt(req.user.sub));
  }

  @Get("me/invites")
  @ApiOperation({ summary: "我邀请过的人" })
  async myInvitees(@Req() req: { user: JwtPayload }) {
    return this.svc.myInvitees(BigInt(req.user.sub));
  }

  @Get("me/invite-qrcode")
  @ApiOperation({ summary: "我的推广二维码（PNG）" })
  async myInviteQrcode(@Req() req: { user: JwtPayload }, @Res() res: Response) {
    const png = await this.svc.myInviteQrcode(BigInt(req.user.sub));
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(png);
  }
}

@ApiTags("admin-referrer")
@Controller("api/v1/admin/referrers")
@Roles("super_admin", "operator")
export class AdminReferrerController {
  constructor(private readonly svc: ReferrerService) {}

  @Get()
  @ApiOperation({ summary: "介绍人列表" })
  @ApiQuery({ name: "page", required: false })
  @ApiQuery({ name: "pageSize", required: false })
  @ApiQuery({ name: "keyword", required: false })
  async list(
    @Query("page") page = 1,
    @Query("pageSize") pageSize = 20,
    @Query("keyword") keyword?: string,
  ) {
    return this.svc.adminListReferrers(Number(page), Number(pageSize), keyword);
  }

  // 注意：必须放在 :id 路由之前，否则会被通配匹配
  @Get("candidates")
  @ApiOperation({ summary: "待发展介绍人（isReferrer=false）" })
  async candidates(
    @Query("page") page = 1,
    @Query("pageSize") pageSize = 20,
    @Query("keyword") keyword?: string,
  ) {
    return this.svc.adminListCandidates(
      Number(page),
      Number(pageSize),
      keyword,
    );
  }

  @Post()
  @Roles("super_admin")
  @ApiOperation({ summary: "新建介绍人（手机号已注册则直接升级）" })
  async create(
    @Req() req: { user: JwtPayload },
    @Body() body: { phone: string; nickname: string; password?: string },
  ) {
    return this.svc.adminCreateReferrer({
      phone: body.phone,
      nickname: body.nickname,
      password: body.password,
      adminId: BigInt(req.user.sub),
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "介绍人详情" })
  async detail(@Req() req: { user: JwtPayload }, @Param("id") id: string) {
    return this.svc.adminGetReferrer(BigInt(id), req.user.role);
  }

  @Put(":id")
  @ApiOperation({ summary: "编辑介绍人（昵称/状态）" })
  async update(
    @Req() req: { user: JwtPayload },
    @Param("id") id: string,
    @Body() body: { nickname?: string; status?: number },
  ) {
    return this.svc.adminUpdateReferrer(BigInt(id), body, BigInt(req.user.sub));
  }

  @Post(":id/promote")
  @Roles("super_admin")
  @ApiOperation({ summary: "将用户设为介绍人" })
  async promote(@Req() req: { user: JwtPayload }, @Param("id") id: string) {
    return this.svc.adminPromoteReferrer(BigInt(id), BigInt(req.user.sub));
  }

  @Post(":id/demote")
  @Roles("super_admin")
  @ApiOperation({ summary: "取消介绍人身份（无邀请用户时）" })
  async demote(@Req() req: { user: JwtPayload }, @Param("id") id: string) {
    return this.svc.adminDemoteReferrer(BigInt(id), BigInt(req.user.sub));
  }

  @Get(":id/invitees")
  @ApiOperation({ summary: "某介绍人邀请的用户" })
  async invitees(@Req() req: { user: JwtPayload }, @Param("id") id: string) {
    return this.svc.adminInvitees(BigInt(id), req.user.role);
  }

  @Get(":id/invite-qrcode")
  @ApiOperation({ summary: "介绍人推广二维码 PNG" })
  async inviteQrcode(@Param("id") id: string, @Res() res: Response) {
    const png = await this.svc.adminInviteQrcode(BigInt(id));
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "no-store");
    res.send(png);
  }

  @Get(":id/invite-url")
  @ApiOperation({ summary: "介绍人推广链接（JSON）" })
  async inviteUrl(@Param("id") id: string) {
    return this.svc.adminInviteUrl(BigInt(id));
  }
}

@ApiTags("admin-user")
@Controller("api/v1/admin/users")
export class AdminUserReferrerController {
  constructor(private readonly svc: ReferrerService) {}

  @Post(":id/transfer-referrer")
  @Roles("super_admin")
  @ApiOperation({ summary: "转让介绍人（仅 super_admin）" })
  async transfer(
    @Req() req: { user: JwtPayload },
    @Param("id") id: string,
    @Body() body: { newReferrerId: string; reason: string },
  ) {
    return this.svc.transferReferrer(
      BigInt(id),
      BigInt(body.newReferrerId),
      BigInt(req.user.sub),
      body.reason,
    );
  }
}
