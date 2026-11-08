<template>
  <div class="home-page">
    <header class="home-header">
      <router-link :to="isLoggedIn ? '/profile' : '/register'" class="header-register"><span aria-hidden="true">♡</span> {{ isLoggedIn ? '完善资料' : '帮孩子登记' }}</router-link>
      <h1>完美亲家</h1>
      <router-link :to="isLoggedIn ? '/me' : '/login'" class="header-account" :aria-label="isLoggedIn ? '我的账号' : '登录父母账号'"><van-icon name="contact" /></router-link>
    </header>
    <section class="home-hero">
      <form class="home-search" role="search" @submit.prevent="load">
        <van-icon name="search" aria-hidden="true" />
        <input v-model="keyword" aria-label="搜索职业或孩子介绍" maxlength="50" placeholder="搜索职业、孩子介绍" enterkeyhint="search" />
        <button type="submit" :disabled="loading">搜索</button>
      </form>
      <nav class="home-shortcuts" aria-label="首页快捷入口">
        <button v-for="item in shortcuts" :key="item.id" type="button" @click="openShortcut(item.id)">
          <span class="shortcut-circle" :class="item.id"><van-icon :name="item.icon" /></span>
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </section>
    <main class="home-content" :class="{ 'has-guide-banner': showBanner && isLoggedIn }">
      <section class="home-stats" :class="{ 'is-guest': !isLoggedIn }" aria-label="孩子相亲进度">
        <router-link :to="isLoggedIn ? '/profile' : '/login'"><strong>{{ isLoggedIn ? (feed?.registration.hasProfile ? '已登记' : '未登记') : '登录查看' }}</strong><span>孩子资料</span></router-link>
        <router-link :to="isLoggedIn ? '/profile' : '/login'"><strong>{{ statusLabel }}</strong><span>审核状态</span></router-link>
        <a href="#today-recommendations" @click.prevent="jumpToRecommendations"><strong>{{ feed?.total ?? '—' }}</strong><span>今日推荐</span></a>
        <button type="button" @click="openShortcut('service')"><strong>{{ feed?.matchCount ?? '—' }}</strong><span>人工牵线</span></button>
      </section>
      <section id="today-recommendations" class="today-recommendations" aria-labelledby="today-title">
        <header class="today-heading">
          <div class="today-heading-row"><h2 id="today-title">今日推荐{{ feed ? '已更新' : '' }}</h2><button v-if="isLoggedIn" type="button" :aria-expanded="filtersOpen" aria-controls="recommendation-filters" @click="filtersOpen = !filtersOpen"><van-icon name="filter-o" aria-hidden="true" /> 筛选</button></div>
          <p>为孩子寻找合适的人</p>
        </header>
        <div v-if="isLoggedIn" v-show="filtersOpen" id="recommendation-filters" class="home-filters">
          <label class="form-field">选择性别<select v-model.number="gender" aria-label="推荐性别" @change="load"><option :value="0">不限性别</option><option :value="1">男孩</option><option :value="2">女孩</option></select></label>
          <label class="form-field">现居城市<select v-model="cityId" aria-label="推荐城市" @change="load"><option value="">不限城市</option><option v-for="city in cities" :key="city.id" :value="city.id">{{ city.name }}</option></select></label>
        </div>
        <p v-if="loading" class="home-message" role="status">正在准备今日推荐…</p>
        <div v-else-if="!isLoggedIn" class="home-login-card">
          <van-icon name="shield-o" aria-hidden="true" />
          <h3>登录后查看今日推荐</h3>
          <p>首页可以随时访问<br />孩子资料与推荐内容仅对父母账号开放</p>
          <div class="home-login-actions"><router-link to="/login">登录查看</router-link><router-link to="/register">帮孩子登记</router-link></div>
        </div>
        <div v-else-if="error" class="home-empty"><p role="alert">{{ error }}</p><button type="button" class="secondary-button" @click="load">重新加载</button></div>
        <template v-else-if="feed?.items.length">
          <div class="recommendation-list"><RecommendationCard v-for="profile in feed.items" :key="profile.id" :profile="profile" @view="viewProfile" /></div>
          <p class="home-endnote">已查看今日推荐 · {{ feed.date }}</p>
        </template>
        <div v-else class="home-empty"><van-icon name="friends-o" aria-hidden="true" /><h3>暂时没有符合条件的资料</h3><p>试试其他条件，或稍后再来看看</p><button type="button" class="secondary-button" @click="resetFilters">查看全部推荐</button></div>
      </section>
      <aside v-if="showBanner && isLoggedIn" class="home-guide-banner">
        <button class="banner-close" type="button" aria-label="关闭完善资料提示" @click="bannerDismissed = true">×</button>
        <div><strong>完善孩子资料</strong><p>审核通过后进入推荐</p></div>
        <router-link to="/profile">去完善 <span aria-hidden="true">→</span></router-link>
      </aside>
    </main>
    <van-popup v-model:show="infoOpen" round position="bottom" teleport="body" class="home-popup">
      <section role="dialog" aria-modal="true" :aria-label="info.title" class="home-dialog">
        <button class="dialog-close" type="button" aria-label="关闭说明" @click="infoOpen = false">×</button>
        <h2>{{ info.title }}</h2><p v-for="line in info.lines" :key="line">{{ line }}</p>
        <router-link class="primary-button" :to="info.actionTo" @click="infoOpen = false">{{ info.action }}</router-link>
      </section>
    </van-popup>
  </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { get } from '@/api/request';
