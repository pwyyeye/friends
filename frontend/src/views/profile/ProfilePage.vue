<template>
  <div class="profile">
    <!-- 状态 banner -->
    <StatusBanner
      v-if="status?.profileStatus === 2"
      variant="approved"
      title="资料已通过审核"
      description="你的资料已通过审核，等待运营撮合"
    />
    <StatusBanner
      v-else-if="status?.profileStatus === 1"
      variant="pending"
      title="资料审核中"
      description="我们正在审核你的资料，请耐心等待（通常 1 个工作日内）"
    />
    <StatusBanner
      v-else-if="status?.profileStatus === 3"
      variant="rejected"
      title="资料被驳回"
      :description="status.latestReject?.reason || '请修改后重新提交'"
    />

    <!-- 头像：独立 section -->
    <section class="card profile__avatar-card">
      <div class="avatar-row">
        <div
          class="avatar"
          :class="{ 'is-empty': !avatarUrl }"
          @click="!readonly && pickAvatar()"
        >
          <img v-if="avatarUrl" :src="avatarUrl" alt="头像" />
          <span v-else class="avatar__placeholder">
            <span class="avatar__plus">+</span>
            <span class="avatar__hint">上传头像</span>
          </span>
          <span v-if="!readonly && avatarUrl" class="avatar__mask">更换</span>
        </div>
        <div class="avatar-meta">
          <div class="avatar-meta__title">头像</div>
          <div class="avatar-meta__desc muted">必填 · jpg / png / webp · ≤ 5MB</div>
        </div>
      </div>
    </section>

    <!-- 生活照：独立 section · Banner 风格横滑 -->
    <section class="profile__photos-card">
      <header class="profile__photos-head">
        <div>
          <div class="profile__photos-title">生活照</div>
          <div class="profile__photos-desc muted">
            <template v-if="photosRequired">必填 · 1-9 张 · 像 banner 一样展示</template>
            <template v-else>{{ photos.length }} / 9</template>
          </div>
        </div>
        <button
          v-if="!readonly && photos.length < 9"
          type="button"
          class="profile__photos-add"
          @click="pickPhotos()"
        >
          + 添加
        </button>
      </header>

      <div v-if="photos.length === 0" class="profile__photos-empty" @click="!readonly && pickPhotos()">
        <span class="profile__photos-empty-plus">+</span>
        <span class="profile__photos-empty-hint">添加第一张生活照</span>
      </div>

      <div v-else class="profile__photos-strip">
        <div
          v-for="(p, i) in photos"
          :key="p.ossKey"
          class="photo-banner"
          @click="!readonly && removePhoto(i)"
        >
          <img :src="p.url" alt="生活照" />
          <div class="photo-banner__overlay">
            <span class="photo-banner__index">{{ i + 1 }} / {{ photos.length }}</span>
            <span v-if="!readonly" class="photo-banner__remove">×</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 基础信息 -->
    <section class="card">
      <h3 class="section-title section-title--sm">基础信息</h3>
      <div class="form-grid">
        <div class="form-grid__row">
          <span class="form-grid__label">昵称</span>
          <InputField v-model="form.nickname" placeholder="请输入" :readonly="readonly" />
        </div>

        <!-- 性别：单选 -->
        <div class="form-grid__row">
          <span class="form-grid__label">性别</span>
          <div class="radio-group">
            <label
              class="radio-chip"
              :class="{ 'is-active': form.gender === 1, 'is-disabled': readonly }"
              @click.prevent="setGender(1)"
            >
              <span class="radio-dot" />
              <span>男</span>
            </label>
            <label
              class="radio-chip"
              :class="{ 'is-active': form.gender === 2, 'is-disabled': readonly }"
              @click.prevent="setGender(2)"
            >
              <span class="radio-dot" />
              <span>女</span>
            </label>
          </div>
        </div>

        <div class="form-grid__row">
          <span class="form-grid__label">年龄</span>
          <InputField
            v-model="form.age"
            type="text"
            inputmode="numeric"
            placeholder="≥ 18"
            :readonly="readonly"
          />
        </div>

        <!-- 下拉项：用 clickable van-cell 风格 -->
        <div
          class="form-grid__row form-grid__row--select"
          :class="{ 'is-disabled': readonly }"
          @click="openPicker('city')"
        >
          <span class="form-grid__label">城市</span>
          <span class="form-grid__value" :class="{ 'is-placeholder': !cityText }">
            {{ cityText || '请选择' }}
          </span>
          <span class="form-grid__chevron" v-html="iconChevron" />
        </div>

        <div class="form-grid__row">
          <span class="form-grid__label">身高 (cm)</span>
          <InputField
            v-model="form.height"
            type="text"
            inputmode="numeric"
            placeholder="选填"
            :readonly="readonly"
          />
        </div>

        <div
          class="form-grid__row form-grid__row--select"
          :class="{ 'is-disabled': readonly }"
          @click="openPicker('occ')"
        >
          <span class="form-grid__label">职业</span>
          <span class="form-grid__value" :class="{ 'is-placeholder': !occText }">
            {{ occText || '请选择（可自填）' }}
          </span>
          <span class="form-grid__chevron" v-html="iconChevron" />
        </div>

        <div class="form-grid__row">
          <span class="form-grid__label">自定义职业</span>
          <InputField
            v-model="form.occupationCustom"
            placeholder="字典无对应时填写"
            :readonly="readonly"
          />
        </div>
      </div>
    </section>

    <!-- 兴趣爱好 -->
    <section class="card">
      <h3 class="section-title section-title--sm">兴趣爱好</h3>
      <p class="muted text-sm">从下方选择标签，也可以自己补充</p>
      <div class="tag-grid">
        <span
          v-for="t in interestTags"
          :key="t.id"
          class="tag-chip"
          :class="{ 'is-active': form.interestTagIds.includes(Number(t.id)) }"
          @click="!readonly && toggleTag(Number(t.id))"
        >
          {{ t.name }}
        </span>
        <span
          v-for="(t, idx) in form.customInterests"
          :key="'c-' + idx"
          class="tag-chip is-custom"
          @click="!readonly && removeCustom(idx)"
        >
          {{ t }} <span class="tag-chip__x">×</span>
        </span>
      </div>
      <div class="tag-input">
        <InputField v-model="customInput" placeholder="添加自定义兴趣" :readonly="readonly" />
        <van-button
          size="small"
          plain
          type="primary"
          :disabled="readonly"
          @click="addCustom"
        >添加</van-button>
      </div>
    </section>

    <!-- 交友需求 -->
    <section class="card">
      <h3 class="section-title section-title--sm">交友需求</h3>
      <div class="form-grid">
        <!-- 期望性别：单选 -->
        <div class="form-grid__row">
          <span class="form-grid__label">期望性别</span>
          <div class="radio-group">
            <label
              class="radio-chip"
              :class="{ 'is-active': form.requirement.targetGender === 1, 'is-disabled': readonly }"
              @click.prevent="setTargetGender(1)"
            >
              <span class="radio-dot" />
              <span>男</span>
            </label>
            <label
              class="radio-chip"
              :class="{ 'is-active': form.requirement.targetGender === 2, 'is-disabled': readonly }"
              @click.prevent="setTargetGender(2)"
            >
              <span class="radio-dot" />
              <span>女</span>
            </label>
          </div>
        </div>

        <div class="form-grid__row">
          <span class="form-grid__label">最小年龄</span>
          <InputField
            v-model="form.requirement.targetAgeMin"
            type="text"
            inputmode="numeric"
            :readonly="readonly"
          />
        </div>
        <div class="form-grid__row">
          <span class="form-grid__label">最大年龄</span>
          <InputField
            v-model="form.requirement.targetAgeMax"
            type="text"
            inputmode="numeric"
            :readonly="readonly"
          />
        </div>

        <div
          class="form-grid__row form-grid__row--select"
          :class="{ 'is-disabled': readonly }"
          @click="openPicker('targetCity')"
        >
          <span class="form-grid__label">期望城市</span>
          <span class="form-grid__value" :class="{ 'is-placeholder': !targetCityText }">
            {{ targetCityText || '请选择' }}
          </span>
          <span class="form-grid__chevron" v-html="iconChevron" />
        </div>

        <div class="form-grid__row form-grid__row--textarea">
          <span class="form-grid__label">自我介绍</span>
          <textarea
            v-model="form.requirement.selfDesc"
            rows="3"
            :readonly="readonly"
            placeholder="说说你自己"
            class="textarea"
          />
        </div>
      </div>
    </section>

    <div v-if="!readonly" class="profile__actions">
      <van-button
        type="primary"
        size="large"
        block
        :loading="submitting"
        class="profile__submit"
        @click="onSubmit"
      >
        提 交 审 核
      </van-button>
    </div>

    <!-- 隐藏的 file input -->
    <input
      ref="avatarInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      hidden
      @change="onAvatarPicked"
    />
    <input
      ref="photoInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      hidden
      @change="onPhotosPicked"
    />

    <!-- 普通下拉选择器 -->
    <van-action-sheet
      v-model:show="pickerShow"
      :title="pickerTitle"
      :actions="pickerActions"
      cancel-text="取消"
      close-on-click-action
    />

    <!-- 城市级联选择器：省 / 市 / 县，最多选择到县级 -->
    <van-popup v-model:show="cityPickerShow" position="bottom" round>
      <van-cascader
        v-model="cityCascaderValue"
        :title="cityPickerTitle"
        :options="cityOptions"
        :field-names="{ text: 'text', value: 'value', children: 'children' }"
        active-color="var(--color-primary, #c84a3b)"
        @close="cityPickerShow = false"
        @change="onCityChange"
        @finish="onCityFinish"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { showToast, showSuccessToast } from 'vant';
