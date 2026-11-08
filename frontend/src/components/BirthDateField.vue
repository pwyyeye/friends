<template>
  <div class="form-field">
    <span id="birth-date-label">孩子出生日期</span>
    <button
      type="button"
      class="date-select"
      aria-labelledby="birth-date-label birth-date-value"
      :aria-expanded="open"
      aria-haspopup="dialog"
      @click="showPicker"
    >
      <span id="birth-date-value">{{ displayDate }}</span>
      <span class="select-chevron" aria-hidden="true"></span>
    </button>
    <small v-if="age != null">{{ age }} 周岁</small>
    <van-popup v-model:show="open" position="bottom" round teleport="body" class="birth-date-popup">
      <div role="dialog" aria-modal="true" aria-label="选择孩子出生日期">
        <p class="birthday-help">上下滑动选择年、月、日，年份从新到旧</p>
        <van-picker
          v-model="selection"
          title="出生日期"
          :columns="columns"
          :option-height="64"
          :visible-option-num="5"
          confirm-button-text="确定"
          cancel-button-text="取消"
          @cancel="open = false"
          @confirm="confirm"
        />
      </div>
    </van-popup>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';
import { Picker as VanPicker, Popup as VanPopup, type PickerOption } from 'vant';
import 'vant/lib/picker/style';
import 'vant/lib/popup/style';
const props = defineProps<{ modelValue?: string | null }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>();
const open = ref(false), selection = ref<string[]>([]);
const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Shanghai' });
// 只允许 18–60 周岁：最晚 = 今天 - 18 年，最早 = 今天 - 60 年
const shiftYears = (years: number) => {
  const d = new Date(today + 'T00:00:00Z');
  d.setUTCFullYear(d.getUTCFullYear() + years);
  return d;
};
const latest = shiftYears(-18), earliest = shiftYears(-60);
const pad = (n: number) => String(n).padStart(2, '0');
const dayCount = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
function dayOptions(y: number, m: number): PickerOption[] {
  const lo = y === earliest.getUTCFullYear() && m === earliest.getUTCMonth() + 1 ? earliest.getUTCDate() : 1;
  const hi = y === latest.getUTCFullYear() && m === latest.getUTCMonth() + 1 ? latest.getUTCDate() : dayCount(y, m);
  const out: PickerOption[] = [];
  for (let d = lo; d <= hi; d++) out.push({ text: `${d}日`, value: pad(d) });
  return out;
}
function monthOptions(y: number): PickerOption[] {
  const lo = y === earliest.getUTCFullYear() ? earliest.getUTCMonth() + 1 : 1;
  const hi = y === latest.getUTCFullYear() ? latest.getUTCMonth() + 1 : 12;
  const out: PickerOption[] = [];
  for (let m = lo; m <= hi; m++) out.push({ text: `${m}月`, value: pad(m), children: dayOptions(y, m) });
  return out;
}
// 年份倒序：从今年满 18 周岁的那一年往回排到满 60 周岁
const columns = computed<PickerOption[]>(() => {
  const out: PickerOption[] = [];
  for (let y = latest.getUTCFullYear(); y >= earliest.getUTCFullYear(); y--)
    out.push({ text: `${y}年`, value: String(y), children: monthOptions(y) });
  return out;
});
const displayDate = computed(() => props.modelValue
  ? props.modelValue.replace(/^(\d+)-(\d+)-(\d+)$/, '$1 年 $2 月 $3 日')
  : '请选择出生日期');
const age = computed(() => props.modelValue
  ? Number(today.slice(0, 4)) - Number(props.modelValue.slice(0, 4)) - (today.slice(5) < props.modelValue.slice(5) ? 1 : 0)
  : null);
function clamp(value: string) {
  const iso = value.slice(0, 10);
  const lo = earliest.toISOString().slice(0, 10);
  const hi = latest.toISOString().slice(0, 10);
  if (iso > hi) return hi;
  if (iso < lo) return lo;
  return iso;
}
function showPicker() {
  selection.value = clamp(props.modelValue || '1998-01-01').split('-');
  open.value = true;
}
function confirm({ selectedValues }: { selectedValues: string[] }) {
  // Commit only a complete date; wheel movements never save partial dates.
  emit('update:modelValue', selectedValues.join('-'));
  open.value = false;
}
</script>
