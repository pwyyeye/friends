<template>
  <div class="range-question">
    <label class="form-field">{{ isHeight ? '最低身高' : '最早出生年份' }}
      <select :value="lower ?? ''" :aria-label="isHeight ? '最低身高' : '最早出生年份'" @change="change('min', $event)">
        <option value="">不限</option>
        <option v-for="n in values" :key="n" :value="n">{{ n }} {{ isHeight ? '厘米' : '年' }}</option>
      </select>
    </label>
    <label class="form-field">{{ isHeight ? '最高身高' : '最晚出生年份' }}
      <select :value="upper ?? ''" :aria-label="isHeight ? '最高身高' : '最晚出生年份'" @change="change('max', $event)">
        <option value="">不限</option>
        <option v-for="n in upperValues" :key="n" :value="n">{{ n }} {{ isHeight ? '厘米' : '年' }}</option>
      </select>
    </label>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { Preference } from '@/types/profile';
const props = defineProps<{ type: 'height' | 'birth'; model: Preference }>();
const isHeight = computed(() => props.type === 'height');
const lower = computed(() => isHeight.value ? props.model.heightMin : props.model.birthYearMin);
const upper = computed(() => isHeight.value ? props.model.heightMax : props.model.birthYearMax);
const adultYear = Number(new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' }).slice(0, 4)) - 18;
const seniorYear = adultYear - 42; // 60 周岁对应的出生年份
const values = computed(() => {
  if (isHeight.value)
    return Array.from({ length: 230 - 100 + 1 }, (_, i) => 100 + i);
  // 出生年份倒序：从 18 周岁那一年往回排到 60 周岁
  return Array.from({ length: adultYear - seniorYear + 1 }, (_, i) => adultYear - i);
});
const upperValues = computed(() => values.value.filter(n => lower.value == null || n >= lower.value));
function change(side: 'min' | 'max', event: Event) {
  const raw = (event.target as HTMLSelectElement).value;
  const n = raw === '' ? null : Number(raw);
  const minKey = isHeight.value ? 'heightMin' : 'birthYearMin';
  const maxKey = isHeight.value ? 'heightMax' : 'birthYearMax';
  if (side === 'min') {
    // Update both bounds together so autosave never sends a reversed range.
    if (n != null && upper.value != null && n > upper.value) props.model[maxKey] = n;
    props.model[minKey] = n;
  } else props.model[maxKey] = n;
}
</script>
