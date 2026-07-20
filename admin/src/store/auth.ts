import { defineStore } from 'pinia';

interface AdminInfo {
  id: string;
  username: string;
  role: 'super_admin' | 'operator';
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('admin_token') || '',
    admin: (() => {
      try {
        const raw = localStorage.getItem('admin_info');
        return raw ? JSON.parse(raw) as AdminInfo : null;
      } catch {
        return null;
      }
    })(),
  }),
  actions: {
    setAuth(token: string, admin: AdminInfo) {
      this.token = token;
      this.admin = admin;
      localStorage.setItem('admin_token', token);
      localStorage.setItem('admin_info', JSON.stringify(admin));
    },
    logout() {
      this.token = '';
      this.admin = null;
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
    },
  },
  getters: {
    isSuperAdmin: (s) => s.admin?.role === 'super_admin',
  },
});