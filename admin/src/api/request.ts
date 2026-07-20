import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useAuthStore } from '@/store/auth';
import router from '@/router';

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
      // 业务错误
      if (body.code === 1001 || body.code === 1002) {
        const auth = useAuthStore();
        auth.logout();
        ElMessageBox.alert('登录已过期，请重新登录', '提示', {
          confirmButtonText: '去登录',
          callback: () => router.push('/login'),
        }).catch(() => router.push('/login'));
      } else if (body.code === 1003) {
        ElMessage.error('权限不足');
      } else if (body.code === 1004) {
        ElMessage.warning('操作频繁，请稍后再试');
      } else {
        ElMessage.error(body.message || '请求失败');
      }
      return Promise.reject(body);
    }
    return response.data as any;
  },
  (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore();
      auth.logout();
      router.push('/login');
    } else if (error.response?.status === 403) {
      ElMessage.error('权限不足');
    } else if (error.response?.status === 429) {
      ElMessage.warning('操作频繁，请稍后再试');
    } else {
      ElMessage.error(error.response?.data?.message || '网络异常');
    }
    return Promise.reject(error);
  },
);

export function get<T = unknown>(url: string, params?: object, config?: AxiosRequestConfig): Promise<T> {
  return instance.get(url, { params, ...config });
}

export function post<T = unknown>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
  return instance.post(url, data, config);
}

export function put<T = unknown>(url: string, data?: object): Promise<T> {
  return instance.put(url, data);
}

export function del<T = unknown>(url: string): Promise<T> {
  return instance.delete(url);
}

export default instance;