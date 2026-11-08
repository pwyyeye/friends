import axios, { AxiosInstance, AxiosResponse } from "axios";
import { failToast, infoDialog } from "@/utils/toast";
import { useAuthStore } from "@/store/auth";

export interface ApiEnvelope<T = unknown> {
  code: number;
  message: string;
  data: T;
  requestId: string;
}

const instance: AxiosInstance = axios.create({
  baseURL: "/",
  timeout: 15000,
});

function chineseMessage(message: unknown, fallback: string) {
  const text = Array.isArray(message) ? message.join('；') : message;
  return typeof text === 'string' && /[\u4e00-\u9fff]/.test(text) ? text : fallback;
}

instance.interceptors.request.use((config) => {
  const auth = useAuthStore();
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (response: AxiosResponse<ApiEnvelope>) => {
    const body = response.data;
    if (body && typeof body === "object" && "code" in body) {
      if (body.code === 0) return body.data as any;
      body.message = chineseMessage(body.message, '请求失败，请稍后重试');
      if (body.code === 1001 || body.code === 1002) {
        const auth = useAuthStore();
        auth.logout();
        infoDialog({ message: "登录已过期，请重新登录" }).then(() => {
          location.hash = "#/login";
          location.reload();
        });
      } else if (body.code === 1003) {
        failToast("权限不足");
      } else if (body.code === 1004) {
        failToast("操作频繁，请稍后再试");
      } else if (body.code === 4003) {
        failToast(body.message || "资料已被驳回，请修改后重新提交");
      } else {
        failToast(body.message || "请求失败");
      }
      return Promise.reject(body);
    }
    return response.data as any;
  },
  (error) => {
    const data = error.response?.data;
    const message = chineseMessage(data?.message, error.response ? '请求失败，请检查填写内容后重试' : '网络异常，请检查网络后重试');
    error.message = message;
    if (data && typeof data === 'object') data.message = message;
    const bizCode = data?.code;
    // 会话已失效：未登录(1001) / token 过期(1002) / 用户不存在(2002，常见于 DB 重新
    // seed 后旧 token 的 sub 已无对应用户)。统一清空登录态并跳回登录页，避免拿着失效
    // token 反复请求、页面卡在错误状态。
    // 注意：这些 code 都是以 HTTP 4xx 返回的，走的是本 error 分支，而不是上面的 success 分支。
    if (bizCode === 1001 || bizCode === 1002 || bizCode === 2002) {
      const auth = useAuthStore();
      auth.logout();
      infoDialog({ message: "登录已失效，请重新登录" }).then(() => {
        location.hash = "#/login";
        location.reload();
      });
    } else {
      failToast(message);
    }
    return Promise.reject(error);
  },
);

export function get<T = unknown>(url: string, params?: object) {
  // 拦截器已经解包 ApiEnvelope.data,这里 r 就是 data 本身,不要再 .data
  return instance.get(url, { params }).then((r) => r as unknown as T);
}
export function post<T = unknown>(url: string, data?: object) {
  return instance.post(url, data).then((r) => r as unknown as T);
}
export function put<T = unknown>(url: string, data?: object) {
  return instance.put(url, data).then((r) => r as unknown as T);
}
export function del<T = unknown>(url: string) {
  return instance.delete(url).then((r) => r as unknown as T);
}

export default instance;
/**
 * 拿原始响应（不解 ApiEnvelope），用于 blob / arraybuffer 等非 JSON 场景
 */
export async function getRaw(
  url: string,
  config?: { responseType?: "blob" | "arraybuffer" },
): Promise<Blob> {
  const r = await instance.get(url, {
    responseType: config?.responseType ?? "blob",
  });
  return r as unknown as Blob;
}
