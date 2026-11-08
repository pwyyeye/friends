<template>
  <main class="parent-page step-page">
    <header class="registration-intro">
      <h1>完善相亲资料</h1>
    </header>
    <div v-if="loading" class="card">正在读取草稿…</div>
    <template v-else-if="options">
      <section
        v-if="record?.latestSubmission"
        class="card status-card"
        aria-live="polite"
      >
        <strong>{{ profileStatuses[record.profileStatus] }}</strong>
        <p v-if="record.profileStatus === 1">
          工作人员将审核您已提交的资料，修改后需再次提交
        </p>
        <p v-if="record.profileStatus === 2">修改后的资料需要重新提交审核</p>
        <p v-if="record.profileStatus === 3" class="form-error">
          修改建议：{{ record.latestSubmission.rejectReason }}
        </p>
        <button class="text-button" @click="snapshotOpen = !snapshotOpen">
          {{ snapshotOpen ? '收起' : '查看最近提交的资料' }}
        </button>
        <ChildProfileSummary
          v-if="snapshotOpen"
          :profile="record.latestSubmission.payload"
        />
      </section>
      <div v-if="recovery" class="card">
        <p>发现尚未同步的本机草稿，请核对后恢复</p>
        <button class="secondary-button" @click="recover">恢复本机草稿</button>
        <button class="text-button" @click="discardRecovery">
          使用服务器版本
        </button>
      </div>
      <template v-else>
        <div class="step-directory">
          <button
            class="text-button"
            :aria-expanded="directoryOpen"
            :disabled="saving || moving || submitting || uploading"
            @click="directoryOpen = !directoryOpen"
          >
            {{ directoryOpen ? '收起填写目录' : '查看目录 / 修改已填项目' }}
          </button>
          <nav
            v-if="directoryOpen"
            aria-label="填写项目目录"
            class="directory-links"
          >
            <button
              v-for="(item, i) in profileSteps"
              :key="item.id"
              type="button"
              :aria-current="i === step ? 'step' : undefined"
              :class="{ selected: i === step }"
              :disabled="saving || moving || submitting || uploading"
              @click="goTo(i)"
            >
              {{ i + 1 }} · {{ item.label
              }}<span v-if="!item.required && item.id !== 'review'">选填</span>
            </button>
          </nav>
        </div>
        <form
          class="card question-card"
          :class="{ 'gender-question': current.id === 'gender' }"
          @submit.prevent="next"
        >
          <div class="question-progress">
            <span>{{ current.group }}</span
            ><span>第 {{ step + 1 }} / {{ profileSteps.length }} 项</span>
          </div>
          <progress
            :value="step + 1"
            :max="profileSteps.length"
            aria-label="资料登记进度"
          />
          <h2 ref="heading" class="question-title" tabindex="-1">
            {{ current.title }}
          </h2>
          <p v-if="current.hint" class="question-hint">{{ current.hint }}</p>
          <p v-if="!current.required && !isReview" class="optional-note">
            选填
          </p>
          <fieldset
            class="question-content"
            :disabled="moving || submitting || uploading"
          >
            <ChildStepFields
              v-if="!isReview"
              :key="current.id"
              :step-id="current.id"
              :model="fields"
              :options="options"
              :cities="cities"
              :occupations="occupations"
              @error="error = $event"
              @continue="next"
            >
              <template v-if="current.id === 'photos'">
                <div class="photo-grid">
                  <div v-for="key in fields.photoOssKeys" :key="key">
                    <img :src="photoUrl(key)" alt="孩子照片" /><button
                      class="text-button"
                      type="button"
                      @click="removePhoto(key)"
                    >
                      移除照片
                    </button>
                  </div>
                </div>
                <label
                  v-if="fields.photoOssKeys.length < 9"
                  class="upload-button"
                  >{{ uploading ? '正在上传…' : '选择孩子照片'
                  }}<input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    :disabled="uploading"
                    @change="upload"
                /></label>
                <p class="muted">
                  支持 JPG / PNG / WebP<br />每张不超过 5
                  MB，仅用于审核和人工牵线
                </p>
              </template>
            </ChildStepFields>
            <template v-else>
              <ChildProfileSummary :profile="preview" />
              <button
                type="button"
                class="secondary-button"
                @click="openDirectory"
              >
                需要修改？打开填写目录
              </button>
              <label class="consent-row"
                ><input v-model="consent" type="checkbox" /><span
                  >孩子知情并同意我代为登记以上资料，用于平台审核和人工牵线</span
                ></label
              >
              <p class="muted">
                平台会保护父母的手机号，提交资料不代表保证匹配成功
              </p>
            </template>
          </fieldset>
          <p v-if="statusLine" class="save-status" role="status">
            {{ statusLine }}
          </p>
          <p v-if="error" class="form-error" role="alert">{{ error }}</p>
          <div v-if="!isPendingReview" class="question-actions">
            <button
              class="primary-button"
              :disabled="
                saving || moving || submitting || uploading || !canContinue
              "
            >
              {{
                submitting
                  ? '正在提交…'
                  : moving
                    ? '正在保存…'
                    : isReview
                      ? '确认并提交审核'
                      : '下一步'
              }}
            </button>
            <div class="question-secondary-actions">
              <button
                v-if="step > 0"
                class="secondary-button"
                type="button"
                :disabled="saving || moving || submitting || uploading"
                @click="goTo(step - 1)"
              >
                上一步
              </button>
            </div>
            <button
              v-if="!current.required && !isReview"
              class="text-button skip-button"
              type="button"
              :disabled="saving || moving || submitting || uploading"
              @click="next"
            >
              稍后填写，继续下一项
            </button>
          </div>
        </form>
      </template>
    </template>
    <section v-else class="card">
      <p>资料加载失败</p>
      <button class="secondary-button" @click="load">重新加载</button>
    </section>
  </main>
