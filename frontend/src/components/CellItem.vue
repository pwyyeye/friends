<template>
  <div class="cell-item" :class="{ 'is-link': !!$attrs.onClick || clickable }">
    <div v-if="icon" class="cell-item__icon" v-html="icon" />
    <div class="cell-item__body">
      <div class="cell-item__title">{{ title }}</div>
      <div v-if="description" class="cell-item__desc">{{ description }}</div>
    </div>
    <div v-if="value !== undefined && value !== ''" class="cell-item__value">
      <slot name="value">{{ value }}</slot>
    </div>
    <div v-if="$slots.extra" class="cell-item__extra">
      <slot name="extra" />
    </div>
    <span v-if="clickable" class="cell-item__arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon?: string;
  title: string;
  description?: string;
  value?: string | number;
  clickable?: boolean;
}>();
</script>

<style scoped>
.cell-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border-light);
  font-size: var(--font-size-base);
}
.cell-item:last-child { border-bottom: none; }
.cell-item.is-link { cursor: pointer; }
.cell-item.is-link:active { background: var(--color-bg-section); }

.cell-item__icon {
  flex: 0 0 auto;
  display: inline-flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  background: var(--color-bg-section);
  border-radius: var(--radius-sm);
}
.cell-item__icon :deep(svg) { width: 18px; height: 18px; }

.cell-item__body { flex: 1; min-width: 0; }
.cell-item__title {
  color: var(--color-text-primary);
  font-weight: 500;
}
.cell-item__desc {
  margin-top: 2px;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.cell-item__value {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  flex: 0 0 auto;
}
.cell-item__arrow {
  flex: 0 0 auto;
  display: inline-flex;
  width: 16px;
  height: 16px;
  color: var(--color-text-muted);
}
.cell-item__arrow :deep(svg) { width: 100%; height: 100%; }
</style>