import { get, post } from '@/api/request';
import { useAuthStore } from '@/store/auth';
import InputField from '@/components/InputField.vue';
import StatusBanner from '@/components/StatusBanner.vue';
import { uploadImage } from '@/utils/upload';
import { useCascaderAreaData } from '@vant/area-data';

const auth = useAuthStore();

const form = reactive({
  nickname: '',
  gender: 1 as number,
  age: undefined as number | undefined,
  cityId: undefined as number | undefined,
  height: undefined as number | undefined,
  occupationId: undefined as number | undefined,
  occupationCustom: '',
  interestTagIds: [] as number[],
  customInterests: [] as string[],
  requirement: {
    targetGender: 0 as number,
    targetAgeMin: undefined as number | undefined,
    targetAgeMax: undefined as number | undefined,
    targetCityId: undefined as number | undefined,
    selfDesc: '',
  },
});

const customInput = ref('');
const status = ref<{ profileStatus: number; latestReject: any } | null>(null);
const readonly = computed(() => status.value?.profileStatus === 1);
const photosRequired = computed(() => status.value?.profileStatus === 0 || status.value?.profileStatus === 3);

type CityItem = { id: string; name: string; pinyin?: string | null; province?: string | null };
type CityOption = {
  text: string;
  value: string;
  cityId?: number;
  children?: CityOption[];
};

