<template>
  <div class="register">
    <van-nav-bar title="注册" left-arrow @click-left="$router.back()" />

    <div class="content">
      <div class="hint">
        <p>注册需填写介绍人提供的 6 位邀请码</p>
      </div>

      <van-form @submit="onSubmit">
        <van-cell-group inset>
          <van-field
            v-model="form.inviteCode"
            name="inviteCode"
            label="邀请码"
            placeholder="6 位数字"
            maxlength="6"
            :rules="[
              { required: true, message: '请输入邀请码' },
              { pattern: /^\d{6}$/, message: '邀请码必须为 6 位数字' },
            ]"
          />
          <van-field
            v-model="form.phone"
            name="phone"
            label="手机号"
            placeholder="请输入手机号"
            autocomplete="tel"
            :rules="[{ required: true, message: '请输入手机号' }]"
          />
          <van-field
            v-model="form.password"
            type="password"
            name="password"
            label="密码"
            placeholder="≥ 8 位，含字母 + 数字"
            :rules="[
              { required: true, message: '请输入密码' },
              { pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/, message: '密码需 ≥ 8 位且含字母数字' },
            ]"
          />
          <van-field
            v-model="form.nickname"
            name="nickname"
            label="昵称"
            placeholder="选填"
          />
        </van-cell-group>

        <div class="submit">
          <van-button block type="primary" native-type="submit" :loading="loading">
            注册并登录
          </van-button>
        </div>

        <div class="link">
          <router-link to="/login">已有账号？去登录</router-link>
        </div>
      </van-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { showToast } from 'vant';
import { post } from '@/api/request';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const loading = ref(false);
const form = reactive({
  inviteCode: (route.query.code as string) || '',
  phone: '',
  password: '',
  nickname: '',
});

const onSubmit = async () => {
  loading.value = true;
  try {
    await post('/api/v1/auth/register', form);
    // 自动登录
    const res = await post<{ accessToken: string; user: any }>('/api/v1/auth/login', {
      phone: form.phone,
      password: form.password,
    });
    auth.setAuth(res.accessToken, res.user);
    showToast('注册成功');
    router.push('/profile');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register {
  min-height: 100vh;
  background: var(--color-bg-page);
}
.content { padding-top: 46px; }
.hint {
  padding: 16px 24px;
  color: var(--color-text-secondary);
  font-size: 13px;
}
.submit { padding: 16px; }
.link { text-align: center; padding: 8px 0 24px; }
</style>