</template>
<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  nextTick,
} from 'vue';
import { get, put, post } from '@/api/request';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { uploadImage } from '@/utils/upload';
import ChildStepFields from '@/components/ChildStepFields.vue';
import {
  profileSteps,
  validateStep,
  stepIndex,
  firstMissingStep,
} from '@/types/registration';
import ChildProfileSummary from '@/components/ChildProfileSummary.vue';
import {
  ChildFields,
  ChildRecord,
  City,
  Options,
  emptyFields,
  rawFields,
  validateBasic,
  profileStatuses,
  registrationKey,
} from '@/types/profile';
const router = useRouter(),
  auth = useAuthStore(),
  fields = reactive<ChildFields>(emptyFields());
const options = ref<Options>(),
  cities = ref<City[]>([]),
  occupations = ref<{ id: string; name: string }[]>([]),
  record = ref<ChildRecord | null>(null);
const loading = ref(true),
  saving = ref(false),
  moving = ref(false),
  directoryOpen = ref(false),
  heading = ref<HTMLElement>(),
  submitting = ref(false),
  uploading = ref(false),
  step = ref(0),
  consent = ref(false),
  snapshotOpen = ref(false),
  error = ref(''),
  saveMessage = ref('尚未修改'),
  recovery = ref<{ fields: ChildFields; step: number } | null>(null);
const current = computed(() => profileSteps[step.value]);
const isReview = computed(() => current.value.id === 'review');
const isPendingReview = computed(() => record.value?.profileStatus === 1);
// 必填项没填时不给点“下一步”，并把原因写出来，避免按钮点了没反应
const stepError = computed(() => validateStep(current.value.id, clean()));
const canContinue = computed(() => isReview.value || !stepError.value);
// 保存成功和初始状态不再占用页面，只在等待保存、失败、已提交或有阻塞原因时提示
const quietSaveMessages = new Set([
  '草稿已保存',
  '尚未修改',
  '填写后自动保存',
  '有修改，正在等待保存',
]);
const statusLine = computed(() => {
  if (!quietSaveMessages.has(saveMessage.value)) return saveMessage.value;
  if (!isReview.value && stepError.value) return stepError.value;
  return '';
});
const cacheKey = `friends_child_draft_${auth.user?.id}`;
let ready = false,
  timer: ReturnType<typeof setTimeout> | undefined,
  queue: Promise<unknown> = Promise.resolve(),
  blocked = false,
  lastSaved = '';