const cities = ref<CityItem[]>([]);
// @vant/area-data 提供的省/市/县三级级联数据（含全国 31 个省级、333 个市级、2844 个县级行政区）
const areaOptions = useCascaderAreaData() as CityOption[];
const occupations = ref<{ id: string; name: string }[]>([]);
const interestTags = ref<{ id: string; name: string }[]>([]);

const avatarOssKey = ref<string>('');
const avatarUrl = ref<string>('');
const photos = ref<{ ossKey: string; url: string }[]>([]);

const avatarInput = ref<HTMLInputElement | null>(null);
const photoInput = ref<HTMLInputElement | null>(null);
const uploadingAvatar = ref(false);
const uploadingPhotos = ref(false);
const submitting = ref(false);

// ——— 通用 picker（点击下拉） ———————————————————————
type PickerKey = 'occ';
type CityPickerKey = 'city' | 'targetCity';
const pickerShow = ref(false);
const pickerTitle = ref('请选择');
const pickerKey = ref<PickerKey | null>(null);
const cityPickerShow = ref(false);
const cityPickerKey = ref<CityPickerKey>('city');
const cityCascaderValue = ref('');
const cityPickerTitle = computed(() =>
  cityPickerKey.value === 'city' ? '选择城市' : '选择期望城市',
);

