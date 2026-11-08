<template>
  <label class="form-field"
    >{{ label }}
    <div class="field-grid">
      <select
        v-model="province"
        :aria-label="label + '省份'"
        @change="emit('update:modelValue', null)"
      >
        <option value="">请选择省份</option>
        <option v-for="p in provinces" :key="p">{{ p }}</option></select
      ><select
        :value="modelValue ?? ''"
        :aria-label="label"
        @change="
          emit(
            'update:modelValue',
            Number(($event.target as HTMLSelectElement).value) || null,
          )
        "
      >
        <option value="">
          {{ optional ? '不限 / 未填写' : '请选择城市' }}
        </option>
        <option v-for="c in available" :key="c.id" :value="Number(c.id)">
          {{ c.name }}
        </option>
      </select>
    </div></label
  >
</template>
<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { City } from '@/types/profile';
const props = defineProps<{
  modelValue?: number | null;
  cities: City[];
  label: string;
  optional?: boolean;
}>();
const emit = defineEmits<{
  (e: 'update:modelValue', value: number | null): void;
}>();
const province = ref('');
const provinces = computed(() => [
  ...new Set(props.cities.map((c) => c.province)),
]);
const available = computed(() =>
  props.cities.filter((c) => c.province === province.value),
);
watch(
  () => [props.modelValue, props.cities],
  () => {
    const c = props.cities.find((c) => Number(c.id) === props.modelValue);
    if (c) province.value = c.province;
  },
  { immediate: true },
);
</script>
