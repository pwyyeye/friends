<template>
  <main class="parent-page registration-page step-page">
    <RegistrationHeader title="相亲资料" :disabled="busy" @back="goBack" />
    <section
      v-if="step === 0"
      class="registration-banner"
      aria-label="登记相亲资料"
    >
      <p class="registration-banner-title">仅需<em>30秒</em>登记资料</p>
      <p class="registration-banner-subtitle">为孩子寻找好姻缘</p>
    </section>
    <div v-if="loading" class="card">正在准备登记表…</div>
    <form
      v-else-if="options"
      class="card question-card"
      :class="{ 'gender-question': step === 0 }"
      @submit.prevent="continueRegistration"
    >
      <div v-if="step > 0" class="question-progress">
        <span>{{ step < 4 ? '孩子基本情况' : '建立父母账号' }}</span
        ><span>第 {{ step + 1 }} / 7 步</span>
      </div>
      <progress
        v-if="step > 0"
        :value="step + 1"
        max="7"
        aria-label="注册进度"
      />
      <h2 ref="heading" tabindex="-1" class="question-title">{{ title }}</h2>
      <p v-if="hint" class="question-hint">{{ hint }}</p>
      <fieldset :disabled="busy" class="question-content">
        <ChildStepFields
          v-if="step < 4"
          :key="step"
          :step-id="profileSteps[step].id"
          :model="fields"
          :options="options"
          :cities="cities"
          @error="error = $event"
          @continue="continueRegistration"
        />
        <template v-else-if="step === 4">
          <label class="form-field"
            >您的称呼 *<input
              v-model="nickname"
              required
              maxlength="50"
              placeholder="例如：林妈妈"
              autocomplete="nickname"
          /></label>
          <label class="form-field"
            >您的手机号 *<input
              v-model="phone"
              type="tel"
              required
              pattern="1[3-9][0-9]{9}"
              maxlength="11"
              inputmode="tel"
              autocomplete="tel"
              placeholder="请输入父母的手机号"
          /></label>
        </template>
        <template v-else-if="step === 5">
          <label class="form-field"
            >设置登录密码 *<input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="6"
              maxlength="32"
              autocomplete="new-password"
              placeholder="至少 6 位，数字或字母均可"
          /></label>
          <label class="consent-row password-visibility"
            ><input v-model="showPassword" type="checkbox" /><span
              >显示密码</span
            ></label
          >
        </template>
        <template v-else>
          <label class="form-field"
            >邀请码 <span class="muted">选填</span
            ><input
              v-model="inviteCode"
              maxlength="6"
              inputmode="numeric"
              placeholder="没有邀请码可以留空"
              @blur="checkInvite"
            /><small v-if="inviteName"
              >来自 {{ inviteName }} 的邀请</small
            ></label
          >
          <label class="consent-row"
            ><input v-model="terms" type="checkbox" required /><span
              >我已阅读并同意
              <router-link to="/legal/terms" target="_blank"
                >用户协议</router-link
              >
              和
              <router-link to="/legal/privacy" target="_blank"
                >隐私说明</router-link
              ></span
            ></label
          >
        </template>
      </fieldset>
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div v-if="step > 0" class="question-actions">
        <button class="primary-button" type="submit" :disabled="busy">
          {{ busy ? '正在提交…' : step === 6 ? '确定' : '下一步' }}
        </button>
        <button
          v-if="step > 0"
          class="secondary-button"
          type="button"
          :disabled="busy"
          @click="goTo(step - 1)"
        >
          上一步
        </button>
      </div>
    </form>
    <div v-else class="card">
      <p>登记表加载失败</p>
      <button class="secondary-button" @click="load">重新加载</button>
    </div>
    <p class="text-center">
      已有父母账号？
      <router-link
        :to="{ path: '/login', query: inviteCode ? { code: inviteCode } : {} }"
        >立即登录</router-link
      >
    </p>
  </main>
</template>
<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { get, post, put } from '@/api/request';
import { useAuthStore } from '@/store/auth';
import ChildStepFields from '@/components/ChildStepFields.vue';
import RegistrationHeader from '@/components/RegistrationHeader.vue';
import {
  ChildFields,
  Options,
  City,
  emptyFields,
  rawFields,
  registrationKey,
} from '@/types/profile';
import { profileSteps, validateStep } from '@/types/registration';
const route = useRoute(),
  router = useRouter(),
  auth = useAuthStore();
const fields = reactive<ChildFields>(emptyFields());
const options = ref<Options>(),
  cities = ref<City[]>([]),
  heading = ref<HTMLElement>();
