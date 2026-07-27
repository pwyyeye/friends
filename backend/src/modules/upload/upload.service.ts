import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import OSS from 'ali-oss';
import { PrismaService } from '@/prisma/prisma.service';
import { BizException } from '@/common/exceptions';
import { BizCode } from '@/common/constants';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_SIZE = 5 * 1024 * 1024;
const MAX_LIFESTYLE_PHOTOS = 9;

type UploadPurpose = 'avatar' | 'lifestyle';

@Injectable()
export class UploadService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /** 生成 OSS 直传签名（mock 模式返回本地 mock-put URL） */
  async signUpload(
    userId: bigint,
    filename: string,
    mimeType: string,
    size: number,
    purpose: UploadPurpose = 'avatar',
  ) {
    if (!ALLOWED_MIME.has(mimeType)) {
      throw new BizException(BizCode.UPLOAD_FILE_TYPE_INVALID);
    }
    if (size <= 0 || size > MAX_SIZE) {
      throw new BizException(BizCode.UPLOAD_FILE_TOO_LARGE);
    }
    const ext = (filename.split('.').pop() ?? '').toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      throw new BizException(BizCode.UPLOAD_FILE_TYPE_INVALID);
    }

    // 生活照：限制总张数（1-9）
    if (purpose === 'lifestyle') {
      const count = await this.prisma.userPhoto.count({ where: { userId } });
      if (count >= MAX_LIFESTYLE_PHOTOS) {
        throw new BizException(BizCode.BAD_REQUEST, `生活照最多 ${MAX_LIFESTYLE_PHOTOS} 张`);
      }
    }

    const now = new Date();
    const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const key = `${purpose}/${userId}/${yyyymm}/${uuidv4()}.${ext}`;
    const provider = this.config.get<string>('OSS_PROVIDER') ?? 'aliyun';

    if (provider === 'mock') {
      const publicBase = `http://localhost:${this.config.get<string>('PORT') ?? '3000'}`;
      return {
        provider: 'mock' as const,
        key,
        url: `${publicBase}/api/v1/upload/mock-put`,
        method: 'POST' as const,
        headers: { 'Content-Type': mimeType },
        formData: { key, mimeType, size: String(size) },
        mockUploadUrl: `${publicBase}/api/v1/upload/mock-put`,
      };
    }

    // 阿里云 OSS：生成 PUT 策略签名
    const bucket = this.config.get<string>('OSS_BUCKET')!;
    const region = this.config.get<string>('OSS_REGION')!;
    const accessKeyId = this.config.get<string>('OSS_ACCESS_KEY')!;
    const accessKeySecret = this.config.get<string>('OSS_SECRET_KEY')!;
    const endpoint = this.config.get<string>('OSS_ENDPOINT')!;
    const publicBase = this.config.get<string>('OSS_PUBLIC_BASE')!;

    if (!accessKeyId || !accessKeySecret) {
      throw new BizException(BizCode.UPLOAD_SIGN_FAILED, '未配置阿里云 OSS 凭证');
    }

    const client = new OSS({ region, accessKeyId, accessKeySecret, bucket, endpoint });
    const expires = 60; // 60s 过期
    const signature = client.signatureUrl(key, {
      method: 'PUT',
      expires,
      'Content-Type': mimeType,
      'x:oss-content-length-range': `0,${MAX_SIZE}`,
    });

    return {
      provider: 'aliyun' as const,
      key,
      url: signature.split('?')[0],
      method: 'PUT' as const,
      headers: {
        'Content-Type': mimeType,
      },
      formData: null,
      publicUrl: `${publicBase}/${key}`,
      expiresAt: new Date(Date.now() + expires * 1000).toISOString(),
    };
  }

  /** 用户提交上传成功后的 OSS key。avatar: 写入 User.avatarOssKey；lifestyle: 写入 UserPhoto 表 */
  async commitUpload(
    userId: bigint,
    ossKey: string,
    url: string,
    size: number,
    mimeType: string,
    purpose: UploadPurpose = 'avatar',
  ) {
    if (!ossKey.startsWith(`${purpose}/${userId}/`)) {
      throw new BizException(BizCode.UPLOAD_FILE_TYPE_INVALID, '非法 key 前缀');
    }
    await this.prisma.uploadedFile.create({
      data: { userId, ossKey, url, size, mimeType, purpose },
    });

    if (purpose === 'avatar') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { avatarOssKey: ossKey },
      });
      return { ok: true, url, ossKey };
    }

    // lifestyle: 插入 UserPhoto（重复 ossKey 视为幂等成功）
    const sort = await this.prisma.userPhoto.count({ where: { userId } });
    const photo = await this.prisma.userPhoto.upsert({
      where: { userId_ossKey: { userId, ossKey } },
      update: {},
      create: { userId, ossKey, url, sort },
    });
    return { ok: true, url, ossKey, photoId: String(photo.id) };
  }

  /** mock 驱动：保存上传的本地文件 */
  async saveMockUpload(file: { buffer: Buffer; mimetype: string; size: number }, key: string) {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BizException(BizCode.UPLOAD_FILE_TYPE_INVALID);
    }
    if (file.size > MAX_SIZE) {
      throw new BizException(BizCode.UPLOAD_FILE_TOO_LARGE);
    }
    const fs = await import('fs/promises');
    const path = await import('path');
    const localDir = path.join(process.cwd(), 'uploads');
    const localPath = path.join(localDir, key);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    await fs.writeFile(localPath, file.buffer);
    return { key, localPath };
  }

  /**
   * 把 OSS key 转为可访问 URL。
   * - mock 模式 → 本地静态文件端点
   * - aliyun   → OSS_PUBLIC_BASE/key
   */
  toPublicUrl(key: string | null | undefined): string | null {
    if (!key) return null;
    const provider = this.config.get<string>('OSS_PROVIDER') ?? 'aliyun';
    if (provider === 'mock') {
      const port = this.config.get<string>('PORT') ?? '3000';
      return `http://localhost:${port}/api/v1/upload/mock-file/${key}`;
    }
    const publicBase = this.config.get<string>('OSS_PUBLIC_BASE')!;
    return `${publicBase}/${key}`;
  }
}