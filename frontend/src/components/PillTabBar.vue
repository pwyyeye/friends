<template>
  <div
    class="pill-tabbar"
    :style="{ paddingBottom: 'calc(12px + var(--safe-area-bottom))' }"
  >
    <nav class="pill" aria-label="底部导航">
      <router-link
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        class="pill-item"
        :class="{ 'is-active': active === t.to }"
        :aria-label="t.label"
        :aria-current="active === t.to ? 'page' : undefined"
      >
        <span class="pill-icon" aria-hidden="true" v-html="t.icon"></span>
        <span class="pill-label">{{ t.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useFeaturesStore } from '@/store/features';

const route = useRoute();
const features = useFeaturesStore();

const allTabs = [
  {
    to: '/home',
    label: '今日推荐',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg>',
  },
  {
    to: '/accelerate',
    label: '加速脱单',
    feature: 'accelerate' as const,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m13 2-8 12h6l-1 8 9-13h-6z"/></svg>',
  },
  {
    to: '/messages',
    label: '消息',
    feature: 'messages' as const,
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/><path d="M8 9h8M8 13h5"/></svg>',
  },
  {
    to: '/me',
    label: '我的',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8z"/></svg>',
  },
];
const tabs = computed(() =>
  allTabs.filter((item) => !item.feature || features.isEnabled(item.feature)),
);

const active = computed(() => {
  if (typeof route.meta.tab === 'string') return route.meta.tab;
  const m = route.matched.find((r) => tabs.value.some((t) => t.to === r.path));
  return m ? m.path : route.path;
});
</script>

<style scoped>
.pill-tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  padding: 8px 0 0;
  display: flex;
  justify-content: center;
  background: #fff;
  border-top: 1px solid #ededee;
  box-shadow: 0 -6px 20px rgba(38, 28, 30, 0.04);
}
.pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 720px;
  min-height: 76px;
  padding: 4px 8px;
  background: #fff;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}
.pill-item {
  flex: 1;
  min-height: 64px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: #a6a6a8;
  font-size: 13px;
  letter-spacing: 0;
  transition: color 0.18s ease, transform 0.18s ease;
}
.pill-item.is-active {
  background: transparent;
  color: #ff575f;
}
.pill-icon {
  display: inline-flex;
  width: 27px;
  height: 27px;
}
.pill-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
.pill-label {
  font-weight: 600;
  letter-spacing: 0;
}
.pill-item:active { transform: scale(.96); }
@media (max-width: 350px) {
  .pill-item { font-size: 12px; }
  .pill-icon { width: 24px; height: 24px; }
}
</style>