const step = ref(0),
  phone = ref(''),
  password = ref(''),
  nickname = ref(''),
  inviteCode = ref(''),
  inviteName = ref(''),
  terms = ref(true),
  showPassword = ref(false),
  busy = ref(false),
  loading = ref(true),
  error = ref('');
const title = computed(() =>
  step.value < 4
    ? profileSteps[step.value].title
    : ['请输入您的手机号码', '设置登录密码', '确认登记'][step.value - 4],
);
const hint = computed(() =>
  step.value < 4
    ? profileSteps[step.value].hint
    : ['方便工作人员联系您', '', ''][step.value - 4],
);
try {
  const cached = JSON.parse(sessionStorage.getItem(registrationKey) || '{}');
  Object.assign(fields, rawFields(cached.fields || {}));
  step.value =
    cached.version === 2 &&
    Number.isInteger(cached.step) &&
    cached.step >= 0 &&
    cached.step <= 6
      ? cached.step
      : 0;
  phone.value = cached.phone || '';
  nickname.value = cached.nickname || '';
  inviteCode.value = String(route.query.code || cached.inviteCode || '');
  if (step.value > 5) step.value = 5;
} catch {
  inviteCode.value = String(route.query.code || '');
}
watch(
  [fields, step, inviteCode, phone, nickname],
  () =>
    sessionStorage.setItem(
      registrationKey,
      JSON.stringify({
        version: 2,
        fields: rawFields(fields),
        step: step.value,
        inviteCode: inviteCode.value,
        phone: phone.value,
        nickname: nickname.value,
      }),
    ),
  { deep: true, immediate: true },
);
watch(inviteCode, () => {
  inviteName.value = '';
});
async function goTo(index: number) {
  step.value = index;
  error.value = '';
  await nextTick();
  heading.value?.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
}
async function goBack() {
  if (step.value > 0) await goTo(step.value - 1);
  else
    await router.push({
      path: '/login',
      query: inviteCode.value ? { code: inviteCode.value } : {},
    });
}
async function load() {
  loading.value = true;
  try {
    [options.value, cities.value] = await Promise.all([
      get<Options>('/api/v1/profile/options'),
      get<City[]>('/api/v1/dict/cities'),
    ]);
  } finally {
    loading.value = false;
  }
}
async function validateInvite() {
  if (!inviteCode.value.trim()) {
    inviteName.value = '';
    return;
  }
  const r = await get<{ nickname: string }>(
    '/api/v1/auth/invite/' + inviteCode.value.trim(),
  );
  inviteName.value = r.nickname;
}
async function checkInvite() {
  try {
    await validateInvite();
    error.value = '';
  } catch (e: any) {
    error.value = e.response?.data?.message || '邀请码无法确认，请核对或留空';
  }
}
async function continueRegistration() {
  error.value = '';
  if (step.value < 4) {
    error.value = validateStep(profileSteps[step.value].id, fields);
    if (!error.value) await goTo(step.value + 1);
    return;
  }
  if (!nickname.value.trim() || !/^1[3-9]\d{9}$/.test(phone.value)) {
    await goTo(4);
    error.value = '请填写您的称呼和正确的手机号';
    return;
  }
  if (step.value === 4) {
    await goTo(5);
    return;
  }
  if (password.value.length < 6 || password.value.length > 32) {
    await goTo(5);
    error.value = '密码请输入 6–32 位，数字或字母均可';
    return;
  }
  if (step.value === 5) {
    await goTo(6);
    return;
  }
  for (let i = 0; i < 4; i++) {
    const message = validateStep(profileSteps[i].id, fields);
    if (message) {
      await goTo(i);
      error.value = message;
      return;
    }
  }
  if (!terms.value) {
    error.value = '请阅读并同意用户协议和隐私说明';
    return;
  }
  busy.value = true;
  try {
    if (inviteCode.value.trim()) await validateInvite();
    const r = await post<{ accessToken: string; user: any }>(
      '/api/v1/auth/register',
      {
        phone: phone.value,
        password: password.value,
        nickname: nickname.value.trim(),
        inviteCode: inviteCode.value.trim() || undefined,
        termsAccepted: true,
      },
    );
    auth.setAuth(r.accessToken, r.user);
    await put('/api/v1/profile/draft', {
      payload: rawFields(fields),
      expectedRevision: 0,
      currentStep: 'relationship',
    });
    sessionStorage.removeItem(registrationKey);
    await router.replace('/profile');
  } catch (e: any) {
    error.value =
      e.response?.data?.message || e.message || '暂时无法完成，请重试';
    if (auth.token) await router.replace('/profile');
  } finally {
    busy.value = false;
  }
}
onMounted(() => {
  if (auth.token) router.replace('/profile');
  else load().catch(() => {});
});
</script>
