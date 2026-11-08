<template>
  <main class="activity-page">
    <header class="activity-header">
      <button type="button" aria-label="返回我的" @click="router.push('/me')">
        <van-icon name="arrow-left" aria-hidden="true" />
      </button>
      <h1>{{ meta.title }}</h1>
      <span aria-hidden="true"></span>
    </header>

    <section class="activity-summary">
      <span class="summary-icon" aria-hidden="true">
        <van-icon :name="meta.icon" />
      </span>
      <div>
        <p>{{ meta.hint }}</p>
        <strong>{{ items.length }}</strong>
        <small>份资料</small>
      </div>
    </section>

    <div v-if="items.length" class="activity-list">
      <div v-for="profile in items" :key="profile.id" class="activity-item">
        <RecommendationCard :profile="profile" @view="openProfile" />
        <button
          v-if="kind === 'favorite'"
          class="remove-favorite"
          type="button"
          @click="removeFavorite(profile)"
        >
          <van-icon name="delete-o" aria-hidden="true" />
          取消收藏
        </button>
      </div>
    </div>
    <div v-else class="activity-empty">
      <span aria-hidden="true">♡</span>
      <h2>{{ meta.emptyTitle }}</h2>
      <p>{{ meta.emptyHint }}</p>
      <router-link to="/home" class="primary-button">查看今日推荐</router-link>
      <router-link to="/accelerate" class="secondary-button">去加速脱单</router-link>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import RecommendationCard from '@/components/RecommendationCard.vue';
import { useSocialStore, type SocialActivityKind } from '@/store/social';
import { successToast } from '@/utils/toast';
import type { Recommendation } from '@/types/recommendation';

const route = useRoute();
const router = useRouter();
const social = useSocialStore();

const kind = computed<SocialActivityKind>(() => {
  const value = String(route.params.kind || '');
  return value === 'unlock' || value === 'view' ? value : 'favorite';
});

const meta = computed(() => {
  if (kind.value === 'unlock') {
    return {
      title: '解锁记录',
      icon: 'shield-o',
      hint: '申请了解过的资料',
      emptyTitle: '还没有申请记录',
      emptyHint: '看到合适的资料，可以提交了解意向后与工作人员沟通',
    };
  }
  if (kind.value === 'view') {
    return {
      title: '浏览记录',
      icon: 'eye-o',
      hint: '最近看过的资料',
      emptyTitle: '还没有浏览记录',
      emptyHint: '今天推荐的资料会在这里保留，方便和家人一起比较',
    };
  }
  return {
    title: '收藏记录',
    icon: 'star-o',
    hint: '留给孩子慢慢比较',
    emptyTitle: '还没有收藏资料',
    emptyHint: '遇到合适的人先收藏，再和孩子一起商量',
  };
});

const items = computed(() => social.itemsFor(kind.value));

function openProfile(id: string) {
  router.push({
    name: 'recommendation-detail',
    params: { id },
    state: { recommendationIds: items.value.map((item) => item.id) },
  });
}

function removeFavorite(profile: Recommendation) {
  social.remove('favorite', profile.id);
  successToast('已取消收藏');
}

watch(kind, (value) => {
  if (!['favorite', 'view', 'unlock'].includes(String(route.params.kind))) {
    router.replace(`/activity/${value}`);
  }
}, { immediate: true });

onMounted(() => {
  void social.hydrate();
});
</script>

<style scoped>
.activity-page {
  min-height: 100dvh;
  padding-bottom: 28px;
  color: #292425;
  background:
    linear-gradient(180deg, #fff3ed 0, #f7f5f3 240px, #f7f6f5 100%);
}
.activity-header {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 48px;
  align-items: center;
  gap: 10px;
  max-width: 720px;
  margin: auto;
  padding: calc(18px + var(--safe-area-top)) 18px 18px;
}
.activity-header button {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 50%;
  color: #312c2c;
  background: rgba(255, 255, 255, 0.78);
  font-size: 22px;
}
.activity-header h1 {
  margin: 0;
  font-size: 24px;
  text-align: center;
  font-weight: 800;
}
.activity-summary {
  display: flex;
  align-items: center;
  gap: 14px;
  max-width: 688px;
  margin: 0 16px 14px;
  padding: 18px;
  border-radius: 22px;
  color: #fff;
  background:
    radial-gradient(circle at 90% 10%, rgba(255, 255, 255, 0.22), transparent 35%),
    linear-gradient(135deg, #ff8b76, #ff5363);
  box-shadow: 0 12px 28px rgba(240, 78, 91, 0.18);
}
.summary-icon {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  flex-shrink: 0;
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.18);
  font-size: 29px;
}
.activity-summary p { margin: 0 0 3px; color: rgba(255, 255, 255, 0.82); font-size: 12px; }
.activity-summary strong { font-size: 28px; font-variant-numeric: tabular-nums; }
.activity-summary small { margin-left: 4px; font-size: 12px; }
.activity-list {
  display: grid;
  gap: 14px;
  max-width: 688px;
  margin: auto;
  padding: 0 16px;
}
.activity-item { position: relative; }
.remove-favorite {
  position: absolute;
  z-index: 2;
  right: 14px;
  bottom: 17px;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 0;
  border-radius: 9px;
  padding: 6px 9px;
  color: #8f8785;
  background: #f7f4f3;
  font: inherit;
  font-size: 11px;
}
.activity-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 688px;
  margin: 0 16px;
  padding: 48px 24px;
  border-radius: 24px;
  background: #fff;
  text-align: center;
}
.activity-empty > span { color: #ff6a76; font-size: 50px; line-height: 1; }
.activity-empty h2 { margin: 14px 0 8px; font-size: 21px; }
.activity-empty p { margin: 0 0 22px; color: #8b8381; font-size: 14px; }
.activity-empty a { display: grid; place-items: center; width: 100%; max-width: 280px; }
.activity-empty .secondary-button { margin-top: 10px; }
@media (min-width: 640px) {
  .activity-summary,
  .activity-list,
  .activity-empty { margin-left: auto; margin-right: auto; }
}
</style>
