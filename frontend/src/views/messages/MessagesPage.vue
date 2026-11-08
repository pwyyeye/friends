<template>
  <main class="messages-page">
    <header class="messages-header">
      <div>
        <p>和孩子的缘分进度</p>
        <h1>消息</h1>
      </div>
      <button class="notice-button" type="button" aria-label="通知设置" @click="openPanel('notice')">
        <van-icon name="bell" aria-hidden="true" />
        <span v-if="unreadCount">{{ unreadCount }}</span>
      </button>
    </header>

    <section class="quick-card" aria-labelledby="quick-title">
      <div class="section-heading">
        <h2 id="quick-title">互动消息</h2>
        <span>及时回应，不错过合适的人</span>
      </div>
      <nav class="quick-grid" aria-label="消息快捷入口">
        <button v-for="item in quickItems" :key="item.id" type="button" @click="openPanel(item.id)">
          <span class="quick-icon" :class="item.tone">
            <van-icon :name="item.icon" aria-hidden="true" />
          </span>
          <span class="quick-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ item.count ? `${item.count} 条新动态` : item.hint }}</small>
          </span>
        </button>
      </nav>
    </section>

    <section class="chat-card" aria-labelledby="chat-title">
      <div class="section-heading">
        <h2 id="chat-title">最近消息</h2>
        <button type="button" @click="load">刷新</button>
      </div>
      <div v-if="loading" class="message-state" role="status">正在读取消息</div>
      <div v-else-if="error" class="message-state">
        <p role="alert">{{ error }}</p>
        <button type="button" class="secondary-button" @click="load">重新加载</button>
      </div>
      <div v-else class="thread-list">
        <button
          v-for="thread in threads"
          :key="thread.id"
          type="button"
          class="thread"
          @click="openThread(thread)"
        >
          <span class="thread-avatar" :class="thread.tone" aria-hidden="true">
            <van-icon :name="thread.icon" />
          </span>
          <span class="thread-copy">
            <span class="thread-top">
              <strong>{{ thread.title }}</strong>
              <small>{{ thread.time }}</small>
            </span>
            <span class="thread-preview">{{ thread.content }}</span>
          </span>
          <van-icon name="arrow" aria-hidden="true" class="thread-arrow" />
        </button>
      </div>
    </section>

    <van-popup v-model:show="panelOpen" round position="bottom" teleport="body" class="message-popup">
      <section class="message-dialog" role="dialog" aria-modal="true" :aria-label="panel.title">
        <button class="dialog-close" type="button" aria-label="关闭" @click="panelOpen = false">×</button>
        <span class="dialog-icon" aria-hidden="true">
          <van-icon :name="panel.icon" />
        </span>
        <h2>{{ panel.title }}</h2>
        <p>{{ panel.message }}</p>
        <router-link v-if="panel.to" :to="panel.to" class="primary-button" @click="panelOpen = false">
          {{ panel.action }}
        </router-link>
        <button v-else type="button" class="primary-button" @click="panelOpen = false">
          我知道了
        </button>
      </section>
    </van-popup>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { get } from '@/api/request';
import type {
  DailyRecommendations,
  Recommendation,
} from '@/types/recommendation';
import { useSocialStore } from '@/store/social';
import { useFeaturesStore } from '@/store/features';

type QuickId = 'system' | 'viewed' | 'unlocked' | 'favorite' | 'search' | 'notice';
type PanelId = QuickId | 'service' | 'profile' | 'recommendation';

interface PanelContent {
  title: string;
  icon: string;
  message: string;
  to?: string;
  action?: string;
}

interface Thread {
  id: string;
  title: string;
  content: string;
  time: string;
  icon: string;
  tone: string;
  panel: PanelId;
  to?: string;
}

const router = useRouter();
const social = useSocialStore();
const features = useFeaturesStore();
const loading = ref(true);
const error = ref('');
const panelOpen = ref(false);
const panel = ref<PanelContent>({ title: '', icon: '', message: '' });
const recommendations = ref<Recommendation[]>([]);
const registration = ref<DailyRecommendations['registration'] | null>(null);