const cityOptions = computed<CityOption[]>(() => {
  // 仅当市级节点能在后端 cities 字典里匹配到 cityId 时保留（disabled 样式）
  // 选择器仍展示完整省/市/县三级，回写时按市名反查 cityId
  return areaOptions;
});

// actions 里挂 callback 直接修改 form 字段，避免依赖 select 事件回传 id
const pickerActions = computed(() => {
  if (pickerKey.value !== 'occ') return [];
  return occupations.value.map((o) => ({
    name: o.name,
    callback: () => {
      form.occupationId = Number(o.id);
      form.occupationCustom = '';
    },
  }));
});

const openPicker = (which: PickerKey | CityPickerKey) => {
  if (readonly.value) return;
  if (which === 'city' || which === 'targetCity') {
    if (cities.value.length === 0) {
      showToast('城市数据加载中，请稍后再试');
      return;
    }
    cityPickerKey.value = which;
    const selectedId = which === 'city' ? form.cityId : form.requirement.targetCityId;
    cityCascaderValue.value = resolveCascaderValue(selectedId);
    cityPickerShow.value = true;
    return;
  }

  pickerKey.value = which;
  pickerTitle.value = '选择职业';
  pickerShow.value = true;
};

// 找到市级节点（index 1）；用户选到县级时取市
const pickCityOption = (selectedOptions: CityOption[]): CityOption | undefined => {
  if (!selectedOptions?.length) return undefined;
  // 1) 如果选到了县级（3 级），用市
  if (selectedOptions.length >= 2) return selectedOptions[1];
  // 2) 只选到省级，忽略
  return undefined;
};

const onCityFinish = ({ selectedOptions }: { selectedOptions: CityOption[] }) => {
  const cityOpt = pickCityOption(selectedOptions);
  if (!cityOpt) return;

  if (cityPickerKey.value === 'city') form.cityId = Number(cityOpt.value);
  else form.requirement.targetCityId = Number(cityOpt.value);
  cityPickerShow.value = false;
};

// 选到市时实时写回 form.cityId / targetCityId，并立即关闭弹层（不强制选到县）
const onCityChange = ({ selectedOptions }: { selectedOptions: CityOption[] }) => {
  const cityOpt = pickCityOption(selectedOptions);
  if (!cityOpt) return;

  if (cityPickerKey.value === 'city') form.cityId = Number(cityOpt.value);
  else form.requirement.targetCityId = Number(cityOpt.value);
  // 选中市级即关闭（不强制选到县）
  cityPickerShow.value = false;
};

// 打开 picker 时根据已选 cityId 还原 cascader value（要传市级 value）
const resolveCascaderValue = (cityId: number | undefined): string => {
  if (!cityId) return '';
  // area-data 的市级 value 形如 '110100'，与 cityId 数字一致
  return String(cityId);
};

const setGender = (v: 1 | 2) => {
  if (readonly.value) return;
  form.gender = v;
};
const setTargetGender = (v: 0 | 1 | 2) => {
  if (readonly.value) return;
  form.requirement.targetGender = v;
};

const iconChevron =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>';

