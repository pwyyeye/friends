<template>
  <main class="accelerate-page">
    <header class="accelerate-header">
      <div>
        <p class="eyebrow">真实家长帮孩子找对象</p>
        <h1>加速脱单</h1>
      </div>
      <router-link to="/profile" class="header-action">完善资料</router-link>
    </header>

    <section class="my-card" aria-label="我的脱单进度">
      <div class="my-card-top">
        <div class="avatar" aria-hidden="true">
          <van-icon name="like" />
        </div>
        <div class="my-card-copy">
          <h2>{{ progressTitle }}</h2>
          <p>{{ progressHint }}</p>
        </div>
        <span class="progress-ring">{{ progress }}<small>%</small></span>
      </div>
      <div class="progress-track" aria-hidden="true">
        <span :style="{ width: `${progress}%` }"></span>
      </div>
      <div class="my-card-actions">
        <router-link to="/profile">继续完善</router-link>
        <router-link to="/home">查看今日推荐</router-link>
      </div>
    </section>

    <section class="feed-toolbar" aria-label="推荐筛选">
      <div class="feed-tabs">
        <button
          v-for="item in feedTabs"
          :key="item.id"
          type="button"
          :class="{ active: mode === item.id }"
          @click="mode = item.id"
        >
          {{ item.label }}
        </button>
      </div>
      <button class="refresh-button" type="button" :disabled="loading" @click="refresh">
        <van-icon name="replay" aria-hidden="true" />
        {{ loading ? '更新中' : '换一批' }}
      </button>
    </section>

    <div v-if="loading" class="feed-state" role="status">
      <span class="loading-heart" aria-hidden="true">♡</span>
      正在寻找更合适的资料
    </div>
    <div v-else-if="error" class="feed-state">
      <p role="alert">{{ error }}</p>
      <button type="button" class="secondary-button" @click="load">重新加载</button>
    </div>
    <div v-else-if="!visibleProfiles.length" class="feed-state">
      <van-icon name="friends-o" aria-hidden="true" />
      <h2>暂时没有新的推荐</h2>
      <p>完善孩子的择偶期待后，推荐会更精准</p>
      <router-link to="/profile" class="primary-button">完善择偶期待</router-link>
    </div>

    <section v-else class="moment-list" aria-label="推荐动态">
      <article v-for="profile in visibleProfiles" :key="profile.id" class="moment-card">
        <header class="moment-author">
          <div class="author-avatar" :class="{ boy: profile.gender === 1 }" aria-hidden="true">
            <van-icon name="contact" />
          </div>
          <div class="author-copy">
            <h2>
              {{ profile.gender === 1 ? '男孩家长' : '女孩家长' }}
              <span>· {{ profile.birthYear.slice(-2) }}年</span>
            </h2>
            <p>{{ profile.cityName || '现居地未填写' }} · 已审核资料</p>
          </div>
          <span class="moment-badge">{{ profile.gender === 1 ? '男' : '女' }}</span>
        </header>

        <p class="moment-content">{{ profile.introduction || defaultIntroduction(profile) }}</p>

        <button class="moment-photo" type="button" :aria-label="`查看${profile.profileNumber}资料`" @click="openProfile(profile)">
          <img
            :src="profile.photoUrl || `/images/registration/${profile.gender === 1 ? 'boy' : 'girl'}.webp`"
            :alt="profile.photoUrl ? '推荐资料照片' : '默认资料插图'"
            :class="{ protected: profile.photoUrl }"
          />
          <span class="photo-caption">
            <van-icon name="lock" aria-hidden="true" />
            {{ profile.photoUrl ? '照片仅作模糊展示' : '资料照片待完善' }}
          </span>
        </button>

        <div class="moment-facts">
          <span>{{ profile.height }}cm</span>
          <span>{{ profile.educationLabel || '学历未填写' }}</span>
          <span>{{ profile.occupation || '职业未填写' }}</span>
        </div>

        <div v-if="profile.traits.length || profile.advantages.length" class="moment-tags">
          <span v-for="tag in [...profile.traits, ...profile.advantages].slice(0, 4)" :key="tag">
            {{ tag }}
          </span>
        </div>

        <footer class="moment-actions">
          <button
            v-if="features.isEnabled('likes')"
            type="button"
            :class="{ active: social.isLiked(profile.id) }"
            @click="social.toggleLike(profile)"
          >
            <van-icon :name="social.isLiked(profile.id) ? 'good-job' : 'good-job-o'" aria-hidden="true" />
            {{ social.isLiked(profile.id) ? '已沾喜气' : '沾喜气' }}
          </button>
          <button
            v-if="features.isEnabled('favorite')"
            type="button"
            :class="{ active: social.isFavorite(profile.id) }"
            @click="toggleFavorite(profile)"
          >
            <van-icon :name="social.isFavorite(profile.id) ? 'star' : 'star-o'" aria-hidden="true" />
            {{ social.isFavorite(profile.id) ? '已收藏' : '收藏' }}
          </button>
          <button type="button" @click="openProfile(profile)">
            <van-icon name="arrow" aria-hidden="true" />
            看看资料
          </button>
        </footer>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { get } from '@/api/request';