const quickItems = computed(() => [
  { id: 'system' as const, label: '系统消息', count: registration.value?.profileStatus === 3 ? 1 : 0, hint: '资料和账号提醒', icon: 'chat-o', tone: 'coral' },
  { id: 'viewed' as const, label: '看过我的', count: social.summary?.counts.receivedView ?? 0, hint: '暂时还没有', icon: 'eye-o', tone: 'blue' },
  { id: 'unlocked' as const, label: '解锁我的', count: social.summary?.counts.receivedUnlock ?? 0, hint: '暂时还没有', icon: 'shield-o', tone: 'gold' },
  { id: 'favorite' as const, label: '收藏我的', count: social.summary?.counts.receivedFavorite ?? 0, hint: '暂时还没有', icon: 'star-o', tone: 'green' },
  { id: 'search' as const, label: '精准搜索', count: 0, hint: recommendations.value.length ? `${recommendations.value.length} 份推荐` : '按条件找资料', icon: 'search', tone: 'violet' },
  { id: 'notice' as const, label: '通知状态', count: 0, hint: '管理消息提醒', icon: 'bell', tone: 'gray' },
].filter((item) =>
  item.id === 'favorite'
    ? features.isEnabled('favorite')
    : item.id === 'unlocked'
      ? features.isEnabled('unlock')
      : true,
));

const unreadCount = computed(() => {
  const systemUnread = registration.value?.profileStatus === 3 ? 1 : 0;
  return systemUnread
    + (social.summary?.counts.receivedView ?? 0)
    + (social.summary?.counts.receivedUnlock ?? 0)
    + (social.summary?.counts.receivedFavorite ?? 0);
});

const threads = computed<Thread[]>(() => {
  const result: Thread[] = [];
  const first = recommendations.value[0];
  const status = registration.value;
  if (!status?.hasProfile) {
    result.push({
      id: 'profile-guide',
      title: '相亲资料提醒',
      content: '还没有登记孩子的相亲资料，完成后可以获得更精准的推荐',
      time: '今天',
      icon: 'contact',
      tone: 'coral',
      panel: 'profile',
      to: '/profile',
    });
  } else if (status.profileStatus === 3) {
    result.push({
      id: 'profile-rejected',
      title: '系统消息',
      content: '孩子的资料需要补充修改，修改后可再次提交审核',
      time: '今天',
      icon: 'chat-o',
      tone: 'coral',
      panel: 'system',
      to: '/profile',
    });
  } else if (status.profileStatus === 1) {
    result.push({
      id: 'profile-review',
      title: '系统消息',
      content: '孩子的资料已经提交，工作人员正在审核',
      time: '今天',
      icon: 'chat-o',
      tone: 'coral',
      panel: 'system',
      to: '/profile',
    });
  } else {
    result.push({
      id: 'profile-ready',
      title: '平台助手',
      content: '孩子资料已通过审核，可以查看今日推荐了',
      time: '今天',
      icon: 'passed',
      tone: 'green',
      panel: 'recommendation',
      to: '/home',
    });
  }
  result.push({
    id: 'service',
    title: '专属管家',
    content: '了解资料、审核进度或人工牵线，都可以在这里咨询',
    time: '09:30',
    icon: 'headset-o',
    tone: 'gold',
    panel: 'service',
    to: '/me',
  });
  if (first) {
    result.push({
      id: `recommendation-${first.id}`,
      title: '今日推荐',
      content: `发现一位${first.gender === 1 ? '男孩' : '女孩'}家长登记的资料，现居${first.cityName || '当地'}`,
      time: '刚刚',
      icon: 'friends-o',
      tone: 'blue',
      panel: 'recommendation',
      to: `/recommendations/${first.id}`,
    });
  }
  const latest = social.summary?.latest?.[0];
  if (latest) {
    const labels: Record<string, string> = {
      favorite: '收藏了孩子资料',
      view: '查看了孩子资料',
      unlock: '提交了了解意向',
      like: '给孩子动态点了赞',
    };
    result.push({
      id: `interaction-${latest.id}`,
      title: '新的互动消息',
      content: `${latest.actorName}${labels[latest.kind] || '与孩子资料产生了互动'}`,
      time: '最近',
      icon: 'chat-o',
      tone: 'coral',
      panel: 'notice',
    });
  }
  if (social.favorites.length) {
    result.push({
      id: 'favorite-record',
      title: '我的收藏',
      content: `已经收藏 ${social.favorites.length} 份资料，可以继续对比了解`,
      time: '最近',
      icon: 'star-o',
      tone: 'green',
      panel: 'favorite',
      to: '/activity/favorite',
    });
  }
  return result;
});

