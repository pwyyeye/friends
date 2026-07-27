<template>
  <div class="code-block">
    <div class="code-block__digits">
      <span v-for="(c, i) in digits" :key="i" class="code-block__digit">{{ c }}</span>
    </div>
    <div v-if="hint" class="code-block__hint">{{ hint }}</div>
    <div v-if="$slots.actions" class="code-block__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value: string;
  hint?: string;
}>();

const digits = computed(() => props.value.split(''));
</script>

<style scoped>
.code-block {
  background: linear-gradient(160deg, #fdf6e6 0%, #f6efe2 100%);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6) var(--space-4) var(--space-5);
  text-align: center;
  position: relative;
  overflow: hidden;
}
.code-block::before {
  content: '';
  position: absolute;
  inset: -40% -20% auto auto;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(217, 119, 6, 0.18) 0%, transparent 60%);
  pointer-events: none;
}
.code-block__digits {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.code-block__digit {
  width: 44px;
  height: 56px;
  background: #fff;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 30px;
  font-weight: 600;
  color: var(--color-primary);
  box-shadow: var(--shadow-xs);
}
.code-block__hint {
  position: relative;
  margin-top: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  letter-spacing: 1px;
}
.code-block__actions {
  position: relative;
  margin-top: var(--space-4);
  display: flex;
  gap: var(--space-3);
  justify-content: center;
}
</style>