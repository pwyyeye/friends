import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFeatureFlagsDto {
  @IsOptional()
  @IsBoolean()
  messages?: boolean;

  @IsOptional()
  @IsBoolean()
  verification?: boolean;

  @IsOptional()
  @IsBoolean()
  accelerate?: boolean;

  @IsOptional()
  @IsBoolean()
  favorite?: boolean;

  @IsOptional()
  @IsBoolean()
  unlock?: boolean;

  @IsOptional()
  @IsBoolean()
  likes?: boolean;
}