async function load() {
  loading.value = true;
  error.value = '';
  try {
    const [result] = await Promise.all([
      get<DailyRecommendations>('/api/v1/recommendations'),
      social.hydrate(),
    ]);
    recommendations.value = result.items;
    registration.value = result.registration;
    result.items.forEach(social.remember);
  } catch (cause: any) {
    error.value = cause?.message || '暂时无法读取消息';
  } finally {
    loading.value = false;
  }
}

function openPanel(id: PanelId) {
  const panels: Record<PanelId, PanelContent> = {
    system: {
      title: '系统消息',
      icon: 'chat-o',
      message: systemMessage(),
      to: registration.value?.hasProfile ? '/profile' : '/register',
      action: registration.value?.hasProfile ? '查看孩子资料' : '立即登记',
    },
    viewed: {
      title: '看过我的',
      icon: 'eye-o',
      message: '目前还没有新的访客记录，完善资料并保持实名状态会让推荐更有信任感',
      to: '/profile',
      action: '完善孩子资料',
    },
    unlocked: {
      title: '解锁我的',
      icon: 'shield-o',
      message: '目前还没有新的联系意向，资料审核通过后会获得更多展示机会',
      to: '/accelerate',
      action: '看看推荐动态',
    },
    favorite: {
      title: '收藏记录',
      icon: 'star-o',
      message: social.favorites.length
        ? `你已收藏 ${social.favorites.length} 份资料，可以在收藏记录中继续查看`
        : '还没有收藏资料，看到合适的人可以先收藏，和家里人商量后再了解',
      to: social.favorites.length ? '/activity/favorite' : '/home',
      action: social.favorites.length ? '查看收藏记录' : '查看今日推荐',
    },
    search: {
      title: '精准搜索',
      icon: 'search',
      message: '可以按性别、城市和职业搜索推荐资料，搜索条件会结合孩子的择偶期待',
      to: '/home?filter=1',
      action: '开始搜索',
    },
    notice: {
      title: '通知状态',
      icon: 'bell',
      message: '通知提醒会在资料审核、推荐更新和联系意向变化时出现，可在设置中统一管理',
      to: '/me',
      action: '前往设置',
    },
    service: {
      title: '专属管家',
      icon: 'headset-o',
      message: '工作人员会先核对双方资料和意愿，再协助沟通，不会直接公开父母的联系方式',
      to: '/me',
      action: '查看人工牵线说明',
    },
    profile: {
      title: '孩子相亲资料',
      icon: 'contact',
      message: '资料越完整，推荐和人工牵线越准确，也可以随时回来修改',
      to: '/profile',
      action: '完善孩子资料',
    },
    recommendation: {
      title: '今日推荐',
      icon: 'friends-o',
      message: recommendations.value.length
        ? `今天准备了 ${recommendations.value.length} 份推荐资料，可以先和孩子一起看看`
        : '今日推荐正在更新，晚一点再来看看',
      to: '/home',
      action: '查看推荐',
    },
  };
  panel.value = panels[id];
  panelOpen.value = true;
}

function openThread(thread: Thread) {
  if (thread.to?.startsWith('/recommendations/')) {
    router.push(thread.to);
    return;
  }
  openPanel(thread.panel);
}

function systemMessage() {
  if (!registration.value?.hasProfile) return '孩子还没有登记相亲资料，先完成资料才能进入推荐';
  if (registration.value.profileStatus === 1) return '孩子的资料已提交，请耐心等待工作人员审核';
  if (registration.value.profileStatus === 2) return registration.value.hasChanges
    ? '孩子资料有新修改，核对后请再次提交审核'
    : '孩子的资料已经通过审核，可以正常查看推荐';
  if (registration.value.profileStatus === 3) return '资料未通过审核，请根据工作人员意见修改后重新提交';
  return '孩子的资料还没有完成，可以继续补充';
}

onMounted(load);
</script>

