import { IsString, Matches, MaxLength } from "class-validator";
export class UpdateUserDto {
  @IsString() @Matches(/\S/) @MaxLength(50) nickname!: string;
}
