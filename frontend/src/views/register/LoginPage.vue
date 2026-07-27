<template>
  <div class="login">
    <!-- Hero 区：品牌 + slogan -->
    <header class="login__hero">
      <div class="login__logo">
        <span class="brand-mark">F.</span>
      </div>
      <h1 class="login__title serif">Friends</h1>
      <p class="brand-sub">牵 线 交 友 · 一 段 对 的 关 系</p>
      <p class="login__slogan serif">用一段对的人，开启一段对的关系。</p>
    </header>

    <!-- 表单卡片 -->
    <section class="login__form card card--elev">
      <h2 class="section-title section-title--sm">欢迎回来</h2>

      <InputField
        v-model="form.phone"
        type="tel"
        inputmode="numeric"
        autocomplete="tel"
        placeholder="请输入手机号"
        :icon="iconPhone"
      />
      <InputField
        v-model="form.password"
        type="password"
        placeholder="请输入密码"
        :icon="iconLock"
        style="margin-top: 10px"
      />

      <van-button
        block
        type="primary"
        size="large"
        native-type="submit"
        :loading="loading"
        class="login__submit"
        @click="onSubmit"
      >
        登 录
      </van-button>

      <div class="login__link">
        <router-link to="/register">还没有账号？立即注册</router-link>
      </div>
    </section>

    <!-- 底部法务 -->
    <p class="login__legal">
      登录即表示你已阅读并同意
      <a>《用户协议》</a> 与 <a>《隐私政策》</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { toast, successToast } from '@/utils/toast';
import { post } from '@/api/request';
import { useAuthStore } from '@/store/auth';
import InputField from '@/components/InputField.vue';

const router = useRouter();
const auth = useAuthStore();

const loading = ref(false);
const form = reactive({ phone: '', password: '' });

const iconPhone =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>';
const iconLock =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>';

const onSubmit = async () => {
  if (!form.phone.trim()) {
    toast('请输入手机号');
    return;
  }
  if (!form.password) {
    toast('请输入密码');
    return;
  }
  loading.value = true;
  try {
    const res = await post<{ accessToken: string; user: any }>('/api/v1/auth/login', form);
    auth.setAuth(res.accessToken, res.user);
    successToast('登录成功');
    router.push('/profile');
  } catch (err) {
    // 错误提示已由响应拦截器统一通过 showFailToast 展示
    // eslint-disable-next-line no-console
    console.warn('[login] failed', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login {
  min-height: 100vh;
  background: var(--color-bg-page);
  padding: calc(var(--safe-area-top) + 32px) 24px 32px;
  display: flex;
  flex-direction: column;
}

.login__hero {
  text-align: center;
  padding: 24px 0 32px;
}
.login__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: linear-gradient(140deg, var(--color-primary) 0%, var(--color-primary-soft) 100%);
  color: #fff;
  font-family: var(--font-serif-en);
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0;
  margin-bottom: 20px;
  box-shadow: 0 12px 28px rgba(58, 16, 40, 0.25);
}
.login__title {
  margin: 0;
  font-size: 48px;
  font-weight: 700;
  letter-spacing: 8px;
  color: var(--color-primary);
}
.login__slogan {
  margin-top: 12px;
  font-size: 15px;
  color: var(--color-text-secondary);
  letter-spacing: 1px;
}

.login__form {
  padding: 24px 20px 20px;
  background: #fff;
}
.login__submit {
  margin-top: 22px;
  height: 52px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-soft) 100%);
  border: none;
  letter-spacing: 6px;
}
.login__submit :deep(.van-button__text) {
  font-family: var(--font-serif-cn);
  font-weight: 600;
}
.login__link {
  text-align: center;
  margin-top: 18px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.login__link a {
  color: var(--color-primary);
  margin-left: 4px;
}

.login__legal {
  margin-top: 28px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.7;
}
.login__legal a {
  color: var(--color-text-secondary);
  margin: 0 2px;
}
</style>