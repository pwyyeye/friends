import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { ProfileService } from "@/modules/profile/profile.service";
import { BizException } from "@/common/exceptions";
import { BizCode } from "@/common/constants";
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly profiles: ProfileService,
  ) {}
  async me(userId: bigint) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrer: { select: { id: true, nickname: true, inviteCode: true } },
      },
    });
    if (!u) throw new BizException(BizCode.USER_NOT_FOUND);
    return {
      id: String(u.id),
      phone: u.phone.slice(0, 3) + "****" + u.phone.slice(-4),
      nickname: u.nickname,
      inviteCode: u.inviteCode,
      isReferrer: u.isReferrer,
      status: u.status,
      cancelStatus: u.cancelStatus,
      referrer: u.referrer,
      childProfile: await this.profiles.mine(userId),
    };
  }
  updateAccount(userId: bigint, nickname: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { nickname: nickname.trim() },
      select: { id: true, nickname: true },
    });
  }
  myProfile(userId: bigint) {
    return this.profiles.mine(userId);
  }
  async requestCancel(userId: bigint) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { cancelStatus: 1, cancelAt: new Date() },
      select: { cancelStatus: true, cancelAt: true },
    });
  }
}
