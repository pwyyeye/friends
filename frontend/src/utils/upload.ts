import { post } from "@/api/request";
import { useAuthStore } from "@/store/auth";
interface SignedUpload {
  provider: "mock" | "aliyun";
  key: string;
  url: string;
  method: "POST" | "PUT";
  headers?: Record<string, string>;
}
export interface UploadResult {
  ossKey: string;
  url: string;
}
export async function uploadImage(
  file: File,
  purpose: "avatar" | "lifestyle",
  profileId: string,
): Promise<UploadResult> {
  const metadata = {
    filename: file.name,
    mimeType: file.type,
    size: file.size,
    purpose,
    profileId,
  };
  const sign = await post<SignedUpload>("/api/v1/upload/sign", metadata);
  let response: Response;
  if (sign.provider === "mock") {
    const data = new FormData();
    data.append("key", sign.key);
    data.append("file", file, file.name);
    response = await fetch(sign.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${useAuthStore().token}` },
      body: data,
    });
  } else
    response = await fetch(sign.url, {
      method: sign.method,
      headers: sign.headers || {},
      body: file,
    });
  if (!response.ok) throw new Error("照片上传失败");
  return post<UploadResult>("/api/v1/upload/commit", {
    ...metadata,
    ossKey: sign.key,
  });
}
