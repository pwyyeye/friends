import { post } from '@/api/request';

export interface SignedUpload {
  provider: 'mock' | 'aliyun';
  key: string;
  url: string;
  method: 'POST' | 'PUT';
  headers?: Record<string, string>;
  formData?: Record<string, string> | null;
  publicUrl?: string;
  mockUploadUrl?: string;
}

export interface UploadResult {
  ossKey: string;
  url: string;
}

/**
 * 把浏览器选择的图片文件上传到 OSS（mock 模式走本地 mock-put）。
 *
 * 流程：
 *   1) POST /api/v1/upload/sign  拿到直传 url / key
 *   2) PUT（aliyun） 或 POST 表单（mock）真正上传字节
 *   3) POST /api/v1/upload/commit 把 ossKey 落到 User 表 / UserPhoto 表
 */
export async function uploadImage(
  file: File,
  purpose: 'avatar' | 'lifestyle' = 'avatar',
): Promise<UploadResult> {
  // 1) 申请签名
  const sign = await post<SignedUpload>('/api/v1/upload/sign', {
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    purpose,
  });

  // 2) 真正上传
  if (sign.provider === 'mock') {
    const fd = new FormData();
    fd.append('key', sign.key);
    fd.append('mimeType', file.type);
    fd.append('size', String(file.size));
    fd.append('file', file, file.name);
    await fetch(sign.url, { method: 'POST', body: fd });
  } else {
    await fetch(sign.url, {
      method: sign.method,
      headers: sign.headers ?? {},
      body: file,
    });
  }

  // 3) commit
  const publicUrl =
    sign.publicUrl ?? (sign.mockUploadUrl ? `${location.origin}/api/v1/upload/mock-file/${sign.key}` : '');
  const commit = await post<UploadResult>('/api/v1/upload/commit', {
    ossKey: sign.key,
    url: publicUrl,
    size: file.size,
    mimeType: file.type,
    purpose,
  });

  return { ossKey: commit.ossKey, url: commit.url || publicUrl };
}