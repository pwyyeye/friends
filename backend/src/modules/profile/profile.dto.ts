import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class RequirementDto {
  @ApiProperty({ example: 2, description: '1男 2女 0不限' })
  @IsInt()
  targetGender!: number;

  @ApiProperty({ required: false, example: 25 })
  @IsOptional()
  @IsInt()
  targetAgeMin?: number;

  @ApiProperty({ required: false, example: 32 })
  @IsOptional()
  @IsInt()
  targetAgeMax?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  targetCityId?: number;

  @ApiProperty({ required: false, description: '自我介绍' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  selfDesc?: string;
}

export class SubmitProfileDto {
  @ApiProperty({ example: '小红' })
  @IsString()
  @MaxLength(50)
  nickname!: string;

  @ApiProperty({ example: 2, description: '1男 2女' })
  @IsInt()
  gender!: number;

  @ApiProperty({ example: 26 })
  @IsInt()
  @Min(18)
  age!: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  cityId!: number;

  @ApiProperty({ example: 165 })
  @IsOptional()
  @IsInt()
  height?: number;

  @ApiProperty({ example: 5, required: false })
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

  @ApiProperty({ example: [1, 2, 3], description: '兴趣标签 id 列表' })
  @IsArray()
  interestTagIds!: number[];

  @ApiProperty({ example: ['露营', '剧本杀'], description: '自定义兴趣词' })
  @IsArray()
  customInterests!: string[];

  @ApiProperty({ type: RequirementDto })
  requirement!: RequirementDto;
}

export class RejectProfileDto {
  @ApiProperty({ example: '头像不规范，请重新上传' })
  @IsString()
  @MaxLength(500)
  reason!: string;
}