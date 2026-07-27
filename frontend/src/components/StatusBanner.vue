<template>
  <div class="status-banner" :class="`status-banner--${variant}`">
    <span class="status-banner__icon" v-html="iconSvg" />
    <div class="status-banner__body">
      <div class="status-banner__title">{{ title }}</div>
      <div v-if="description" class="status-banner__desc">{{ description }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

type Variant = 'pending' | 'approved' | 'rejected' | 'info';

const props = defineProps<{
  variant?: Variant;
  title: string;
  description?: string;
}>();

const variant = computed(() => props.variant ?? 'info');

const ICON: Record<Variant, string> = {
  pending:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>',
  approved:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
  rejected:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
  info:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v4h1"/></svg>',
};

const iconSvg = computed(() => ICON[variant.value]);
</script>

<style scoped>
.status-banner {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  line-height: 1.5;
}
.status-banner__icon {
  flex: 0 0 auto;
  display: inline-flex;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  padding: 3px;
  box-sizing: border-box;
}
.status-banner__icon :deep(svg) { width: 100%; height: 100%; }
.status-banner__title { font-weight: 600; }
.status-banner__desc { margin-top: 2px; opacity: 0.85; }

/* pending —— 暖橘 */
.status-banner--pending {
  background: #fff4e0;
  color: #8a4a08;
  border: 1px solid #f6dfb6;
}
.status-banner--pending .status-banner__icon {
  background: var(--color-accent);
  color: #fff;
}
/* approved —— 暖绿 */
.status-banner--approved {
  background: #ebf7f0;
  color: #0f5d3a;
  border: 1px solid #c9e7d6;
}
.status-banner--approved .status-banner__icon {
  background: var(--color-success);
  color: #fff;
}
/* rejected —— 暖红 */
.status-banner--rejected {
  background: #fdebeb;
  color: #8a1c1c;
  border: 1px solid #f3c8c8;
}
.status-banner--rejected .status-banner__icon {
  background: var(--color-danger);
  color: #fff;
}
/* info —— 米色 */
.status-banner--info {
  background: var(--color-bg-section);
  color: var(--color-text-regular);
  border: 1px solid var(--color-border);
}
.status-banner--info .status-banner__icon {
  background: var(--color-primary);
  color: #fff;
}
</style>