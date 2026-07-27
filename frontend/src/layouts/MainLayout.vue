<template>
  <div class="layout">
    <!-- 顶部 NavBar：跟随当前 route 的 title；细分割线 -->
    <van-nav-bar
      :title="pageTitle"
      fixed
      safe-area-inset-top
      class="layout__nav"
    >
      <template #left v-if="$route.meta?.back !== false">
        <van-icon
          v-if="canBack"
          name="arrow-left"
          size="20"
          @click="onBack"
        />
      </template>
      <template #right>
        <slot name="nav-right" />
      </template>
    </van-nav-bar>

    <main class="layout__content">
      <router-view v-slot="{ Component }">
        <component :is="Component" />
      </router-view>
    </main>

    <PillTabBar />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PillTabBar from '@/components/PillTabBar.vue';

const route = useRoute();
const router = useRouter();

const pageTitle = computed(() => (route.meta?.title as string) || 'Friends');
const canBack = computed(() => !!route.meta?.back);

const onBack = () => {
  if (window.history.length > 1) router.back();
  else router.push('/profile');
};
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: var(--color-bg-page);
  display: flex;
  flex-direction: column;
  position: relative;
}
.layout__nav {
  background: var(--color-bg-page);
}
.layout__nav :deep(.van-nav-bar::after) {
  border-bottom: 1px solid var(--color-border-light);
}
.layout__content {
  flex: 1;
  /* 让出 nav-bar + tab-bar 的空间，page 自身不再叠加 padding-top/bottom */
  padding-top: calc(48px + var(--safe-area-top));
  padding-bottom: calc(98px + var(--safe-area-bottom));
}
</style>