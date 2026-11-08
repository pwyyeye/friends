import { ApiProperty } from "@nestjs/swagger";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

export class CreateMatchDto {
  @ApiProperty({ description: "孩子 A profileId" })
  @IsInt()
  @Min(1)
  profileAId!: number;

  @ApiProperty({ description: "孩子 B profileId" })
  @IsInt()
  @Min(1)
  profileBId!: number;

  @ApiProperty({ description: "介绍人 userId（选填）", required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  referrerId?: number;

  @ApiProperty({ example: "2026-07-20T10:00:00.000Z" })
  @IsDateString()
  matchedAt!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
