import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';
import { UpdateFeatureFlagsDto } from './features.dto';

export const FEATURE_DEFINITIONS = [
  {
    key: 'messages',
    label: '消息中心',
    description: '控制消息入口、互动提醒和通知开关',
  },
  {
    key: 'verification',
    label: '实名认证',
    description: '控制“我的”页面中的实名核验入口',
  },
  {
    key: 'accelerate',
    label: '加速脱单',
    description: '控制加速脱单页面和底部导航入口',
  },
  {
    key: 'favorite',
    label: '资料收藏',
    description: '控制推荐资料收藏及其记录',
  },
  {
    key: 'unlock',
    label: '了解意向',
    description: '控制资料详情中的了解意向申请',
  },
  {
    key: 'likes',
    label: '沾喜气',
    description: '控制加速脱单动态中的点赞互动',
  },
] as const;

export type FeatureKey = (typeof FEATURE_DEFINITIONS)[number]['key'];

@Injectable()
export class FeaturesService {
  constructor(private readonly prisma: PrismaService) {}

  async getFlags() {
    const rows = await this.prisma.featureFlag.findMany({
      where: { key: { in: FEATURE_DEFINITIONS.map(item => item.key) } },
    });
    const stored = new Map(rows.map(row => [row.key, row]));
    return Object.fromEntries(
      FEATURE_DEFINITIONS.map(item => [
        item.key,
        stored.get(item.key)?.enabled ?? true,
      ]),
    ) as Record<FeatureKey, boolean>;
  }

  async isEnabled(key: FeatureKey) {
    const row = await this.prisma.featureFlag.findUnique({ where: { key } });
    return row?.enabled ?? true;
  }

  async assertEnabled(key: FeatureKey) {
    if (!(await this.isEnabled(key))) {
      const definition = FEATURE_DEFINITIONS.find(item => item.key === key);
      throw new BizException(
        BizCode.FEATURE_DISABLED,
        `${definition?.label ?? '该功能'}暂未开放`,
        403,
      );
    }
  }

  async adminList() {
    const flags = await this.getFlags();
    const rows = await this.prisma.featureFlag.findMany({
      where: { key: { in: FEATURE_DEFINITIONS.map(item => item.key) } },
    });
    const times = new Map(rows.map(row => [row.key, row.updatedAt]));
    return FEATURE_DEFINITIONS.map(item => ({
      ...item,
      enabled: flags[item.key],
      updatedAt: times.get(item.key) ?? null,
    }));
  }

  async update(dto: UpdateFeatureFlagsDto, adminId: bigint) {
    const updates = FEATURE_DEFINITIONS.filter(
      item => dto[item.key] !== undefined,
    );
    await this.prisma.$transaction(
      updates.map(item =>
        this.prisma.featureFlag.upsert({
          where: { key: item.key },
          create: {
            key: item.key,
            enabled: dto[item.key]!,
            updatedBy: adminId,
          },
          update: {
            enabled: dto[item.key]!,
            updatedBy: adminId,
          },
        }),
      ),
    );
    return this.adminList();
  }
}
