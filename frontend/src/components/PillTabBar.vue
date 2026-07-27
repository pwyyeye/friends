<template>
  <div class="pill-tabbar" :style="{ paddingBottom: 'calc(12px + var(--safe-area-bottom))' }">
    <nav class="pill">
      <router-link
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        class="pill-item"
        :class="{ 'is-active': active === t.to }"
        :aria-label="t.label"
      >
        <span class="pill-icon" v-html="t.icon"></span>
        <span class="pill-label">{{ t.label }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// 三个 tab —— inline SVG icon，可直接落地为代码
const tabs = [
  {
    to: '/profile',
    label: '资料',
    icon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></svg>',
  },
  {
    to: '/me',
    label: '我的',
    icon:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  },
];

const active = computed(() => {
  const m = route.matched.find((r) => tabs.some((t) => t.to === r.path));
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
  padding: 12px 16px;
  display: flex;
  justify-content: center;
  background: linear-gradient(
    to top,
    var(--color-bg-page) 60%,
    rgba(251, 246, 238, 0)
  );
  pointer-events: none; /* 让空隙区不挡滚动 */
}
.pill {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 360px;
  height: 62px;
  padding: 6px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-md);
}
.pill-item {
  flex: 1;
  height: 50px;
  border-radius: var(--radius-pill);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--color-text-secondary);
  font-size: 11px;
  letter-spacing: 0.5px;
  transition: color 0.18s ease, background 0.18s ease;
}
.pill-item.is-active {
  background: var(--color-primary);
  color: #fff;
}
.pill-icon {
  display: inline-flex;
  width: 20px;
  height: 20px;
}
.pill-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
.pill-label {
  font-weight: 600;
  letter-spacing: 1px;
}
</style>