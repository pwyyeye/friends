import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @ApiProperty({ required: false, example: 1, description: '1男 2女' })
  @IsOptional()
  @IsInt()
  gender?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(18)
  age?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  cityId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  height?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  occupationId?: number;

  @ApiProperty({ required: false, description: '字典无对应时自填' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  occupationCustom?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  avatarOssKey?: string;
}