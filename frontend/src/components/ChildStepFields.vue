<template>
  <div class="single-question-fields">
    <GenderCards
      v-if="stepId === 'gender'"
      :model-value="model.gender"
      @update:model-value="choose"
      @continue="emit('continue')"
    />
    <div
      v-else-if="choices.length"
      class="large-choices"
      role="group"
      :aria-label="label"
    >
      <button
        v-for="o in choices"
        :key="String(o.value)"
        type="button"
        :aria-pressed="selectedValue === o.value"
        :class="{ selected: selectedValue === o.value }"
        @click="choose(o.value)"
      >
        <span>{{ o.label }}</span
        ><span class="choice-tick" aria-hidden="true">{{
          selectedValue === o.value ? '✓' : ''
        }}</span>
      </button>
    </div>
    <BirthDateField v-else-if="stepId === 'birthDate'" v-model="model.birthDate" />
    <label v-else-if="stepId === 'height'" class="form-field"
      >孩子身高 / 厘米
      <input
        v-model.number="model.height"
        type="number"
        inputmode="numeric"
        min="100"
        max="230"
        step="1"
        placeholder="例如：175"
        required
      />
    </label>
    <label v-else-if="stepId === 'nickname'" class="form-field"
      >孩子称呼
      <input v-model="model.nickname" maxlength="50" placeholder="例如：小林" />
    </label>
    <div v-else-if="stepId === 'occupation'">
      <div class="large-choices occupation-choices" role="group" aria-label="快捷选择职业">
        <button v-for="name in quickOccupations" :key="name" type="button" :aria-pressed="model.occupation === name" :class="{ selected: model.occupation === name }" @click="model.occupation = name">
          <span>{{ name }}</span><span class="choice-tick" aria-hidden="true">{{ model.occupation === name ? '✓' : '' }}</span>
        </button>
      </div>
      <label class="form-field">其他职业 / 自己填写
      <input
        v-model="model.occupation"
        list="occupations"
        maxlength="100"
        placeholder="例如：教师、工程师"
      />
      <datalist id="occupations">
        <option v-for="o in occupations" :key="o.id" :value="o.name" />
      </datalist>
      </label>
    </div>
    <CityField
      v-else-if="cityKey"
      :model-value="cityValue"
      :cities="cities"
      :label="label"
      :optional="stepId !== 'city'"
      @update:model-value="chooseCity"
    />
    <div
      v-else-if="tags"
      class="large-choices tag-options"
      role="group"
      :aria-label="label"
    >
      <p class="selection-count" aria-live="polite">
        已选 {{ tagValues.length }} / 2 项
      </p>
      <button class="refresh-tags" type="button" @click="nextBatch">换一批 <span aria-hidden="true">↻</span></button>
      <button
        v-for="tag in visibleTags"
        :key="tag"
        type="button"
        :aria-pressed="tagValues.includes(tag)"
        :class="{ selected: tagValues.includes(tag) }"
        @click="toggle(tag)"
      >
        <span>{{ tag }}</span
        ><span class="choice-tick" aria-hidden="true">{{
          tagValues.includes(tag) ? '✓' : ''
        }}</span>
      </button>
    </div>
    <label v-else-if="stepId === 'introduction'" class="form-field"
      >介绍一下孩子
      <textarea
        v-model="model.introduction"
        rows="5"
        maxlength="1000"
        placeholder="孩子平时喜欢什么？对未来生活有什么期待？"
      />
      <small>{{ model.introduction?.length || 0 }} / 1000 字</small>
    </label>
    <PreferenceRange
      v-else-if="stepId === 'targetHeight' || stepId === 'targetBirth'"
      :type="stepId === 'targetHeight' ? 'height' : 'birth'"
      :model="model.preference"
    />
    <slot v-else />
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import CityField from './CityField.vue';
import GenderCards from './GenderCards.vue';
import BirthDateField from './BirthDateField.vue';
import PreferenceRange from './PreferenceRange.vue';
import { ChildFields, Options, City } from '@/types/profile';
import { ProfileStepId, profileSteps } from '@/types/registration';
const props = defineProps<{
  stepId: ProfileStepId;
  model: ChildFields;
  options: Options;
  cities: City[];
  occupations?: { id: string; name: string }[];
}>();
const emit = defineEmits<{
  (e: 'error', message: string): void;
  (e: 'continue'): void;
}>();
const quickOccupations = ['教师', '医生', '公务员', '工程师', '企业职员', '个体经营'];
const label = computed(
  () => profileSteps.find((s) => s.id === props.stepId)?.label || '',
);
const choices = computed<{ value: string | number | null; label: string }[]>(
  () => {
    switch (props.stepId) {
      case 'relationship':
        return [
          { value: 'father', label: '父亲' },
          { value: 'mother', label: '母亲' },
        ];
      case 'education':
        return props.options.education;
      case 'income':
        return props.options.income;
      case 'maritalStatus':
        return props.options.maritalStatus;
      case 'car':
        return props.options.carStatus;
      case 'targetEducation':
        return [{ value: null, label: '不限学历' }, ...props.options.education];
      default:
        return [];
    }
  },
);
const selectedValue = computed(() =>
  props.stepId === 'targetEducation'
    ? (props.model.preference.educationMin ?? null)
    : (props.model as any)[props.stepId === 'car' ? 'carStatus' : props.stepId],
);
function choose(value: string | number | null) {
  if (props.stepId === 'targetEducation')
    props.model.preference.educationMin = value as string | null;
  else
    (props.model as any)[props.stepId === 'car' ? 'carStatus' : props.stepId] =
      value;
  emit('error', '');
}
const cityKey = computed(
  () =>
    (
      ({
        city: 'cityId',
        hometown: 'hometownCityId',
        workCity: 'workCityId',
        targetCity: 'preference',
      }) as Record<string, string>
    )[props.stepId],
);
const cityValue = computed(() =>
  cityKey.value === 'preference'
    ? props.model.preference.cityId
    : (props.model as any)[cityKey.value],
);
function chooseCity(value: number | null) {
  if (cityKey.value === 'preference') props.model.preference.cityId = value;
  else (props.model as any)[cityKey.value] = value;
}
const tags = computed(() =>
  props.stepId === 'traits'
    ? props.options.traits
    : props.stepId === 'advantages'
      ? props.options.advantages
      : props.stepId === 'expectations'
        ? props.options.expectations
        : null,
);
const tagValues = computed(() =>
  props.stepId === 'expectations'
    ? props.model.preference.tags
    : props.stepId === 'traits'
      ? props.model.traits
      : props.model.advantages,
);
const batch = ref(0);
const visibleTags = computed(() => {
  const pool = (tags.value || []).filter(t => !tagValues.value.includes(t));
  const start = batch.value * 6;
  const page = Array.from({ length: Math.min(6, pool.length) }, (_, i) => pool[(start + i) % pool.length]);
  // Keep selected tags visible so they can still be cancelled after switching batches.
  return [...tagValues.value, ...page];
});
function nextBatch() { batch.value++; }
function toggle(tag: string) {
  const list = tagValues.value,
    i = list.indexOf(tag);
  if (i >= 0) list.splice(i, 1);
  else if (list.length < 2) list.push(tag);
  else {
    emit('error', '最多选择 2 项，请先取消一项再选择');
    return;
  }
  emit('error', '');
}
</script>
