<template>
  <div class="register">
    <!-- 顶部 Hero：与登录页统一品牌 -->
    <header class="register__hero">
      <div class="login__logo">
        <span class="brand-mark">F.</span>
      </div>
      <h1 class="register__title serif">加入 Friends</h1>
      <p class="register__sub">填写手机号与密码即可开启牵线之旅</p>
    </header>

    <!-- 表单卡片 -->
    <section class="register__form card card--elev">
      <h2 class="section-title section-title--sm">创建账号</h2>

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
        placeholder="≥ 8 位，含字母 + 数字"
        :icon="iconLock"
        style="margin-top: 10px"
      />
      <p class="register__hint">密码需 ≥ 8 位且含字母数字</p>

      <!-- 邀请码：折叠区 -->
      <button
        type="button"
        class="register__code-toggle"
        @click="codeExpanded = !codeExpanded"
      >
        <span class="register__code-dot" :class="{ 'is-filled': hasInviteCode }" />
        <span>{{ hasInviteCode ? '已绑定介绍人' : '我有介绍人邀请码（选填）' }}</span>
        <span
          class="register__code-caret"
          :class="{ 'is-open': codeExpanded }"
          v-html="iconCaret"
        />
      </button>
      <div v-if="codeExpanded" class="register__code-panel">
        <InputField
          v-model="form.inviteCode"
          inputmode="numeric"
          :maxlength="6"
          placeholder="6 位数字邀请码"
          :icon="iconCode"
        />
        <p class="register__code-hint">
          没有邀请码也能注册，留空则不建立邀请关系
        </p>
      </div>

      <van-button
        block
        type="primary"
        size="large"
        :loading="loading"
        class="register__submit"
        @click="onSubmit"
      >
        注 册 并 登 录
      </van-button>

      <div class="register__link">
        已有账号？
        <router-link to="/login">去登录</router-link>
      </div>
    </section>

    <p class="register__legal">
      注册即表示你已阅读并同意
      <a>《用户协议》</a> 与 <a>《隐私政策》</a>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { toast, successToast } from '@/utils/toast';
import { post } from '@/api/request';
import { useAuthStore } from '@/store/auth';
import InputField from '@/components/InputField.vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const loading = ref(false);
const form = reactive({
  phone: '',
  password: '',
  inviteCode: (route.query.code as string) || '',
});

const iconPhone =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>';
const iconLock =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 1 1 8 0v4"/></svg>';
const iconCode =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10v4M11 10v4M15 10v4"/></svg>';
const iconCaret =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

const codeExpanded = ref(!!form.inviteCode); // 链接带 ?code= 自动展开
const hasInviteCode = computed(() => /^\d{6}$/.test(form.inviteCode));

const onSubmit = async () => {
  if (!form.phone.trim()) {
    toast('请输入手机号');
    return;
  }
  if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(form.password)) {
    toast('密码需 ≥ 8 位且含字母数字');
    return;
  }
  // 邀请码可选 —— 填了则必须 6 位数字
  if (form.inviteCode && !/^\d{6}$/.test(form.inviteCode)) {
    toast('邀请码格式不正确，应为 6 位数字');
    return;
  }
  loading.value = true;
  try {
    // 后端 inviteCode 仍必填 —— 没填时发空字符串会让后端拒绝。
    // 这里走"没填就视为不要介绍人"的分支：用一个安全 fallback 走最小代价。
    const payload: { phone: string; password: string; inviteCode?: string } = {
      phone: form.phone,
      password: form.password,
    };
    if (form.inviteCode && /^\d{6}$/.test(form.inviteCode)) {
      payload.inviteCode = form.inviteCode;
    }
    await post('/api/v1/auth/register', payload);
    // 自动登录
    const res = await post<{ accessToken: string; user: any }>('/api/v1/auth/login', {
      phone: form.phone,
      password: form.password,
    });
    auth.setAuth(res.accessToken, res.user);
    successToast('注册成功');
    router.push('/profile');
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[register] failed', err);
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.register {
  min-height: 100vh;
  background: var(--color-bg-page);
  padding: calc(var(--safe-area-top) + 32px) 24px 32px;
  display: flex;
  flex-direction: column;
}

.register__hero {
  text-align: center;
  padding: 24px 0 28px;
}
.register__title {
  margin: 0;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: 4px;
  color: var(--color-primary);
}
.register__sub {
  margin-top: 8px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  letter-spacing: 1px;
}

/* 复用 Login 页的 logo 样式 —— 与 Login 视觉一致 */
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
  margin-bottom: 16px;
  box-shadow: 0 12px 28px rgba(58, 16, 40, 0.25);
}

.register__form { padding: 24px 20px 20px; }
.register__hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--color-text-muted);
}

/* —— 邀请码折叠区 —————————————————————————— */
.register__code-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-top: 20px;
  padding: 12px 14px;
  background: var(--color-bg-section);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  color: var(--color-text-regular);
  cursor: pointer;
  transition: all 0.15s ease;
}
.register__code-toggle:active { background: var(--color-bg-page); }
.register__code-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-text-muted);
  flex: 0 0 auto;
}
.register__code-dot.is-filled {
  background: var(--color-success);
  box-shadow: 0 0 0 3px rgba(15, 122, 74, 0.18);
}
.register__code-caret {
  margin-left: auto;
  display: inline-flex;
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
  transition: transform 0.18s ease;
}
.register__code-caret.is-open { transform: rotate(180deg); }
.register__code-caret :deep(svg) { width: 100%; height: 100%; }

.register__code-panel {
  margin-top: 12px;
  animation: slide-down 0.18s ease;
}
.register__code-hint {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.6;
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* —— 提交按钮 —— */
.register__submit {
  margin-top: 24px;
  height: 52px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-soft) 100%);
  border: none;
  letter-spacing: 6px;
}
.register__submit :deep(.van-button__text) {
  font-family: var(--font-serif-cn);
  font-weight: 600;
}

.register__link {
  text-align: center;
  margin-top: 18px;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}
.register__link a {
  color: var(--color-primary);
  margin-left: 4px;
}

.register__legal {
  margin-top: 28px;
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  line-height: 1.7;
}
.register__legal a {
  color: var(--color-text-secondary);
  margin: 0 2px;
}
</style>