const genderText = computed(() => (form.gender === 1 ? '男' : form.gender === 2 ? '女' : ''));
const targetGenderText = computed(() => {
  const v = form.requirement.targetGender;
  return v === 1 ? '男' : v === 2 ? '女' : '不限';
});
const cityText = computed(() => {
  // 兼容两种形式：form.cityId 可能是后端 id（自增）或区码（@vant/area-data 的 value）
  // 后端 City 表 pinyin 字段存的是区码（如 110100），所以这里两种都尝试匹配
  const id = form.cityId;
  if (!id) return '';
  return (
    cities.value.find((c) => Number(c.id) === id)?.name ||
    cities.value.find((c) => c.pinyin === String(id))?.name ||
    ''
  );
});
const occText = computed(
  () => occupations.value.find((c) => Number(c.id) === form.occupationId)?.name || form.occupationCustom,
);
const targetCityText = computed(() => {
  const id = form.requirement.targetCityId;
  if (!id) return '';
  return (
    cities.value.find((c) => Number(c.id) === id)?.name ||
    cities.value.find((c) => c.pinyin === String(id))?.name ||
    ''
  );
});

const toggleTag = (id: number) => {
  if (readonly.value) return;
  const idx = form.interestTagIds.indexOf(id);
  if (idx >= 0) form.interestTagIds.splice(idx, 1);
  else form.interestTagIds.push(id);
};

const addCustom = () => {
  if (readonly.value) return;
  const v = customInput.value.trim();
  if (!v) return;
  if (!form.customInterests.includes(v)) form.customInterests.push(v);
  customInput.value = '';
};

const removeCustom = (idx: number) => {
  if (readonly.value) return;
  form.customInterests.splice(idx, 1);
};

// ——— 头像 / 生活照 —————————————————————————————
const pickAvatar = () => avatarInput.value?.click();
const pickPhotos = () => photoInput.value?.click();

const onAvatarPicked = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  (e.target as HTMLInputElement).value = '';
  if (!file) return;
  uploadingAvatar.value = true;
  try {
    const r = await uploadImage(file, 'avatar');
    avatarOssKey.value = r.ossKey;
    avatarUrl.value = r.url;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[avatar upload] failed', err);
  } finally {
    uploadingAvatar.value = false;
  }
};

const onPhotosPicked = async (e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files || []);
  (e.target as HTMLInputElement).value = '';
  if (!files.length) return;
  const slots = 9 - photos.value.length;
  if (slots <= 0) {
    showToast('生活照最多 9 张');
    return;
  }
  const list = files.slice(0, slots);
  uploadingPhotos.value = true;
  for (const f of list) {
    try {
      const r = await uploadImage(f, 'lifestyle');
      photos.value.push({ ossKey: r.ossKey, url: r.url });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('[photo upload] failed', err);
    }
  }
  uploadingPhotos.value = false;
};

const removePhoto = (idx: number) => {
  if (readonly.value) return;
  photos.value.splice(idx, 1);
};

const loadDicts = async () => {
  const [c, o, t] = await Promise.all([
    get<any[]>('/api/v1/dict/cities'),
    get<any[]>('/api/v1/dict/occupations'),
    get<any[]>('/api/v1/dict/interest-tags'),
  ]);
  cities.value = c;
  occupations.value = o;
  interestTags.value = t;
};

const loadStatus = async () => {
  status.value = await get('/api/v1/profile/status');
};

const loadApproved = async () => {
  try {
    const p = await get<any>('/api/v1/profile');
    if (p) {
      form.nickname = p.nickname || '';
      form.gender = p.gender || 1;
      form.age = p.age;
      form.cityId = p.city ? Number(p.city.id) : undefined;
      form.height = p.height;
      form.occupationId = p.occupation ? Number(p.occupation.id) : undefined;
      form.occupationCustom = p.occupationCustom || '';
      form.interestTagIds = (p.interests || []).map((i: any) => Number(i.id));
      form.customInterests = p.customInterests || [];
      if (p.requirement) {
        form.requirement.targetGender = p.requirement.targetGender;
        form.requirement.targetAgeMin = p.requirement.targetAgeMin;
        form.requirement.targetAgeMax = p.requirement.targetAgeMax;
        form.requirement.targetCityId = p.requirement.targetCity ? Number(p.requirement.targetCity.id) : undefined;
        form.requirement.selfDesc = p.requirement.selfDesc || '';
      }
      avatarOssKey.value = p.avatarOssKey || '';
      avatarUrl.value = p.avatarUrl || '';
      photos.value = Array.isArray(p.photos) ? p.photos : [];
    }
  } catch (e) {
    // 还没资料，忽略
  }
};

