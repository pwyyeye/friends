<template>
  <div class="layout">
    <!-- 顶部 NavBar：跟随当前 route 的 title；细分割线 -->
    <van-nav-bar
      v-if="!$route.meta.home && !$route.meta.customHeader"
      :title="pageTitle"
      fixed
      safe-area-inset-top
      class="layout__nav"
    >
      <template #left v-if="$route.meta?.back !== false">
        <button v-if="canBack" class="layout__back" type="button" :aria-label="$route.meta.backTo ? '返回我的' : '返回上一页'" @click="onBack"><van-icon name="arrow-left" size="22" aria-hidden="true" /></button>
      </template>
      <template #right>
        <slot name="nav-right" />
      </template>
    </van-nav-bar>

    <main class="layout__content" :class="{ 'has-custom-header': $route.meta.home || $route.meta.customHeader, 'has-detail-footer': $route.meta.recommendationDetail }">
      <router-view v-slot="{ Component }">
        <keep-alive :include="$route.meta.home || $route.meta.recommendationDetail ? ['HomePage'] : []"><component :is="Component" /></keep-alive>
      </router-view>
    </main>

    <PillTabBar v-if="!$route.meta.recommendationDetail" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import PillTabBar from '@/components/PillTabBar.vue';
import { useAuthStore } from '@/store/auth';
import { useSocialStore } from '@/store/social';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const social = useSocialStore();

const pageTitle = computed(() => (route.meta?.title as string) || 'Friends');
const canBack = computed(() => !!route.meta?.back);

const onBack = () => {
  if (typeof route.meta.backTo === 'string') router.push(route.meta.backTo);
  else if (window.history.length > 1) router.back();
  else router.push('/me');
};

onMounted(() => {
  if (auth.token) void social.hydrate();
});
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
  background: #fff;
}
.layout__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-left: -10px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-text-primary);
  cursor: pointer;
}
.layout__back:focus-visible { outline: 3px solid var(--color-primary-deep); border-radius: 12px; }
.layout__nav :deep(.van-nav-bar::after) {
  border-bottom: 1px solid var(--color-border-light);
}
.layout__content {
  flex: 1;
  /* 让出 nav-bar + tab-bar 的空间，page 自身不再叠加 padding-top/bottom */
  padding-top: calc(56px + var(--safe-area-top));
  padding-bottom: calc(110px + var(--safe-area-bottom));
}
.layout__content.has-custom-header { padding-top:0; }
.layout__content.has-detail-footer { padding-bottom:0; }
</style>