import { successToast } from '@/utils/toast';
import type { DailyRecommendations, Recommendation } from '@/types/recommendation';
import { useSocialStore } from '@/store/social';
import { useFeaturesStore } from '@/store/features';

type FeedMode = 'recommended' | 'newest' | 'local';

const router = useRouter();
const social = useSocialStore();
const features = useFeaturesStore();
const loading = ref(true);
const error = ref('');
const mode = ref<FeedMode>('recommended');
const rotation = ref(0);
const feed = ref<Recommendation[]>([]);
const registration = ref<DailyRecommendations['registration'] | null>(null);
const feedTabs: { id: FeedMode; label: string }[] = [
  { id: 'recommended', label: '为你推荐' },
  { id: 'newest', label: '新上资料' },
  { id: 'local', label: '同城优先' },
];

const progress = computed(() => {
  if (!registration.value?.hasProfile) return 15;
  if (registration.value.profileStatus === 2) return registration.value.hasChanges ? 88 : 100;
  if (registration.value.profileStatus === 1) return 82;
  if (registration.value.profileStatus === 3) return 68;
  return 45;
});

const progressTitle = computed(() =>
  !registration.value?.hasProfile
    ? '先登记孩子的相亲资料'
    : registration.value.profileStatus === 2
      ? registration.value.hasChanges
        ? '资料有新修改，等待再次提交'
        : '孩子资料已审核通过'
      : registration.value.profileStatus === 1
        ? '孩子资料正在审核'
        : registration.value.profileStatus === 3
          ? '资料需要补充修改'
          : '继续完善孩子资料',
);

const progressHint = computed(() =>
  progress.value === 100
    ? '保持资料完整，更容易获得合适推荐'
    : '完善资料后，工作人员可以更准确地协助牵线',
);

const visibleProfiles = computed(() => {
  const list = [...feed.value];
  if (mode.value === 'newest') {
    return list.sort((left, right) => Number(right.birthYear) - Number(left.birthYear));
  }
  if (mode.value === 'local') {
    return list.sort((left, right) => left.cityName.localeCompare(right.cityName, 'zh-CN'));
  }
  if (!rotation.value) return list;
  const offset = rotation.value % Math.max(list.length, 1);
  return [...list.slice(offset), ...list.slice(0, offset)];
});

function defaultIntroduction(profile: Recommendation) {
  return `希望认识一位真诚、生活作息稳定、愿意认真沟通的另一半，现居${profile.cityName || '当地'}，更多情况可由家人一起了解`;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const result = await get<DailyRecommendations>('/api/v1/recommendations');
    feed.value = result.items;
    registration.value = result.registration;
    result.items.forEach(social.remember);
  } catch (cause: any) {
    error.value = cause?.message || '暂时无法读取推荐资料';
  } finally {
    loading.value = false;
  }
}

function refresh() {
  if (feed.value.length) rotation.value += 1;
  else load();
}

function openProfile(profile: Recommendation) {
  social.remember(profile);
  router.push({
    name: 'recommendation-detail',
    params: { id: profile.id },
    state: { recommendationIds: visibleProfiles.value.map((item) => item.id) },
  });
}

function toggleFavorite(profile: Recommendation) {
  const saved = social.toggleFavorite(profile);
  successToast(saved ? '已收藏这份资料' : '已取消收藏');
}

onMounted(async () => {
  await Promise.all([load(), social.hydrate()]);
});
</script>

