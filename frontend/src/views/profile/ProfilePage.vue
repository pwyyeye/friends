<template>
  <div class="profile">
    <div v-if="status?.profileStatus === 2" class="status-banner success">
      资料已通过审核
    </div>
    <div v-else-if="status?.profileStatus === 1" class="status-banner warning">
      资料审核中，请耐心等待
    </div>
    <div v-else-if="status?.profileStatus === 3" class="status-banner danger">
      资料被驳回：{{ status.latestReject?.reason || '请修改后重新提交' }}
    </div>

    <div class="card">
      <div class="section-title">基础信息</div>
      <van-cell-group inset>
        <van-field v-model="form.nickname" label="昵称" placeholder="请输入" :readonly="readonly" />
        <van-field label="性别" :readonly="readonly" is-link @click="openPicker('gender')">
          <template #input>{{ genderText }}</template>
        </van-field>
        <van-field v-model.number="form.age" label="年龄" placeholder="≥ 18" type="digit" :readonly="readonly" />
        <van-field label="城市" :readonly="readonly" is-link @click="openPicker('city')">
          <template #input>{{ cityText || '请选择' }}</template>
        </van-field>
        <van-field v-model.number="form.height" label="身高(cm)" placeholder="选填" type="digit" :readonly="readonly" />
        <van-field label="职业" :readonly="readonly" is-link @click="openPicker('occ')">
          <template #input>{{ occText || '请选择（可自填）' }}</template>
        </van-field>
        <van-field
          v-model="form.occupationCustom"
          label="自定义职业"
          placeholder="字典无对应时填写"
          :readonly="readonly"
        />
      </van-cell-group>
    </div>

    <div class="card">
      <div class="section-title">兴趣爱好</div>
      <div class="muted text-sm" style="margin-bottom: 8px">从下方选择标签，也可以自己补充</div>
      <div class="tag-grid">
        <span
          v-for="t in interestTags"
          :key="t.id"
          class="tag"
          :class="{ active: form.interestTagIds.includes(Number(t.id)) }"
          @click="!readonly && toggleTag(Number(t.id))"
        >
          {{ t.name }}
        </span>
        <span
          v-for="(t, idx) in form.customInterests"
          :key="'c-' + idx"
          class="tag active custom"
          @click="!readonly && removeCustom(idx)"
        >
          {{ t }} ×
        </span>
      </div>
      <van-field
        v-model="customInput"
        placeholder="添加自定义兴趣"
        :readonly="readonly"
        style="margin-top: 8px"
      >
        <template #button>
          <van-button size="small" type="primary" plain @click="addCustom" :disabled="readonly">添加</van-button>
        </template>
      </van-field>
    </div>

    <div class="card">
      <div class="section-title">交友需求</div>
      <van-cell-group inset>
        <van-field label="期望性别" :readonly="readonly" is-link @click="openPicker('targetGender')">
          <template #input>{{ targetGenderText }}</template>
        </van-field>
        <van-field v-model.number="form.requirement.targetAgeMin" label="最小年龄" type="digit" :readonly="readonly" />
        <van-field v-model.number="form.requirement.targetAgeMax" label="最大年龄" type="digit" :readonly="readonly" />
        <van-field label="期望城市" :readonly="readonly" is-link @click="openPicker('targetCity')">
          <template #input>{{ targetCityText || '不限' }}</template>
        </van-field>
        <van-field
          v-model="form.occupationCustom"
          label="自定义职业"
          placeholder="字典无对应时填写"
          :readonly="readonly"
        />
      </van-cell-group>
    </div>

    <div class="card">
      <div class="section-title">兴趣爱好</div>
      <div class="muted text-sm" style="margin-bottom: 8px">从下方选择标签，也可以自己补充</div>
      <div class="tag-grid">
        <span
          v-for="t in interestTags"
          :key="t.id"
          class="tag"
          :class="{ active: form.interestTagIds.includes(Number(t.id)) }"
          @click="!readonly && toggleTag(Number(t.id))"
        >
          {{ t.name }}
        </span>
        <span
          v-for="(t, idx) in form.customInterests"
          :key="'c-' + idx"
          class="tag active custom"
          @click="!readonly && removeCustom(idx)"
        >
          {{ t }} ×
        </span>
      </div>
      <van-field
        v-model="customInput"
        placeholder="添加自定义兴趣"
        :readonly="readonly"
        style="margin-top: 8px"
      >
        <template #button>
          <van-button size="small" type="primary" plain @click="addCustom" :disabled="readonly">添加</van-button>
        </template>
      </van-field>
    </div>

    <div class="card">
      <div class="section-title">交友需求</div>
      <van-cell-group inset>
        <van-field label="期望性别" :readonly="readonly" is-link @click="openPicker('targetGender')">
          <template #input>{{ targetGenderText }}</template>
        </van-field>
        <van-field v-model.number="form.requirement.targetAgeMin" label="最小年龄" type="digit" :readonly="readonly" />
        <van-field v-model.number="form.requirement.targetAgeMax" label="最大年龄" type="digit" :readonly="readonly" />
        <van-field label="期望城市" :readonly="readonly" is-link @click="openPicker('targetCity')">
          <template #input>{{ targetCityText || '不限' }}</template>
        </van-field>
        <van-field
          v-model="form.requirement.selfDesc"
          label="自我介绍"
          type="textarea"
          rows="3"
          autosize
          placeholder="说说你自己"
          :readonly="readonly"
        />
      </van-cell-group>
    </div>

    <div v-if="!readonly" class="actions">
      <van-button type="primary" block @click="onSubmit" :loading="submitting">提交审核</van-button>
    </div>

    <!-- 选择器 -->
    <van-popup v-model:show="showGenderPicker" position="bottom" round>
      <van-picker
        :columns="[{ text: '男', value: 1 }, { text: '女', value: 2 }]"
        @confirm="(v) => { form.gender = v.selectedValues[0] as number; showGenderPicker = false; }"
        @cancel="showGenderPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showCityPicker" position="bottom" round>
      <van-picker
        :columns="cityColumns"
        @confirm="onPickCity"
        @cancel="showCityPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showOccPicker" position="bottom" round>
      <van-picker
        :columns="occColumns"
        @confirm="onPickOcc"
        @cancel="showOccPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showTargetGenderPicker" position="bottom" round>
      <van-picker
        :columns="[{ text: '不限', value: 0 }, { text: '男', value: 1 }, { text: '女', value: 2 }]"
        @confirm="(v) => { form.requirement.targetGender = v.selectedValues[0] as number; showTargetGenderPicker = false; }"
        @cancel="showTargetGenderPicker = false"
      />
    </van-popup>

    <van-popup v-model:show="showTargetCityPicker" position="bottom" round>
      <van-picker
        :columns="cityColumns"
        @confirm="onPickTargetCity"
        @cancel="showTargetCityPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { showToast, showSuccessToast } from 'vant';
