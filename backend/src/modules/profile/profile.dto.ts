import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayUnique,
  Equals,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { PROFILE_OPTIONS } from './profile.options';

export class PreferenceDto {
  @IsOptional() @IsInt() @Min(1900) @Max(2100) birthYearMin?: number | null;
  @IsOptional() @IsInt() @Min(1900) @Max(2100) birthYearMax?: number | null;
  @IsOptional() @IsInt() @Min(100) @Max(230) heightMin?: number | null;
  @IsOptional() @IsInt() @Min(100) @Max(230) heightMax?: number | null;
  @IsOptional()
  @IsIn(PROFILE_OPTIONS.education.map((x) => x.value))
  educationMin?: string | null;
  @IsOptional() @IsInt() @Min(1) cityId?: number | null;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(2)
  @IsIn(PROFILE_OPTIONS.expectations, { each: true })
  tags?: string[];
}
export class ProfileFieldsDto {
  @IsOptional() @IsIn(['father', 'mother']) relationship?: string | null;
  @IsOptional() @IsString() @MaxLength(50) nickname?: string;
  @IsOptional() @IsInt() @IsIn([1, 2]) gender?: number | null;
  @ApiProperty({ example: '1998-06-15', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  birthDate?: string | null;
  @IsOptional() @IsInt() @Min(100) @Max(230) height?: number | null;
  @IsOptional() @IsInt() @Min(1) cityId?: number | null;
  @IsOptional()
  @IsIn(PROFILE_OPTIONS.education.map((x) => x.value))
  education?: string | null;
  @IsOptional() @IsIn(PROFILE_OPTIONS.income.map((x) => x.value)) income?:
    | string
    | null;
  @IsOptional() @IsString() @MaxLength(100) occupation?: string;
  @IsOptional()
  @IsIn(PROFILE_OPTIONS.maritalStatus.map((x) => x.value))
  maritalStatus?: string | null;
  @IsOptional() @IsInt() @Min(1) hometownCityId?: number | null;
  @IsOptional() @IsInt() @Min(1) workCityId?: number | null;
  @IsOptional()
  @IsIn(PROFILE_OPTIONS.carStatus.map((x) => x.value))
  carStatus?: string | null;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(2)
  @IsIn(PROFILE_OPTIONS.traits, { each: true })
  traits?: string[];
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(2)
  @IsIn(PROFILE_OPTIONS.advantages, { each: true })
  advantages?: string[];
  @IsOptional() @IsString() @MaxLength(1000) introduction?: string;
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(9)
  @IsString({ each: true })
  @MaxLength(255, { each: true })
  photoOssKeys?: string[];
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => PreferenceDto)
  preference?: PreferenceDto;
}
export class SaveDraftDto {
  @IsOptional()
  @IsIn([
    'gender',
    'education',
    'income',
    'city',
    'relationship',
    'birthDate',
    'height',
    'nickname',
    'occupation',
    'maritalStatus',
    'hometown',
    'workCity',
    'car',
    'traits',
    'advantages',
    'introduction',
    'photos',
    'targetHeight',
    'targetBirth',
    'targetEducation',
    'targetCity',
    'expectations',
    'review',
  ])
  currentStep?: string;
  @ApiProperty({ type: ProfileFieldsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => ProfileFieldsDto)
  payload!: ProfileFieldsDto;
  @IsInt() @Min(0) expectedRevision!: number;
}
export class SubmitProfileDto {
  @IsInt() @Min(1) expectedRevision!: number;
  @IsBoolean() @Equals(true) childConsent!: boolean;
  @IsString() @Equals('2026-10-06') consentVersion!: string;
}
export class RejectProfileDto {
  @IsString() @Matches(/\S/) @MaxLength(500) reason!: string;
}
