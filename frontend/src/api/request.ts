import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { showToast, showFailToast, showDialog } from 'vant';
import { useAuthStore } from '@/store/auth';

export interface ApiEnvelope<T = unknown> {
  code: number;
  message: string;
  data: T;
  requestId: string;
}

const instance: AxiosInstance = axios.create({
  baseURL: '/',
  timeout: 15000,
});

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
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 0) return body.data as any;
      if (body.code === 1001 || body.code === 1002) {
        const auth = useAuthStore();
        auth.logout();
        showDialog({
          title: '提示',
          message: '登录已过期，请重新登录',
          showCancelButton: false,
        }).then(() => {
          location.hash = '#/login';
          location.reload();
        });
      } else if (body.code === 1003) {
        showFailToast('权限不足');
      } else if (body.code === 1004) {
        showToast({ type: 'fail', message: '操作频繁，请稍后再试' });
      } else if (body.code === 4003) {
        showFailToast({ message: body.message || '资料已被驳回，请修改后重新提交' });
      } else {
        showFailToast(body.message || '请求失败');
      }
      return Promise.reject(body);
    }
    return response.data as any;
  },
  (error) => {
    showFailToast(error.response?.data?.message || '网络异常');
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

export default instance;