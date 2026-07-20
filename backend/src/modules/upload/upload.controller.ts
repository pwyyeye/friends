import {
  Body,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { Public, JwtPayload } from '@/common/decorators';

@ApiTags('upload')
@Controller('api/v1/upload')
export class UploadController {
  constructor(private readonly svc: UploadService) {}

  @Post('sign')
  @ApiOperation({ summary: '申请 OSS 直传策略' })
  async sign(
    @Req() req: { user: JwtPayload },
    @Body() body: { filename: string; mimeType: string; size: number },
  ) {
    return this.svc.signUpload(
      BigInt(req.user.sub),
      body.filename,
      body.mimeType,
      body.size,
    );
  }

  @Post('commit')
  @ApiOperation({ summary: '提交上传成功的 OSS key' })
  async commit(
    @Req() req: { user: JwtPayload },
    @Body() body: { ossKey: string; url: string; size: number; mimeType: string },
  ) {
    return this.svc.commitUpload(
      BigInt(req.user.sub),
      body.ossKey,
      body.url,
      body.size,
      body.mimeType,
    );
  }

  /** mock 驱动：本地模拟 PUT 上传（仅 OSS_PROVIDER=mock 时使用） */
  @Public()
  @Post('mock-put')
  @ApiOperation({ summary: 'mock 模式本地直传端点' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        key: { type: 'string' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['key', 'file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async mockPut(
    @UploadedFile() file: { buffer: Buffer; mimetype: string; size: number },
    @Body('key') key: string,
  ) {
    return this.svc.saveMockUpload(file, key);
  }
}