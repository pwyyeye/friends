import { IsBoolean, IsIn, IsOptional } from 'class-validator';

export const SOCIAL_INTERACTION_KINDS = [
  'favorite',
  'view',
  'unlock',
  'like',
] as const;

export type SocialInteractionKind =
  (typeof SOCIAL_INTERACTION_KINDS)[number];

export class SocialListQueryDto {
  @IsOptional()
  @IsIn(SOCIAL_INTERACTION_KINDS)
  kind?: SocialInteractionKind;
}

export class NotificationSettingDto {
  @IsBoolean()
  enabled!: boolean;
}
