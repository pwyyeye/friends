import {
  IsMobilePhone,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsBoolean,
  Equals,
  IsIn,
  IsUUID,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

const PHONE_LOCALE = "zh-CN";

export class RegisterDto {
  @IsBoolean() @Equals(true) termsAccepted!: boolean;
  @ApiProperty({ example: "13800138000", description: "手机号" })
  @IsString()
  @IsMobilePhone(PHONE_LOCALE)
  phone!: string;

  @ApiProperty({ example: "123456", description: "密码 6–32 位，不限制字母或数字" })
  @IsString()
  @MinLength(6, { message: "密码至少需要 6 位" })
  @MaxLength(32, { message: "密码最多为 32 位" })
  password!: string;

  @ApiProperty({
    required: false,
    example: "123456",
    description: "介绍人 6 位邀请码（选填）",
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: "邀请码必须为 6 位数字" })
  inviteCode?: string;

  @ApiProperty({ example: "林妈妈", description: "父母称呼" })
  @IsString()
  @Matches(/\S/, { message: "请填写您的称呼" })
  @MaxLength(50)
  nickname!: string;
}

export class SendSmsDto {
  @IsMobilePhone(PHONE_LOCALE) phone!: string;
  @IsIn(["login", "register"]) purpose!: "login" | "register";
}
export class VerifySmsDto extends SendSmsDto {
  @IsUUID() challengeId!: string;
  @IsString() @Matches(/^\d{6}$/) code!: string;
}
export class SmsLoginDto extends VerifySmsDto {
  @IsOptional() @IsString() @MaxLength(50) nickname?: string;
  @IsOptional() @IsString() @Matches(/^\d{6}$/) inviteCode?: string;
  @IsBoolean() @Equals(true) termsAccepted!: boolean;
}

export class LoginDto {
  @ApiProperty({ example: "13800138000" })
  @IsString()
  @IsMobilePhone(PHONE_LOCALE)
  phone!: string;

  @ApiProperty({ example: "Pass1234" })
  @IsString()
  password!: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: "admin" })
  @IsString()
  username!: string;

  @ApiProperty({ example: "Admin@123" })
  @IsString()
  password!: string;
}