import { get, post } from '@/api/request';
import { useAuthStore } from '@/store/auth';

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

const cities = ref<{ id: string; name: string }[]>([]);
const occupations = ref<{ id: string; name: string }[]>([]);
const interestTags = ref<{ id: string; name: string }[]>([]);

const showGenderPicker = ref(false);
const showCityPicker = ref(false);
const showOccPicker = ref(false);
const showTargetGenderPicker = ref(false);
const showTargetCityPicker = ref(false);
const submitting = ref(false);

const openPicker = (which: 'gender' | 'city' | 'occ' | 'targetGender' | 'targetCity') => {
  if (readonly.value) return;
  if (which === 'gender') showGenderPicker.value = true;
  else if (which === 'city') showCityPicker.value = true;
  else if (which === 'occ') showOccPicker.value = true;
  else if (which === 'targetGender') showTargetGenderPicker.value = true;
  else if (which === 'targetCity') showTargetCityPicker.value = true;
};

const genderText = computed(() => (form.gender === 1 ? '男' : form.gender === 2 ? '女' : '请选择'));
const targetGenderText = computed(() => {
  const v = form.requirement.targetGender;
  return v === 1 ? '男' : v === 2 ? '女' : '不限';
});
const cityText = computed(() => cities.value.find((c) => Number(c.id) === form.cityId)?.name || '');
const occText = computed(() => occupations.value.find((c) => Number(c.id) === form.occupationId)?.name || form.occupationCustom);
const targetCityText = computed(
  () => cities.value.find((c) => Number(c.id) === form.requirement.targetCityId)?.name || '',
);

const cityColumns = computed(() => cities.value.map((c) => ({ text: c.name, value: Number(c.id) })));
const occColumns = computed(() => occupations.value.map((c) => ({ text: c.name, value: Number(c.id) })));

const onPickCity = ({ selectedValues }: { selectedValues: (string | number)[] }) => {
  form.cityId = Number(selectedValues[0]);
  showCityPicker.value = false;
};
const onPickTargetCity = ({ selectedValues }: { selectedValues: (string | number)[] }) => {
  form.requirement.targetCityId = Number(selectedValues[0]);
  showTargetCityPicker.value = false;
};
const onPickOcc = ({ selectedValues }: { selectedValues: (string | number)[] }) => {
  form.occupationId = Number(selectedValues[0]);
  form.occupationCustom = '';
  showOccPicker.value = false;
};

const toggleTag = (id: number) => {
  const idx = form.interestTagIds.indexOf(id);
  if (idx >= 0) form.interestTagIds.splice(idx, 1);
  else form.interestTagIds.push(id);
};

const addCustom = () => {
  const v = customInput.value.trim();
  if (!v) return;
  if (!form.customInterests.includes(v)) form.customInterests.push(v);
  customInput.value = '';
};

const removeCustom = (idx: number) => {
  form.customInterests.splice(idx, 1);
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
    }
  } catch (e) {
    // 还没资料，忽略
  }
};

const onSubmit = async () => {
  if (!form.nickname.trim()) {
    showToast('请填写昵称');
    return;
  }
  if (!form.age) {
    showToast('请填写年龄');
    return;
  }
  if (!form.cityId) {
    showToast('请选择城市');
    return;
  }
  submitting.value = true;
  try {
    await post('/api/v1/profile/submit', {
      ...form,
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
.profile { padding: 12px 0; }

.status-banner {
  margin: 12px;
  padding: 10px 12px;
  border-radius: 4px;
  font-size: 13px;
}
.status-banner.success { background: #ecfdf5; color: #065f46; }
.status-banner.warning { background: #fef3c7; color: #92400e; }
.status-banner.danger  { background: #fee2e2; color: #991b1b; }

.section-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 12px;
  color: var(--color-text-primary);
}

.tag-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.tag {
  display: inline-block;
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  background: #fff;
  border-radius: 2px;
  font-size: 13px;
  color: var(--color-text-regular);
  user-select: none;
}
.tag.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}
.tag.custom {
  background: #fef3c7;
  color: #92400e;
  border-color: #fde68a;
}

.actions {
  padding: 16px;
}
</style>