const onSubmit = async () => {
  if (!form.nickname.trim()) { showToast('请填写昵称'); return; }
  if (!form.age) { showToast('请填写年龄'); return; }
  if (!form.cityId) { showToast('请选择城市'); return; }
  if (photosRequired.value) {
    if (!avatarOssKey.value) { showToast('请上传头像'); return; }
    if (photos.value.length === 0) { showToast('请至少上传 1 张生活照'); return; }
  }
  submitting.value = true;
  try {
    await post('/api/v1/profile/submit', {
      ...form,
      avatarOssKey: avatarOssKey.value,
      photoOssKeys: photos.value.map((p) => p.ossKey),
      requirement: {
        ...form.requirement,
        targetGender: form.requirement.targetGender || 0,
      },
    });
    auth.updateProfileStatus(1);
    showSuccessToast('已提交审核');
    loadStatus();
  } finally {
    submitting.value = false;
  }
};

onMounted(async () => {
  await loadDicts();
  await loadStatus();
  if (status.value?.profileStatus === 2 || status.value?.profileStatus === 3) {
    await loadApproved();
  }
});
</script>

<style scoped>
.profile { padding: 12px 16px 0; }

/* —— 头像独立卡 ——————————————————————————— */
.profile__avatar-card { padding: 20px; }
.avatar-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}
.avatar {
  position: relative;
  flex: 0 0 auto;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-bg-section);
  border: 1px dashed var(--color-border-strong);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.avatar img { width: 100%; height: 100%; object-fit: cover; }
.avatar__placeholder {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
.avatar__plus { font-size: 26px; line-height: 1; color: var(--color-primary); }
.avatar__hint { letter-spacing: 1px; }
.avatar__mask {
  position: absolute;
  inset: auto 0 0 0;
  background: rgba(31, 20, 16, 0.55);
  color: #fff;
  font-size: 11px;
  text-align: center;
  padding: 4px 0;
  letter-spacing: 1px;
}
.avatar-meta__title { font-size: var(--font-size-md); font-weight: 600; color: var(--color-text-primary); }
.avatar-meta__desc { margin-top: 4px; font-size: var(--font-size-sm); }

/* —— 生活照：Banner 风格横滑 —————————————————————— */
.profile__photos-card {
  margin: 0 0 var(--space-4);
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 16px 0 18px;
  border: 1px solid var(--color-border-light);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
}
.profile__photos-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 16px 10px;
}
.profile__photos-title {
  font-family: var(--font-serif-cn), var(--font-serif-en);
  font-size: var(--font-size-md);
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 1px;
}
.profile__photos-desc { margin-top: 2px; font-size: var(--font-size-xs); }
.profile__photos-add {
  flex: 0 0 auto;
  background: transparent;
  border: 1px solid var(--color-primary);
  color: var(--color-primary);
  border-radius: var(--radius-pill);
  padding: 4px 12px;
  font-size: var(--font-size-xs);
  font-weight: 500;
  cursor: pointer;
}
.profile__photos-empty {
  margin: 0 16px;
  height: 140px;
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: var(--color-bg-section);
  color: var(--color-text-secondary);
  cursor: pointer;
}
.profile__photos-empty-plus { font-size: 32px; line-height: 1; color: var(--color-primary); }
.profile__photos-empty-hint { font-size: var(--font-size-sm); letter-spacing: 1px; }

