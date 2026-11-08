<template>
  <main class="parent-page registration-page">
    <RegistrationHeader
      title="账号登录"
      :disabled="busy"
      @back="router.push({ path: '/register', query: code ? { code } : {} })"
    />
    <form class="card" @submit.prevent="login">
      <label class="form-field"
        >手机号<input
          v-model="phone"
          required
          pattern="1[3-9][0-9]{9}"
          maxlength="11"
          inputmode="tel"
          autocomplete="username"
          placeholder="父母的手机号" /></label
      ><label class="form-field"
        >密码<input
          v-model="password"
          required
          type="password"
          autocomplete="current-password"
          placeholder="请输入登录密码" /></label
      ><button class="primary-button" :disabled="busy">
        {{ busy ? '正在登录…' : '登录，查看孩子资料' }}
      </button>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    </form>
    <p class="text-center">
      还没有账号？
      <router-link :to="{ path: '/register', query: code ? { code } : {} }"
        >帮孩子登记</router-link
      >
    </p>
  </main>
</template>
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { post } from '@/api/request';
import { useAuthStore } from '@/store/auth';
import { registrationKey } from '@/types/profile';
import RegistrationHeader from '@/components/RegistrationHeader.vue';
const router = useRouter(),
  route = useRoute(),
  auth = useAuthStore();
const phone = ref(''),
  password = ref(''),
  busy = ref(false),
  error = ref('');
let code = String(route.query.code || '');
try {
  const draft = JSON.parse(sessionStorage.getItem(registrationKey) || '{}');
  if (code) {
    draft.inviteCode = code;
    sessionStorage.setItem(registrationKey, JSON.stringify(draft));
  } else code = draft.inviteCode || '';
} catch {}
async function login() {
  busy.value = true;
  error.value = '';
  try {
    const r = await post<{ accessToken: string; user: any }>(
      '/api/v1/auth/login',
      { phone: phone.value, password: password.value },
    );
    auth.setAuth(r.accessToken, r.user);
    await router.replace('/home');
  } catch (e: any) {
    error.value = e.response?.data?.message || e.message || '登录失败';
  } finally {
    busy.value = false;
  }
}
</script>