import { City } from '@/types/profile';
import { DailyRecommendations } from '@/types/recommendation';
import { useAuthStore } from '@/store/auth';
import RecommendationCard from '@/components/RecommendationCard.vue';
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const isLoggedIn = computed(() => !!auth.token);
const feed = ref<DailyRecommendations>(), cities = ref<City[]>([]);
const keyword = ref(''), gender = ref<number>(), cityId = ref('');
const loading = ref(isLoggedIn.value), error = ref(''), bannerDismissed = ref(false), filtersOpen = ref(false);
const showBanner = computed(() => {
  if (!isLoggedIn.value || bannerDismissed.value || !feed.value) return false;
  const registration = feed.value.registration;
  return !registration.hasProfile || registration.hasChanges || registration.profileStatus !== 2;
});
const infoOpen = ref(false);
const info = ref({ title: '', lines: [] as string[], action: '查看孩子资料', actionTo: '/profile' });
const shortcuts = [{ id: 'intro', label: '平台介绍', icon: 'wap-home' }, { id: 'profile', label: '孩子资料', icon: 'like' }, { id: 'tutorial', label: '新手教程', icon: 'play-circle' }, { id: 'service', label: '人工牵线', icon: 'friends' }];
const statusLabel = computed(() => isLoggedIn.value ? ['待提交', '审核中', '已通过', '需修改'][feed.value?.registration.profileStatus ?? 0] : '登录查看');
let requestVersion = 0;
async function load() {
  if (!isLoggedIn.value) {
    router.push('/login');
    return;
  }
  const version = ++requestVersion;
  loading.value = true; error.value = '';
  try {
    const result = await get<DailyRecommendations>('/api/v1/recommendations', { gender: gender.value, cityId: cityId.value || undefined, keyword: keyword.value.trim() || undefined });
    if (version !== requestVersion) return;
    feed.value = result;
    if (gender.value == null) gender.value = result.targetGender;
  } catch (e: any) { if (version === requestVersion) error.value = e.response?.data?.message || e.message || '暂时无法读取推荐，请重试'; }
  finally { if (version === requestVersion) loading.value = false; }
}
function resetFilters() { gender.value = 0; cityId.value = ''; keyword.value = ''; load(); }
function jumpToRecommendations() { document.getElementById('today-recommendations')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
function openShortcut(id: string) {
  if (id === 'profile') { router.push(isLoggedIn.value ? '/profile' : '/login'); return; }
  const guestAction = id === 'service'
    ? { action: '登录查看', actionTo: '/login' }
    : { action: '帮孩子登记', actionTo: '/register' };
  const content = {
    intro: { title: '父母帮孩子相亲', lines: ['父母登记成年子女的情况，与孩子一起寻找合适的人', '资料通过审核后进入推荐，父母手机号不会展示在推荐卡片上'], ...(isLoggedIn.value ? { action: '完善孩子资料', actionTo: '/profile' } : guestAction) },
    tutorial: { title: '新手登记教程', lines: ['1 · 选择男孩或女孩，填写孩子基本情况', '2 · 一项一项完善资料，修改后自动保存', '3 · 与孩子核对后提交，等待工作人员审核', '4 · 在今日推荐中查看资料，与孩子商量后再了解'], ...(isLoggedIn.value ? { action: '开始完善资料', actionTo: '/profile' } : guestAction) },
    service: { title: '人工牵线', lines: [isLoggedIn.value ? `您的孩子已有 ${feed.value?.matchCount ?? 0} 条人工牵线记录` : '登录后可查看孩子的人工牵线记录', '先完善孩子资料并提交审核，工作人员根据双方情况协助牵线', '请先与孩子沟通意愿，推荐不代表已经建立联系'], ...(isLoggedIn.value ? { action: '查看孩子资料与审核状态', actionTo: '/profile' } : guestAction) },
  };
  info.value = content[id as keyof typeof content]; infoOpen.value = true;
}
function viewProfile(id: string) {
  router.push({ name: 'recommendation-detail', params: { id }, state: { recommendationIds: feed.value?.items.map(item => item.id) || [] } });
}
onMounted(() => {
  if (route.query.filter === '1') filtersOpen.value = true;
  if (isLoggedIn.value) load();
  else loading.value = false;
  get<City[]>('/api/v1/dict/cities').then(result => cities.value = result).catch(() => {});
});
</script>
<style scoped>
.home-page { max-width:660px; margin:auto; font-size:20px; line-height:1.6; background:#f0f1f5; min-height:100dvh; }
.home-header { min-height:80px; display:grid; grid-template-columns:1fr auto 1fr; align-items:center; gap:8px; padding:16px 16px 18px; padding-top:calc(16px + var(--safe-area-top)); background:linear-gradient(110deg,#ffebe6,#fff5e3); }
.home-header h1 { color:#fb566b; font-size:28px; font-weight:800; margin:0; white-space:nowrap; }
.header-register { display:flex; gap:4px; align-items:center; justify-self:start; color:#fff; background:linear-gradient(120deg,#ff7a91,#ff4d69); border-radius:999px; font-size:15px; font-weight:600; padding:8px 10px; white-space:nowrap; }
.header-register > span { font-size:22px; line-height:1; }
.header-account { justify-self:end; width:44px; height:44px; display:grid; place-items:center; font-size:25px; border:1px solid #f0e5de; border-radius:50%; background:#ffffffb0; color:#514543; }
.home-hero { padding:14px 16px 40px; background:linear-gradient(160deg,#ff6876,#ff5368); }
.home-search { display:flex; align-items:center; gap:8px; padding:10px 12px; min-height:60px; background:#e7475c; border-radius:18px; color:#fff; }
.home-search > .van-icon { font-size:27px; flex-shrink:0; }
.home-search input { flex:1; min-width:0; background:transparent; border:0; color:#fff; font:inherit; font-size:18px; padding:4px 0; }
.home-search input::placeholder { color:#ffe2e7; opacity:1; }
.home-search button { min-height:42px; border:0; border-radius:12px; padding:6px 10px; background:#fff; color:#b82241; font:inherit; font-size:16px; font-weight:600; cursor:pointer; }
.home-search input:focus-visible { outline:2px solid #fff; outline-offset:2px; border-radius:4px; }
.home-shortcuts { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; margin-top:20px; }
.home-shortcuts button { display:flex; flex-direction:column; align-items:center; gap:8px; line-height:1.4; border:0; background:none; color:#fff; font:inherit; font-size:18px; font-weight:700; padding:0; min-height:92px; cursor:pointer; white-space:nowrap; }
.shortcut-circle { display:grid; place-items:center; width:58px; height:58px; border-radius:50%; background:#fff9f7; box-shadow:inset 0 -4px 12px #ffdbd9; }
.shortcut-circle .van-icon { font-size:33px; filter:drop-shadow(0 4px 3px #ebafb64d); }
.shortcut-circle.intro { color:#ff5368; }.shortcut-circle.profile { color:#11bba0; }.shortcut-circle.tutorial { color:#ff963f; }.shortcut-circle.service { color:#dc7896; }
.home-content { position:relative; margin-top:-30px; border-radius:30px 30px 0 0; background:#f0f1f5; padding:20px 14px 28px; }
.home-stats { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
.home-stats > * { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; min-height:84px; background:#fff; border:0; border-radius:16px; padding:12px 3px; font:inherit; color:#232323; cursor:pointer; }
.home-stats strong { color:#b04b5e; font-size:20px; font-weight:700; }.home-stats span { font-size:17px; font-weight:700; white-space:nowrap; }.home-stats.is-guest strong { font-size:16px; }
.today-heading { text-align:center; padding:22px 0 18px; }.today-heading h2 { margin:0; font-size:28px; font-weight:800; }.today-heading p { margin:5px 0 0; font-size:18px; color:#767676; }
.today-heading-row { display:flex; align-items:center; justify-content:space-between; gap:8px; }.today-heading-row button { display:flex; align-items:center; gap:4px; min-height:44px; border:0; padding:6px 4px; color:#9b3d50; background:transparent; font:inherit; font-size:17px; cursor:pointer; }.today-recommendations { scroll-margin-top:16px; }.home-filters { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:18px; }.home-filters .form-field { margin:16px 0 0; font-size:18px; font-weight:500; }.home-filters select { font-size:18px; min-height:54px; margin-top:6px; padding-left:12px; }
.recommendation-list { display:grid; gap:18px; }.home-message { text-align:center; padding:30px 0; color:#656565; }.home-empty,.home-login-card { padding:28px 20px; border-radius:24px; background:#fff; text-align:center; }.home-empty > .van-icon,.home-login-card > .van-icon { font-size:44px; color:#f2859c; }.home-empty h3,.home-login-card h3 { font-size:22px; margin:10px 0; }.home-empty p,.home-login-card p { font-size:18px; color:#656565; }.home-login-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:22px; }.home-login-actions a { display:flex; align-items:center; justify-content:center; min-height:54px; border-radius:999px; font-size:18px; font-weight:700; }.home-login-actions a:first-child { color:#fff; background:#ff5266; }.home-login-actions a:last-child { color:#a44254; background:#fff1f3; border:1px solid #ffd1d8; }.home-endnote { margin:24px 0; color:#767676; text-align:center; font-size:16px; }
.has-guide-banner { padding-bottom:132px; }.home-guide-banner { position:fixed; z-index:45; left:50%; transform:translateX(-50%); bottom:calc(104px + var(--safe-area-bottom)); width:min(calc(100% - 28px),632px); display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:0; padding:18px 16px; border-radius:20px; box-shadow:0 8px 24px #a96e2326; color:#fff; background:radial-gradient(circle at 10% 10%,#ffd041,#ffac1f 55%,#ff911f); }.home-guide-banner strong { font-size:22px; font-weight:800; }.home-guide-banner p { font-size:17px; margin:4px 0 0; }.home-guide-banner > a { flex-shrink:0; background:#fff; color:#a85100; border-radius:999px; min-height:48px; padding:8px 14px; font-size:18px; font-weight:700; }.banner-close { position:absolute; top:-18px; right:4px; width:44px; height:44px; background:#92632ebd; color:#fff; border:0; border-radius:50%; font-size:24px; cursor:pointer; }
.home-popup { max-height:85dvh; overflow:auto; font-family:var(--font-sans-cn); }.home-dialog { position:relative; padding:28px 24px calc(28px + var(--safe-area-bottom)); max-width:660px; margin:auto; font-size:20px; line-height:1.7; }.home-dialog h2 { font-size:28px; font-weight:800; margin:0 44px 20px 0; }.home-dialog p { margin:16px 0; }.home-dialog .primary-button { margin-top:28px; text-align:center; }.dialog-close { position:absolute; top:20px; right:20px; min-width:44px; min-height:44px; border:0; border-radius:50%; background:#f4f4f5; color:#656565; font-size:30px; cursor:pointer; }
@media(max-width:350px) { .home-header { padding-left:12px; padding-right:12px; }.home-header h1 { font-size:25px; }.header-register { font-size:13px; padding:8px; }.header-register > span { display:none; }.home-shortcuts button { font-size:16px; }.shortcut-circle { width:52px; height:52px; }.home-content { padding-left:12px; padding-right:12px; }.home-stats span { font-size:15px; }.home-stats strong { font-size:18px; }.today-heading h2 { font-size:26px; }.home-guide-banner { flex-wrap:nowrap; gap:8px; }.home-guide-banner strong { font-size:20px; }.home-guide-banner p { font-size:16px; }.home-guide-banner > a { font-size:17px; padding:8px 10px; }.home-guide-banner > a span { display:none; } }
@media(min-width:600px) { .home-header { padding:24px; }.home-hero { padding:20px 24px 54px; }.home-content { padding:28px 24px; }.home-stats > * { min-height:112px; }.home-stats strong { font-size:26px; }.home-stats span { font-size:20px; } }
</style>
