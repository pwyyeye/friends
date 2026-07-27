import {
  IsMobilePhone,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

const PHONE_LOCALE = 'zh-CN';

export class RegisterDto {
  @ApiProperty({ example: '13800138000', description: '手机号' })
  @IsString()
  @IsMobilePhone(PHONE_LOCALE)
  phone!: string;

  @ApiProperty({ example: 'Pass1234', description: '密码 ≥ 8 位，含字母+数字' })
  @IsString()
  @MinLength(8)
  @MaxLength(32)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: '密码必须同时包含字母和数字',
  })
  password!: string;

  @ApiProperty({ required: false, example: '123456', description: '介绍人 6 位邀请码（选填）' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: '邀请码必须为 6 位数字' })
  inviteCode?: string;

  @ApiProperty({ required: false, example: '小明' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;
}

export class LoginDto {
  @ApiProperty({ example: '13800138000' })
  @IsString()
  @IsMobilePhone(PHONE_LOCALE)
  phone!: string;

  @ApiProperty({ example: 'Pass1234' })
  @IsString()
  password!: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'admin' })
  @IsString()
  username!: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  password!: string;
}