<style scoped>
.messages-page {
  min-height: 100dvh;
  padding-bottom: 22px;
  color: #292425;
  background:
    radial-gradient(circle at 95% 0, #ffe2db 0, transparent 28%),
    linear-gradient(180deg, #fff8f5 0, #f7f6f5 260px);
}
.messages-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 720px;
  margin: auto;
  padding: calc(22px + var(--safe-area-top)) 20px 24px;
}
.messages-header p {
  margin: 0 0 3px;
  color: #ba777a;
  font-size: 12px;
  letter-spacing: 1px;
}
.messages-header h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.25;
  font-weight: 800;
}
.notice-button {
  position: relative;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border: 0;
  border-radius: 50%;
  color: #5f5858;
  background: #fff;
  font-size: 23px;
  box-shadow: 0 6px 18px rgba(75, 53, 49, 0.08);
}
.notice-button span {
  position: absolute;
  top: -2px;
  right: -1px;
  display: grid;
  place-items: center;
  min-width: 19px;
  height: 19px;
  border: 2px solid #fff;
  border-radius: 999px;
  color: #fff;
  background: #ff4d5c;
  font-size: 10px;
  font-weight: 700;
}
.quick-card,
.chat-card {
  max-width: 688px;
  margin: 0 16px 14px;
  padding: 18px;
  border-radius: 22px;
  background: #fff;
  box-shadow: 0 7px 24px rgba(65, 45, 41, 0.045);
}
.section-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}
.section-heading h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}
.section-heading span {
  color: #a29997;
  font-size: 11px;
}
.section-heading button {
  border: 0;
  color: #9d4f59;
  background: transparent;
  font: inherit;
  font-size: 12px;
}
.quick-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}
.quick-grid button {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  min-height: 66px;
  border: 1px solid #f5eeec;
  border-radius: 15px;
  padding: 10px;
  color: inherit;
  background: #fffdfc;
  text-align: left;
}
.quick-icon {
  display: grid;
  place-items: center;
  width: 37px;
  height: 37px;
  flex-shrink: 0;
  border-radius: 13px;
  font-size: 20px;
}
.quick-icon.coral { color: #ff5965; background: #ffeff1; }
.quick-icon.blue { color: #4c87e8; background: #edf4ff; }
.quick-icon.gold { color: #d99222; background: #fff6df; }
.quick-icon.green { color: #39a667; background: #ecfaf2; }
.quick-icon.violet { color: #8f6ad8; background: #f5efff; }
.quick-icon.gray { color: #777170; background: #f4f3f2; }
.quick-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
  gap: 3px;
}
.quick-copy strong { font-size: 14px; }
.quick-copy small {
  overflow: hidden;
  color: #a09795;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.thread-list { display: grid; }
.thread {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
  border: 0;
  border-bottom: 1px solid #f5f1f0;
  padding: 13px 0;
  color: inherit;
  background: transparent;
  text-align: left;
}
.thread:last-child { border-bottom: 0; }
.thread-avatar {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  border-radius: 15px;
  color: #fff;
  font-size: 24px;
}
.thread-avatar.coral { background: linear-gradient(145deg, #ff9b87, #ff5363); }
.thread-avatar.gold { background: linear-gradient(145deg, #f4c56c, #df9428); }
.thread-avatar.blue { background: linear-gradient(145deg, #9ebcf0, #547fda); }
.thread-avatar.green { background: linear-gradient(145deg, #7bd6a1, #2d9b61); }
.thread-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 5px;
}
.thread-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}
.thread-top strong { font-size: 15px; }
.thread-top small { flex-shrink: 0; color: #b2aaa8; font-size: 10px; }
.thread-preview {
  overflow: hidden;
  color: #8e8583;
  font-size: 12px;
  line-height: 1.45;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.thread-arrow { flex-shrink: 0; color: #d1cbca; font-size: 16px; }
.message-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 26px 10px;
  color: #938a88;
  text-align: center;
}
.message-dialog {
  position: relative;
  max-width: 660px;
  margin: auto;
  padding: 28px 24px calc(28px + var(--safe-area-bottom));
  font-size: 16px;
  line-height: 1.7;
  text-align: center;
}
.dialog-icon {
  display: grid;
  place-items: center;
  width: 62px;
  height: 62px;
  margin: 0 auto 14px;
  border-radius: 20px;
  color: #ff5a66;
  background: #fff0f2;
  font-size: 32px;
}
.message-dialog h2 { margin: 0 0 10px; font-size: 23px; }
.message-dialog p { margin: 0 0 22px; color: #746d6b; }
.message-dialog .primary-button { display: grid; place-items: center; width: 100%; }
.dialog-close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 50%;
  color: #8b8381;
  background: #f6f4f3;
  font-size: 26px;
}
@media (min-width: 640px) {
  .quick-card,
  .chat-card { margin-left: auto; margin-right: auto; }
  .quick-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
