<template>
  <div class="layout">
    <van-nav-bar :title="pageTitle" fixed safe-area-inset-top />

    <div class="content">
      <router-view />
    </div>

    <van-tabbar v-model="activeTab" route safe-area-inset-bottom>
      <van-tabbar-item to="/profile" icon="user-o">资料</van-tabbar-item>
      <van-tabbar-item to="/invite" icon="share-o">邀请</van-tabbar-item>
      <van-tabbar-item to="/me" icon="setting-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const pageTitle = computed(() => (route.meta?.title as string) || 'Friends');
const activeTab = ref(0);
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: var(--color-bg-page);
  display: flex;
  flex-direction: column;
}
.content {
  flex: 1;
  padding-top: calc(46px + var(--safe-area-top));
  padding-bottom: calc(50px + var(--safe-area-bottom));
}
</style>