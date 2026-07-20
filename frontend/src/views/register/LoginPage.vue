<template>
  <div class="login">
    <div class="hero">
      <div class="title">Friends</div>
      <div class="sub">牵线交友平台</div>
    </div>

    <van-form @submit="onSubmit" class="form">
      <van-cell-group inset>
        <van-field
          v-model="form.phone"
          name="phone"
          label="手机号"
          placeholder="请输入手机号"
          :rules="[{ required: true, message: '请输入手机号' }]"
          autocomplete="tel"
        />
        <van-field
          v-model="form.password"
          type="password"
          name="password"
          label="密码"
          placeholder="请输入密码"
          :rules="[{ required: true, message: '请输入密码' }]"
        />
      </van-cell-group>

      <div class="submit">
        <van-button block type="primary" native-type="submit" :loading="loading">登录</van-button>
      </div>

      <div class="link">
        <router-link to="/register">还没有账号？立即注册</router-link>
      </div>
    </van-form>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { post } from '@/api/request';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const auth = useAuthStore();

const loading = ref(false);
const form = reactive({ phone: '', password: '' });

const onSubmit = async () => {
  loading.value = true;
  try {
    const res = await post<{ accessToken: string; user: any }>('/api/v1/auth/login', form);
    auth.setAuth(res.accessToken, res.user);
    showToast('登录成功');
    router.push('/profile');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login {
  min-height: 100vh;
  background: var(--color-bg-page);
  padding: 24px;
}
.hero {
  text-align: center;
  padding: 60px 0 40px;
}
.title {
  font-size: 32px;
  font-weight: 600;
  color: var(--color-primary);
  letter-spacing: 2px;
}
.sub {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-secondary);
}
.form { margin-top: 24px; }
.submit { padding: 16px; }
.link {
  text-align: center;
  padding: 8px 0 24px;
  font-size: 14px;
}
</style>