.profile__photos-strip {
  display: flex;
  gap: 10px;
  padding: 0 16px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.profile__photos-strip::-webkit-scrollbar { display: none; }

.photo-banner {
  position: relative;
  flex: 0 0 76%;
  max-width: 320px;
  aspect-ratio: 16 / 9;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg-section);
  scroll-snap-align: start;
  box-shadow: var(--shadow-xs);
}
.photo-banner img { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo-banner__overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.4) 0%, transparent 35%);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 10px 12px;
  color: #fff;
  font-size: var(--font-size-xs);
  letter-spacing: 1px;
  pointer-events: none;
}
.photo-banner__index { font-weight: 600; }
.photo-banner__remove {
  pointer-events: auto;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.85);
  color: var(--color-text-primary);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
}

/* —— 表单行：标签 + 值 + chevron ——————————————————— */
.form-grid { display: flex; flex-direction: column; }
.form-grid__row {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: var(--space-3);
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-light);
}
.form-grid__row:last-child { border-bottom: none; }
.form-grid__row > :deep(.input-field) {
  min-width: 0;
  width: 100%;
}
.form-grid__row--textarea {
  grid-template-columns: 80px minmax(0, 1fr);
  align-items: flex-start;
  padding: 12px 0;
}
.form-grid__row--textarea .textarea {
  width: 100%;
  min-width: 0;
}
.form-grid__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-regular);
  font-weight: 500;
}

/* 下拉行：模拟 van-cell is-link */
.form-grid__row--select {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  min-height: 40px;
}
.form-grid__row--select.is-disabled { cursor: not-allowed; opacity: 0.7; }
.form-grid__row--select .form-grid__label {
  flex: 0 0 80px;
}
.form-grid__value {
  flex: 1;
  min-width: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.form-grid__value.is-placeholder { color: var(--color-text-muted); }
.form-grid__chevron {
  flex: 0 0 auto;
  display: inline-flex;
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
}
.form-grid__chevron :deep(svg) { width: 100%; height: 100%; }

/* —— 单选 chips ——————————————————————————————————— */
.radio-group {
  display: flex;
  gap: 10px;
}
.radio-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--color-border);
  background: #fff;
  border-radius: var(--radius-sm);
  font-size: var(--font-size-base);
  color: var(--color-text-regular);
  cursor: pointer;
  transition: all 0.15s ease;
}
.radio-chip.is-active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.radio-chip.is-active .radio-dot {
  border-color: #fff;
  background: #fff;
}
.radio-chip.is-disabled { cursor: not-allowed; opacity: 0.7; }
.radio-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid var(--color-border-strong);
  background: transparent;
  display: inline-block;
  position: relative;
}
.radio-chip.is-active .radio-dot::after {
  content: '';
  position: absolute;
  inset: 3px;
  background: var(--color-primary);
  border-radius: 50%;
}

/* —— textarea ——————————————————————————————— */
.textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background: #fff;
  outline: none;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
}
.textarea:focus { border-color: var(--color-primary); }
.textarea:read-only { background: var(--color-bg-section); }

/* —— 标签 ————————————————————————————————— */
.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border: 1px solid var(--color-border);
  background: #fff;
  border-radius: var(--radius-pill);
  font-size: var(--font-size-xs);
  color: var(--color-text-regular);
  user-select: none;
  transition: all 0.15s ease;
}
.tag-chip.is-active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.tag-chip.is-custom {
  background: var(--color-accent-soft);
  color: #6b3d05;
  border-color: #f6dfb6;
}
.tag-chip__x { margin-left: 4px; opacity: 0.6; }

/* —— 自定义兴趣输入 ——————————————————————————— */
.tag-input {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}
.tag-input :deep(.input-field) { flex: 1; min-width: 0; }

/* —— 提交按钮 ——————————————————————————————— */
.profile__actions {
  margin-top: var(--space-6);
  margin-bottom: var(--space-4);
}
.profile__submit {
  height: 48px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-soft) 100%);
  border: none;
}
.profile__submit :deep(.van-button__text) {
  font-family: var(--font-serif-cn);
  font-weight: 600;
  letter-spacing: 4px;
}
</style>