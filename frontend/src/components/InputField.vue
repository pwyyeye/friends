<template>
  <div class="input-field" :class="{ 'is-focus': focus }">
    <span v-if="icon" class="input-field__icon" v-html="icon" />
    <input
      :type="type"
      :inputmode="inputmode"
      :maxlength="maxlength"
      :placeholder="placeholder"
      :value="modelValue"
      :autocomplete="autocomplete"
      @input="onInput"
      @focus="focus = true"
      @blur="focus = false"
    />
    <span v-if="suffix" class="input-field__suffix">{{ suffix }}</span>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  modelValue?: string | number;
  type?: string;
  inputmode?: 'text' | 'numeric' | 'decimal' | 'tel' | 'email' | 'url' | 'search' | 'none';
  placeholder?: string;
  maxlength?: number;
  autocomplete?: string;
  icon?: string;
  suffix?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void;
}>();

const focus = ref(false);

const onInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
};
</script>

<style scoped>
.input-field {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: 0 var(--space-3);
  height: 40px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}
.input-field.is-focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(58, 16, 40, 0.08);
}
.input-field__icon {
  flex: 0 0 auto;
  display: inline-flex;
  width: 20px;
  height: 20px;
  color: var(--color-text-muted);
}
.input-field__icon :deep(svg) { width: 100%; height: 100%; }
.input-field input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
}
.input-field input::placeholder {
  color: var(--color-text-muted);
}
.input-field__suffix {
  flex: 0 0 auto;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>