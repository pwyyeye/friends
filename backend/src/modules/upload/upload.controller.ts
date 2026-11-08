import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { UploadService } from "./upload.service";
import { Public, JwtPayload, Roles } from "@/common/decorators";
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";
class SignUploadDto {
  @IsString() @MaxLength(255) filename!: string;
  @IsIn(["image/jpeg", "image/png", "image/webp"]) mimeType!: string;
  @IsInt() @Min(1) size!: number;
  @IsIn(["avatar", "lifestyle"]) purpose!: "avatar" | "lifestyle";
  @IsString() @Matches(/^\d+$/) profileId!: string;
}
class CommitUploadDto extends SignUploadDto {
  @IsString() @MaxLength(255) ossKey!: string;
  @IsOptional() @IsString() @MaxLength(2000) url?: string;
}
@ApiTags("upload")
@Controller("api/v1/upload")
@Roles("user")
export class UploadController {
  constructor(private readonly svc: UploadService) {}
  @Post("sign")
  sign(@Req() req: { user: JwtPayload }, @Body() b: SignUploadDto) {
    return this.svc.signUpload(
      BigInt(req.user.sub),
      b.filename,
      b.mimeType,
      b.size,
      b.purpose,
      BigInt(b.profileId),
    );
  }
  @Post("commit")
  commit(@Req() req: { user: JwtPayload }, @Body() b: CommitUploadDto) {
    return this.svc.commitUpload(
      BigInt(req.user.sub),
      b.ossKey,
      b.url ?? "",
      b.size,
      b.mimeType,
      b.purpose,
      BigInt(b.profileId),
    );
  }
  @Post("mock-put")
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  put(
    @Req() req: { user: JwtPayload },
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
    @Body("key") key: string,
  ) {
    return this.svc.saveMockUpload(BigInt(req.user.sub), file, key);
  }
  @Public()
  @Get("mock-file/:purpose/:user/:profile/:month/:filename")
  async file(
    @Param() p: Record<string, string>,
    @Query("expires") expires = "",
    @Query("signature") signature = "",
    @Res() res: Response,
  ) {
    const file = await this.svc.mockFile(
      `${p.purpose}/${p.user}/${p.profile}/${p.month}/${p.filename}`,
      expires,
      signature,
    );
    res.setHeader("Content-Type", file.mimeType);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(file.buffer);
  }
}