<style scoped>
.accelerate-page {
  min-height: 100dvh;
  background: #f7f6f5;
  color: #262222;
  padding-bottom: 24px;
}
.accelerate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: calc(20px + var(--safe-area-top)) 20px 34px;
  background:
    radial-gradient(circle at 85% 10%, #ffd7cc 0, transparent 34%),
    linear-gradient(135deg, #fff4ef, #fffaf5 60%, #ffe8e4);
}
.eyebrow {
  margin: 0 0 3px;
  color: #bf6b6f;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 1px;
}
.accelerate-header h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.25;
  font-weight: 800;
}
.header-action {
  flex-shrink: 0;
  border-radius: 999px;
  padding: 10px 16px;
  color: #fff;
  background: #ff5963;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 8px 22px rgba(255, 80, 92, 0.2);
}
.my-card {
  position: relative;
  z-index: 1;
  margin: -18px 16px 15px;
  padding: 18px;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 10px 28px rgba(77, 47, 41, 0.08);
}
.my-card-top {
  display: flex;
  align-items: center;
  gap: 12px;
}
.avatar {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
  border-radius: 18px;
  color: #fff;
  background: linear-gradient(145deg, #ff9a86, #ff5263);
  font-size: 27px;
}
.my-card-copy { min-width: 0; flex: 1; }
.my-card-copy h2 { margin: 0 0 4px; font-size: 17px; line-height: 1.45; }
.my-card-copy p { margin: 0; color: #8a7c7a; font-size: 13px; line-height: 1.5; }
.progress-ring {
  flex-shrink: 0;
  color: #ff5963;
  font-size: 25px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.progress-ring small { font-size: 12px; }
.progress-track {
  height: 6px;
  margin: 16px 0 14px;
  overflow: hidden;
  border-radius: 999px;
  background: #f6e7e7;
}
.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #ffb86b, #ff5963);
  transition: width .3s ease;
}
.my-card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.my-card-actions a {
  display: grid;
  place-items: center;
  min-height: 42px;
  border-radius: 12px;
  color: #b9394c;
  background: #fff1f2;
  font-size: 14px;
  font-weight: 700;
}
.my-card-actions a:last-child { color: #fff; background: #ff5963; }
.feed-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 6px 16px 14px;
}
.feed-tabs {
  display: flex;
  min-width: 0;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}
.feed-tabs::-webkit-scrollbar { display: none; }
.feed-tabs button,
.refresh-button {
  flex-shrink: 0;
  border: 0;
  border-radius: 999px;
  padding: 9px 13px;
  color: #686262;
  background: #fff;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
}
.feed-tabs button.active { color: #fff; background: #ff5963; }
.refresh-button { display: flex; align-items: center; gap: 4px; color: #a34851; }
.feed-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin: 10px 16px;
  padding: 40px 24px;
  border-radius: 22px;
  color: #8a7c7a;
  background: #fff;
  text-align: center;
}
.feed-state .van-icon { color: #ff7380; font-size: 42px; }
.feed-state h2 { margin: 0; color: #262222; font-size: 20px; }
.feed-state p { margin: 0; }
.loading-heart { color: #ff5963; font-size: 38px; animation: beat 1.1s infinite; }
.feed-state .primary-button { margin-top: 8px; }
.moment-list {
  display: grid;
  gap: 14px;
  padding: 0 16px;
}
.moment-card {
  padding: 18px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 6px 20px rgba(55, 44, 41, 0.04);
}
.moment-author {
  display: flex;
  align-items: center;
  gap: 11px;
}
.author-avatar {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 50%;
  color: #ff6070;
  background: #fff0f2;
  font-size: 26px;
}
.author-avatar.boy { color: #347cdc; background: #edf5ff; }
.author-copy { min-width: 0; flex: 1; }
.author-copy h2 {
  margin: 0 0 3px;
  font-size: 16px;
  line-height: 1.4;
}
.author-copy h2 span { color: #ff5963; }
.author-copy p { margin: 0; color: #9b9291; font-size: 12px; }
.moment-badge {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 10px;
  color: #ff5963;
  background: #fff0f2;
  font-size: 13px;
  font-weight: 800;
}
.moment-content {
  margin: 15px 0;
  color: #393333;
  font-size: 15px;
  line-height: 1.75;
  white-space: pre-wrap;
}
.moment-photo {
  position: relative;
  display: block;
  width: 100%;
  height: 210px;
  overflow: hidden;
  border: 0;
  border-radius: 17px;
  padding: 0;
  background: #fff3f4;
  cursor: pointer;
}
.moment-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.moment-photo img.protected {
  filter: blur(7px);
  transform: scale(1.08);
}
.photo-caption {
  position: absolute;
  right: 10px;
  bottom: 10px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: 999px;
  padding: 6px 10px;
  color: #fff;
  background: rgba(35, 29, 29, 0.56);
  font-size: 11px;
  backdrop-filter: blur(8px);
}
.moment-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 13px;
}
.moment-facts span,
.moment-tags span {
  border-radius: 8px;
  padding: 5px 8px;
  color: #735a5a;
  background: #f8f3f1;
  font-size: 12px;
  font-weight: 600;
}
.moment-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 8px;
}
.moment-tags span { color: #b54858; background: #fff0f2; }
.moment-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  gap: 7px;
  margin-top: 16px;
  padding-top: 13px;
  border-top: 1px solid #f1eded;
}
.moment-actions button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 38px;
  border: 0;
  border-radius: 11px;
  color: #817878;
  background: #f8f7f7;
  font: inherit;
  font-size: 12px;
  font-weight: 600;
}
.moment-actions button.active { color: #ff5963; background: #fff0f2; }
.moment-actions button:last-child { color: #fff; background: #343031; }
@keyframes beat {
  50% { transform: scale(1.18); }
}
@media (min-width: 640px) {
  .accelerate-page { max-width: 720px; margin: auto; }
  .moment-list { padding: 0 20px; }
}
</style>