function signature(payload: ChildFields, index = step.value) {
  return JSON.stringify({ payload, currentStep: profileSteps[index].id });
}
function clean(): ChildFields {
  const p = rawFields(fields);
  if (p.birthDate === '') p.birthDate = null;
  for (const key of [
    'height',
    'cityId',
    'hometownCityId',
    'workCityId',
  ] as const)
    if ((p as any)[key] === '') p[key] = null;
  for (const key of [
    'birthYearMin',
    'birthYearMax',
    'heightMin',
    'heightMax',
    'cityId',
  ] as const)
    if ((p.preference as any)[key] === '') p.preference[key] = null;
  return p;
}
function remember() {
  sessionStorage.setItem(
    cacheKey,
    JSON.stringify({
      fields: clean(),
      revision: record.value?.draftRevision ?? 0,
      step: profileSteps[step.value].id,
    }),
  );
}
watch(
  fields,
  () => {
    if (!ready) return;
    remember();
    saveMessage.value = '有修改，正在等待保存';
    clearTimeout(timer);
    if (!blocked) timer = setTimeout(() => save().catch(() => {}), 900);
  },
  { deep: true, flush: 'sync' },
);
function save(targetStep = step.value): Promise<ChildRecord | null> {
  clearTimeout(timer);
  const payload = clean();
  const capturedSignature = signature(payload, targetStep);
  queue = queue
    .catch(() => {})
    .then(async () => {
      if (blocked) throw new Error('请先刷新并核对草稿');
      if (capturedSignature === lastSaved && record.value) {
        saveMessage.value = '草稿已保存';
        return record.value;
      }
      saving.value = true;
      try {
        record.value = await put<ChildRecord>('/api/v1/profile/draft', {
          payload,
          currentStep: profileSteps[targetStep].id,
          expectedRevision: record.value?.draftRevision ?? 0,
        });
        lastSaved = capturedSignature;
        saveMessage.value = '草稿已保存';
        error.value = '';
        if (JSON.stringify(clean()) === JSON.stringify(payload))
          sessionStorage.removeItem(cacheKey);
        else remember();
        return record.value;
      } catch (e: any) {
        saveMessage.value = '保存失败，修改已保留在本机';
        error.value =
          e.response?.data?.message || e.message || '请检查网络后重试';
        if (e.response?.status === 409) {
          blocked = true;
          error.value += '，刷新页面后可核对并恢复本机草稿';
        }
        throw e;
      } finally {
        saving.value = false;
      }
    });
  return queue as Promise<ChildRecord | null>;
}
async function openDirectory() {
  directoryOpen.value = true;
  await nextTick();
  window.scrollTo({ top: 0 });
}
async function goTo(index: number) {
  if (
    index < 0 ||
    index >= profileSteps.length ||
    moving.value ||
    submitting.value
  )
    return;
  moving.value = true;
  try {
    await save(index);
    step.value = index;
    directoryOpen.value = false;
    error.value = '';
    await nextTick();
    heading.value?.focus({ preventScroll: true });
    window.scrollTo({ top: 0 });
  } catch {
  } finally {
    moving.value = false;
  }
}
const preview = computed(() => {
  const p = clean(),
    o = options.value;
  const city = (id?: number | null) =>
    cities.value.find((c) => Number(c.id) === id)?.name;
  const label = (
    list: { value: string; label: string }[] | undefined,
    value?: string | null,
  ) => list?.find((x) => x.value === value)?.label;
  const today = new Date().toLocaleDateString('sv-SE', {
    timeZone: 'Asia/Shanghai',
  });
  return {
    ...p,
    age: p.birthDate
      ? Number(today.slice(0, 4)) -
        Number(p.birthDate.slice(0, 4)) -
        (today.slice(5) < p.birthDate.slice(5) ? 1 : 0)
      : undefined,
    cityName: city(p.cityId),
    hometownCityName: city(p.hometownCityId),
    workCityName: city(p.workCityId),
    educationLabel: label(o?.education, p.education),
    incomeLabel: label(o?.income, p.income),
    maritalStatusLabel: label(o?.maritalStatus, p.maritalStatus),
    carStatusLabel: label(o?.carStatus, p.carStatus),
    preference: {
      ...p.preference,
      cityName: city(p.preference.cityId),
      educationLabel: label(o?.education, p.preference.educationMin),
    },
    photos: p.photoOssKeys.map((ossKey) => ({ ossKey, url: photoUrl(ossKey) })),
  };
});
const uploadedUrls = reactive<Record<string, string>>({});
function photoUrl(key: string) {
  return (
    uploadedUrls[key] ||
    record.value?.draft.photos?.find((p) => p.ossKey === key)?.url ||
    ''
  );
}
function removePhoto(key: string) {
  fields.photoOssKeys = fields.photoOssKeys.filter((k) => k !== key);
}
async function upload(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (
    file.size > 5 * 1024 * 1024 ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
  ) {
    error.value = '请选择不超过 5 MB 的 JPG / PNG / WebP 照片';
    input.value = '';
    return;
  }
  uploading.value = true;
  try {
    await save();
    const result = await uploadImage(file, 'lifestyle', record.value!.id);
    uploadedUrls[result.ossKey] = result.url;
    fields.photoOssKeys.push(result.ossKey);
    await save();
  } catch {
    error.value = '照片上传未完成，请重试';
  } finally {
    uploading.value = false;
    input.value = '';
  }
}
async function next() {
  error.value = validateStep(current.value.id, clean());
  if (error.value) return;
  if (!isReview.value) {
    await goTo(step.value + 1);
    return;
  }
  error.value = validateBasic(clean());
  if (error.value) {
    const message = error.value;
    await goTo(firstMissingStep(clean()));
    error.value = message;
    return;
  }
  if (!consent.value) {
    error.value = '请确认孩子知情同意后再提交';
    return;
  }
  submitting.value = true;
  try {
    await save();
    record.value = await post<ChildRecord>('/api/v1/profile/submit', {
      expectedRevision: record.value!.draftRevision,
      childConsent: true,
      consentVersion: options.value!.consentVersion,
    });
    ready = false;
    Object.assign(fields, rawFields(record.value.draft));
    lastSaved = signature(clean());
    ready = true;
    saveMessage.value = '已提交审核';
    consent.value = false;
    // 一份资料填写并提交完成，回到首页
    await router.push('/home');
  } catch (e: any) {
    error.value = e.response?.data?.message || e.message || '提交失败，请重试';
  } finally {
    submitting.value = false;
  }
}
async function load() {
  ready = false;
  loading.value = true;
  try {
    [record.value, options.value, cities.value, occupations.value] =
      await Promise.all([
        get<ChildRecord | null>('/api/v1/profile/draft'),
        get<Options>('/api/v1/profile/options'),
        get<City[]>('/api/v1/dict/cities'),
        get<{ id: string; name: string }[]>('/api/v1/dict/occupations'),
      ]);
    Object.assign(fields, rawFields(record.value?.draft || {}));
    const savedStep = stepIndex(record.value?.currentStep);
    step.value = savedStep >= 0 ? savedStep : firstMissingStep(clean());
    lastSaved = signature(clean());
    const cache = JSON.parse(sessionStorage.getItem(cacheKey) || 'null');
    const cachedStep = stepIndex(cache?.step);
    if (
      cache &&
      signature(
        rawFields(cache.fields),
        cachedStep >= 0 ? cachedStep : step.value,
      ) !== lastSaved
    ) {
      const position = cachedStep >= 0 ? cachedStep : step.value;
      if (cache.revision === (record.value?.draftRevision ?? 0)) {
        Object.assign(fields, rawFields(cache.fields));
        step.value = position;
      } else
        recovery.value = { fields: rawFields(cache.fields), step: position };
    }
    if (!record.value) {
      const staging = JSON.parse(
        sessionStorage.getItem(registrationKey) || 'null',
      );
      if (staging?.fields) {
        Object.assign(fields, rawFields(staging.fields));
        step.value = firstMissingStep(clean());
      }
    }
    blocked = false;
    ready = true;
    if (signature(clean()) !== lastSaved) {
      await save();
      sessionStorage.removeItem(registrationKey);
    }
    saveMessage.value = record.value ? '草稿已保存' : '填写后自动保存';
  } catch (e: any) {
    error.value = e.response?.data?.message || '无法读取草稿';
  } finally {
    loading.value = false;
  }
}
function recover() {
  const cached = recovery.value!;
  step.value = cached.step;
  Object.assign(fields, rawFields(cached.fields));
  remember();
  save().catch(() => {});
  recovery.value = null;
}
function discardRecovery() {
  recovery.value = null;
  sessionStorage.removeItem(cacheKey);
}
onMounted(load);
onBeforeUnmount(() => {
  clearTimeout(timer);
  if (ready && signature(clean()) !== lastSaved) remember();
});
</script>
