import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID, createHmac, timingSafeEqual } from "crypto";
import { readFile, mkdir, writeFile } from "fs/promises";
import path from "path";
import OSS from "ali-oss";
import { PrismaService } from "@/prisma/prisma.service";
import { BizException } from "@/common/exceptions";
import { BizCode } from "@/common/constants";
const MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_SIZE = 5 * 1024 * 1024;
type Purpose = "avatar" | "lifestyle";
@Injectable()
export class UploadService {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}
  private client() {
    const accessKeyId = this.config.get<string>("OSS_ACCESS_KEY"),
      accessKeySecret = this.config.get<string>("OSS_SECRET_KEY");
    if (!accessKeyId || !accessKeySecret)
      throw new BizException(BizCode.UPLOAD_SIGN_FAILED, "未配置 OSS 凭证");
    return new OSS({
      region: this.config.get<string>("OSS_REGION")!,
      accessKeyId,
      accessKeySecret,
      bucket: this.config.get<string>("OSS_BUCKET")!,
      endpoint: this.config.get<string>("OSS_ENDPOINT")!,
    });
  }
  private checkKey(key: string) {
    if (
      !/^(avatar|lifestyle)\/\d+\/\d+\/\d{6}\/[a-f0-9-]+\.(jpg|jpeg|png|webp)$/.test(
        key,
      )
    )
      throw new BizException(BizCode.BAD_REQUEST, "图片路径无效");
  }
  async signUpload(
    userId: bigint,
    filename: string,
    mimeType: string,
    size: number,
    purpose: Purpose = "lifestyle",
    profileId?: bigint,
  ) {
    if (!MIME.has(mimeType) || !["avatar", "lifestyle"].includes(purpose))
      throw new BizException(BizCode.UPLOAD_FILE_TYPE_INVALID);
    if (!Number.isInteger(size) || size <= 0 || size > MAX_SIZE)
      throw new BizException(BizCode.UPLOAD_FILE_TOO_LARGE);
    const ext = filename.split(".").pop()?.toLowerCase();
    if (!ext || !["jpg", "jpeg", "png", "webp"].includes(ext))
      throw new BizException(BizCode.UPLOAD_FILE_TYPE_INVALID);
    const profile = await this.prisma.childProfile.findFirst({
      where: { id: profileId, ownerAccountId: userId },
    });
    if (!profile)
      throw new BizException(BizCode.PROFILE_NOT_FOUND, "请先保存孩子的资料");
    const key = `${purpose}/${userId}/${profile.id}/${new Date().toISOString().slice(0, 7).replace("-", "")}/${randomUUID()}.${ext}`;
    const provider = this.config.get<string>("OSS_PROVIDER") ?? "mock";
    const uploadUrl =
      provider === "mock"
        ? "/api/v1/upload/mock-put"
        : this.client().signatureUrl(key, {
            method: "PUT",
            expires: 60,
            "Content-Type": mimeType,
          });
    await this.prisma.uploadedFile.create({
      data: {
        userId,
        profileId: profile.id,
        ossKey: key,
        url: "",
        size,
        mimeType,
        purpose,
      },
    });
    return {
      provider,
      key,
      method: provider === "mock" ? "POST" : "PUT",
      url: uploadUrl,
      mockUploadUrl: uploadUrl,
      headers: { "Content-Type": mimeType },
      formData: { key },
      publicUrl: this.toPublicUrl(key),
    };
  }
  async commitUpload(
    userId: bigint,
    key: string,
    _url: string,
    size: number,
    mimeType: string,
    purpose: Purpose = "lifestyle",
    profileId?: bigint,
  ) {
    this.checkKey(key);
    const ticket = await this.prisma.uploadedFile.findUnique({
      where: { ossKey: key },
      include: { profile: true },
    });
    if (
      !ticket ||
      ticket.userId !== userId ||
      ticket.profile.ownerAccountId !== userId ||
      (profileId != null && ticket.profileId !== profileId) ||
      ticket.size !== size ||
      ticket.mimeType !== mimeType ||
      ticket.purpose !== purpose
    )
      throw new BizException(
        BizCode.BAD_REQUEST,
        "上传记录与当前孩子档案不一致",
      );
    if (this.config.get<string>("OSS_PROVIDER") === "mock") {
      try {
        const buffer = await readFile(path.join(process.cwd(), "uploads", key));
        if (buffer.length !== size) throw new Error("size");
      } catch {
        throw new BizException(
          BizCode.UPLOAD_FILE_NOT_FOUND,
          "图片尚未上传完成",
        );
      }
    } else {
      const head = await this.client().head(key);
      if (Number(head.res.headers["content-length"]) !== size)
        throw new BizException(BizCode.BAD_REQUEST, "图片大小不匹配");
    }
    await this.prisma.uploadedFile.update({
      where: { ossKey: key },
      data: { committed: true },
    });
    return {
      ok: true,
      ossKey: key,
      url: this.toPublicUrl(key),
      profileId: String(ticket.profileId),
    };
  }
  async saveMockUpload(
    userId: bigint,
    file: { buffer: Buffer; mimetype: string; size: number },
    key: string,
  ) {
    if (this.config.get<string>("OSS_PROVIDER") !== "mock")
      throw new BizException(BizCode.NOT_FOUND);
    this.checkKey(key);
    const ticket = await this.prisma.uploadedFile.findUnique({
      where: { ossKey: key },
      include: { profile: true },
    });
    if (
      !file ||
      !ticket ||
      ticket.userId !== userId ||
      ticket.profile.ownerAccountId !== userId ||
      ticket.committed ||
      ticket.size !== file.size ||
      ticket.mimeType !== file.mimetype ||
      file.size > MAX_SIZE
    )
      throw new BizException(BizCode.BAD_REQUEST, "上传请求无效");
    const local = path.join(process.cwd(), "uploads", key);
    await mkdir(path.dirname(local), { recursive: true });
    await writeFile(local, file.buffer);
    return { ok: true };
  }
  private signature(key: string, expires: string) {
    return createHmac("sha256", this.config.get<string>("JWT_SECRET")!)
      .update(`${key}:${expires}`)
      .digest("hex");
  }
  async mockFile(key: string, expires: string, signature: string) {
    this.checkKey(key);
    const expected = this.signature(key, expires);
    if (
      !/^\d+$/.test(expires) ||
      Number(expires) < Math.floor(Date.now() / 1000) ||
      Number(expires) > Math.floor(Date.now() / 1000) + 3600 ||
      !/^[a-f0-9]{64}$/.test(signature) ||
      !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
    )
      throw new BizException(BizCode.FORBIDDEN, "图片链接无效或已过期", 403);
    if (this.config.get<string>("OSS_PROVIDER") !== "mock")
      throw new BizException(BizCode.NOT_FOUND);
    const file = await this.prisma.uploadedFile.findUnique({
      where: { ossKey: key },
      select: { committed: true, mimeType: true },
    });
    if (!file?.committed) throw new BizException(BizCode.UPLOAD_FILE_NOT_FOUND);
    return {
      buffer: await readFile(path.join(process.cwd(), "uploads", key)),
      mimeType: file.mimeType,
    };
  }
  toPublicUrl(key: string | null | undefined): string | null {
    if (!key) return null;
    if (this.config.get<string>("OSS_PROVIDER") !== "mock")
      return this.client().signatureUrl(key, { expires: 3600 });
    const expires = String(Math.floor(Date.now() / 1000) + 3600);
    const base = (this.config.get<string>("MOCK_BASE_URL") ?? "").replace(
      /\/+$/,
      "",
    );
    return `${base}/api/v1/upload/mock-file/${key}?expires=${expires}&signature=${this.signature(key, expires)}`;
  }
}
