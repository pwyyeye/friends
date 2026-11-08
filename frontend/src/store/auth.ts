import { defineStore } from "pinia";

interface UserInfo {
  id: string;
  phone: string;
  nickname: string | null;
  inviteCode: string | null;
  avatarOssKey: string | null;
  isReferrer?: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("user_token") || "",
    user: (() => {
      try {
        const raw = localStorage.getItem("user_info");
        return raw ? (JSON.parse(raw) as UserInfo) : null;
      } catch {
        return null;
      }
    })(),
  }),
  actions: {
    setAuth(token: string, user: UserInfo) {
      this.token = token;
      this.user = user;
      localStorage.setItem("user_token", token);
      localStorage.setItem("user_info", JSON.stringify(user));
    },
    logout() {
      this.token = "";
      this.user = null;
      localStorage.removeItem("user_token");
      localStorage.removeItem("user_info");
    },
  },
});
