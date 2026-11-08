import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RecommendationQueryDto {
  @IsOptional() @Type(() => Number) @IsIn([0, 1, 2]) gender?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) cityId?: number;
  @IsOptional() @IsString() @MaxLength(50) keyword?: string;
}
