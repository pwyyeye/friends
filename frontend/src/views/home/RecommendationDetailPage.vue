<template>
  <div class="profile-detail-page">
    <header class="detail-header">
      <button type="button" class="back-button" aria-label="返回今日推荐" @click="returnToRecommendations"><van-icon name="arrow-left" aria-hidden="true" /> 返回</button>
      <h1>相亲资料</h1>
      <span aria-hidden="true" class="header-spacer"></span>
    </header>
    <aside class="detail-notice"><van-icon name="shield-o" aria-hidden="true" /><span>家长代为登记 · 工作人员协助牵线</span></aside>
    <main class="detail-content" :aria-busy="loading">
      <div v-if="loading" class="detail-state" role="status">正在读取相亲资料…</div>
      <div v-else-if="error" class="detail-state"><h2>这份资料暂不可查看</h2><p role="alert">{{ error }}</p><button class="primary-button" @click="load">重新加载</button><button class="text-button" @click="returnToRecommendations">返回今日推荐</button></div>
      <template v-else-if="detail">
        <section class="registrant-card" aria-label="登记及审核信息">
          <span class="registrant-avatar" aria-hidden="true"><van-icon name="contact" /></span>
          <div class="registrant-info"><h2>孩子家长<span>（{{ detail.relationshipLabel }}）</span></h2><p>相亲编号 {{ detail.profileNumber }}</p></div>
          <span class="approval-seal"><span aria-hidden="true">✓</span>资料<br />已审核</span>
        </section>
        <section class="basic-profile" aria-labelledby="basic-profile-title">
          <div class="gender-heading"><h2 id="basic-profile-title" :class="{ 'is-boy': detail.gender === 1 }">{{ detail.gender === 1 ? '男' : '女' }} · {{ detail.birthYear.slice(-2) }}年</h2><div class="profile-actions"><button v-if="features.isEnabled('favorite')" type="button" class="favorite-button" :class="{ active: isFavorite }" :aria-label="isFavorite ? '取消收藏资料' : '收藏资料'" @click="toggleFavorite"><van-icon :name="isFavorite ? 'star' : 'star-o'" aria-hidden="true" />{{ isFavorite ? '已收藏' : '收藏' }}</button><button type="button" class="share-button" aria-label="复制相亲资料链接" @click="share"><van-icon name="share-o" aria-hidden="true" />{{ copied ? '已复制' : '转发' }}</button></div></div>
          <p v-if="shareMessage" class="share-feedback" role="status">{{ shareMessage }}</p>
          <dl class="basic-grid">
            <div><dt>年龄</dt><dd>{{ detail.age }}岁</dd></div>
            <div><dt>身高</dt><dd>{{ detail.height }}<small>cm</small></dd></div>
            <div><dt>学历</dt><dd>{{ detail.educationLabel || '未填写' }}</dd></div>
            <div class="income-row"><dt>收入</dt><dd>{{ incomeText }}</dd></div>
            <div class="full-row"><dt>职业</dt><dd>{{ detail.occupation || '未填写' }}</dd></div>
            <div class="full-row"><dt>现居</dt><dd>{{ detail.cityName || '未填写' }}</dd></div>
            <div class="full-row"><dt>家乡</dt><dd>{{ detail.hometownCityName || '未填写' }}</dd></div>
            <div class="full-row"><dt>工作地</dt><dd>{{ detail.workCityName || '未填写' }}</dd></div>
            <div><dt>婚姻</dt><dd>{{ detail.maritalStatusLabel || '未填写' }}</dd></div>
            <div><dt>购车</dt><dd>{{ detail.carStatusLabel || '未填写' }}</dd></div>
          </dl>
        </section>
        <section class="detail-section" aria-labelledby="photos-title"><h2 id="photos-title">孩子照片<span>隐私保护中</span></h2>
          <div v-if="detail.photoUrls.length" class="protected-photos"><figure v-for="(url, index) in detail.photoUrls" :key="index"><img :src="url" alt="孩子照片模糊预览" /><figcaption><van-icon name="lock" aria-hidden="true" />照片保护中</figcaption></figure></div>
          <p v-else class="section-empty">家长暂未上传孩子照片</p>
          <p class="photo-note">照片以模糊预览展示，进一步了解请与孩子商量后由工作人员协助</p>
        </section>
        <section class="detail-section" aria-labelledby="traits-title"><h2 id="traits-title">性格与优势</h2><div v-if="tags.length" class="detail-tags"><span v-for="tag in tags" :key="tag">{{ tag }}</span></div><p v-else class="section-empty">家长暂未填写性格与优势</p></section>
        <section class="detail-section" aria-labelledby="intro-title"><h2 id="intro-title">孩子介绍</h2><p class="profile-introduction">{{ detail.introduction || '家长暂未填写孩子介绍' }}</p></section>
        <section class="detail-section" aria-labelledby="preference-title"><h2 id="preference-title">择偶期待</h2><dl class="preference-list">
          <div><dt>出生年份</dt><dd>{{ range(detail.preference.birthYearMin, detail.preference.birthYearMax, '年') }}</dd></div>
          <div><dt>身高要求</dt><dd>{{ range(detail.preference.heightMin, detail.preference.heightMax, 'cm') }}</dd></div>
          <div><dt>学历要求</dt><dd>{{ detail.preference.educationLabel ? detail.preference.educationLabel + '及以上' : '不限' }}</dd></div>
          <div><dt>现居城市</dt><dd>{{ detail.preference.cityName || '不限' }}</dd></div>
        </dl><div v-if="detail.preference.tags.length" class="detail-tags"><span v-for="tag in detail.preference.tags" :key="tag">{{ tag }}</span></div></section>
        <p class="detail-endnote">资料已通过审核，推荐不代表已经建立联系</p>
      </template>
    </main>
    <footer class="detail-footer">
      <div class="detail-actions"><button class="return-action" type="button" @click="returnToRecommendations"><van-icon name="wap-home-o" aria-hidden="true" />返回推荐</button><button v-if="features.isEnabled('unlock')" class="match-action" type="button" :disabled="loading || !detail" @click="serviceOpen = true"><van-icon name="friends-o" aria-hidden="true" />了解牵线</button></div>
      <nav v-if="navigationIds.length > 1" class="profile-navigation" aria-label="切换推荐资料"><button type="button" :disabled="loading || currentIndex <= 0" @click="switchProfile(-1)"><span aria-hidden="true">←</span> 上一位</button><span class="profile-position">{{ currentIndex < 0 ? '—' : currentIndex + 1 }} / {{ navigationIds.length }}</span><button type="button" :disabled="loading || currentIndex < 0 || currentIndex >= navigationIds.length - 1" @click="switchProfile(1)">下一位 <span aria-hidden="true">→</span></button></nav>
    </footer>
    <van-popup v-model:show="serviceOpen" position="bottom" round teleport="body" class="detail-service-popup"><section role="dialog" aria-modal="true" aria-label="人工牵线说明" class="service-dialog"><header><h2>申请了解</h2><button type="button" aria-label="关闭牵线说明" @click="serviceOpen = false">×</button></header><p>您正在了解 {{ detail?.profileNumber }} 的相亲资料</p><p>请先与孩子沟通意愿，完善自己孩子的资料并提交审核，工作人员根据双方情况协助牵线</p><p class="service-note">提交后会记录了解意向，再由工作人员联系双方，不会直接公开联系方式</p><button class="primary-button interest-button" type="button" :disabled="isUnlocked" @click="recordInterest">{{ isUnlocked ? '已记录了解意向' : '记录了解意向' }}</button><router-link class="text-button profile-link" to="/profile" @click="serviceOpen = false">查看自己孩子的资料</router-link></section></van-popup>
  </div>
</template>
<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { get } from '@/api/request';
import { RecommendationDetail } from '@/types/recommendation';
import { useSocialStore } from '@/store/social';
import { useFeaturesStore } from '@/store/features';
import { successToast } from '@/utils/toast';

const route = useRoute(), router = useRouter();
const social = useSocialStore();
const features = useFeaturesStore();
const detail = ref<RecommendationDetail>(), loading = ref(true), error = ref('');
const serviceOpen = ref(false), copied = ref(false), shareMessage = ref('');
const navigationIds = ref<string[]>([]);
const currentIndex = computed(() => navigationIds.value.indexOf(String(route.params.id)));
const tags = computed(() => [...new Set([...(detail.value?.traits || []), ...(detail.value?.advantages || [])])]);
const incomeText = computed(() => detail.value?.incomeLabel?.replace(/至/g, '–').replace(/\s/g, '') || '未填写');
const isFavorite = computed(() => !!detail.value && social.isFavorite(detail.value.id));
const isUnlocked = computed(() => !!detail.value && social.unlocks.includes(detail.value.id));
let requestVersion = 0;
function readNavigation() {
  const ids: unknown = window.history.state?.recommendationIds;
  navigationIds.value = Array.isArray(ids) ? [...new Set(ids.filter((id): id is string => typeof id === 'string' && /^\d+$/.test(id)))].slice(0, 24) : [];
}
async function load() {
  const version = ++requestVersion;
  const id = String(route.params.id);
  detail.value = undefined; loading.value = true; error.value = ''; copied.value = false; shareMessage.value = ''; serviceOpen.value = false;
  readNavigation();
  if (!/^\d+$/.test(id)) { error.value = '资料编号无效，请返回推荐重新选择'; loading.value = false; return; }
  try {
    const result = await get<RecommendationDetail>(`/api/v1/recommendations/${id}`);
    if (version === requestVersion) {
      detail.value = result;
      social.remember(result);
      social.record('view', result.id);
    }
  } catch (e: any) {
    if (version === requestVersion) error.value = e.response?.data?.message || e.message || '请稍后重试，或返回推荐查看其他资料';
  } finally { if (version === requestVersion) loading.value = false; }
}
function returnToRecommendations() {
  if (window.history.state?.back === '/home') router.back();
  else router.push('/home');
}
function switchProfile(offset: number) {
  if (loading.value || currentIndex.value < 0) return;
  const id = navigationIds.value[currentIndex.value + offset];
  if (id) router.replace({ name: 'recommendation-detail', params: { id }, state: { recommendationIds: [...navigationIds.value] } });
}
async function share() {
  try { await navigator.clipboard.writeText(window.location.href); copied.value = true; shareMessage.value = '资料链接已复制，可转发给家人一起了解，查看需登录'; }
  catch { shareMessage.value = '请复制浏览器地址，转发给家人一起了解，查看需登录'; }
}
function toggleFavorite() {
  if (!detail.value) return;
  const saved = social.toggleFavorite(detail.value);
  successToast(saved ? '已收藏这份资料' : '已取消收藏');
}
function recordInterest() {
  if (!detail.value || isUnlocked.value) return;
  social.record('unlock', detail.value.id);
  successToast('已记录了解意向');
  serviceOpen.value = false;
}
function range(min: number | null, max: number | null, unit: string) {
  if (min == null && max == null) return '不限';
  if (min != null && max != null) return `${min}–${max}${unit}`;
  return min != null ? `${min}${unit}及以上` : `${max}${unit}及以下`;
}
watch(() => route.params.id, load, { immediate: true });
onBeforeUnmount(() => { requestVersion++; });
</script>
<style scoped>
.profile-detail-page { min-height:100dvh; padding-bottom:calc(174px + var(--safe-area-bottom)); font-size:20px; line-height:1.6; background:linear-gradient(180deg,#ffe0b8 0,#fff1e4 300px,#fff 600px); color:#242424; }
.detail-header { display:grid; grid-template-columns:90px minmax(0,1fr) 90px; align-items:center; gap:8px; max-width:720px; margin:auto; padding:calc(14px + var(--safe-area-top)) 16px 16px; }
.detail-header h1 { margin:0; font-size:26px; text-align:center; font-weight:800; white-space:nowrap; }
.back-button { display:flex; align-items:center; justify-content:center; gap:4px; min-height:48px; border:0; border-radius:999px; color:#242424; background:#ffffffb8; font:inherit; font-size:19px; cursor:pointer; }
.detail-notice { display:flex; align-items:center; justify-content:center; gap:8px; padding:14px 16px; background:#fff8f1; color:#8b5a48; font-size:18px; font-weight:600; }
.detail-notice .van-icon { font-size:24px; color:#ff626d; }
.detail-content { max-width:720px; margin:auto; padding:16px 18px 28px; }
.registrant-card { position:relative; display:flex; align-items:center; gap:12px; border-radius:22px; background:#fffaf6e6; padding:20px 16px; overflow:hidden; }
.registrant-avatar { display:grid; place-items:center; flex-shrink:0; width:54px; height:54px; border-radius:50%; background:#ffdfc9; color:#ac633d; font-size:34px; }
.registrant-info { position:relative; z-index:1; min-width:0; flex:1; padding-right:50px; }
.registrant-info h2 { margin:0 0 6px; font-size:22px; line-height:1.5; font-weight:800; }
.registrant-info h2 span { display:inline-block; font-size:18px; }
.registrant-info p { margin:0; color:#77706a; font-size:17px; overflow-wrap:anywhere; }
.approval-seal { position:absolute; top:16px; right:-8px; width:78px; height:78px; display:flex; flex-direction:column; align-items:center; justify-content:center; border:3px double #e6a4a0; border-radius:50%; color:#c76768; font-size:16px; font-weight:700; line-height:1.15; transform:rotate(-13deg); opacity:.8; }
.approval-seal > span { font-size:20px; margin-bottom:2px; }
.basic-profile { padding:24px 6px 18px; }
.gender-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:24px; }
.gender-heading h2 { font-size:38px; font-weight:800; line-height:1.3; color:#fa596e; margin:0; }
.gender-heading h2.is-boy { color:#287fde; }
.profile-actions { display:flex; align-items:center; gap:8px; flex-shrink:0; }
.favorite-button { display:flex; align-items:center; justify-content:center; gap:5px; padding:10px 13px; min-height:52px; border:1px solid #ffd1d6; border-radius:999px; background:#fff4f5; color:#bb4356; font:inherit; font-size:18px; font-weight:700; cursor:pointer; }
.favorite-button.active { color:#fff; background:#ff5967; border-color:#ff5967; }
.share-button { display:flex; align-items:center; justify-content:center; gap:6px; flex-shrink:0; padding:10px 16px; min-height:52px; border:1px solid #b9decf; border-radius:999px; background:#d8f7e8; color:#188557; font:inherit; font-size:20px; font-weight:700; cursor:pointer; }
.share-button .van-icon { font-size:23px; }
.share-feedback { margin:0 0 18px; color:#188557; font-size:18px; }
.basic-grid { display:grid; grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr); gap:20px 14px; margin:0; font-size:22px; }
.basic-grid > div,.preference-list > div { display:flex; align-items:baseline; gap:12px; }
.basic-grid .full-row { grid-column:1 / -1; }
.basic-grid dt { color:#8c8887; flex-shrink:0; font-size:20px; }
.basic-grid dd { margin:0; font-weight:750; overflow-wrap:anywhere; line-height:1.55; }
.basic-grid dd small { font-size:16px; margin-left:2px; }
.basic-grid .income-row dd { font-size:20px; }
.detail-section { padding:24px 6px; border-top:1px solid #eee6df; }
.detail-section h2 { display:flex; align-items:baseline; justify-content:space-between; flex-wrap:wrap; gap:6px 10px; font-size:25px; margin:0 0 20px; font-weight:800; }
.detail-section h2 span { font-size:17px; font-weight:500; color:#8a7771; }
.protected-photos { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; }
.protected-photos figure { position:relative; margin:0; min-height:190px; border-radius:16px; background:#f4e9e1; overflow:hidden; }
.protected-photos img { position:absolute; width:100%; height:100%; object-fit:cover; filter:blur(10px); transform:scale(1.15); }
.protected-photos figcaption { position:absolute; bottom:0; left:0; right:0; display:flex; align-items:center; justify-content:center; gap:5px; padding:12px 6px; background:#fffffff0; color:#786861; font-size:18px; }
.section-empty { padding:20px 14px; border-radius:16px; background:#faf5f1; color:#8a7771; margin:0; font-size:19px; text-align:center; }
.photo-note,.detail-endnote { font-size:18px; color:#8a7771; margin:16px 0 0; }
.detail-tags { display:flex; flex-wrap:wrap; gap:10px; }
.detail-tags span { background:#fff0f2; color:#b5455b; padding:7px 12px; border-radius:10px; font-size:19px; }
.profile-introduction { margin:0; white-space:pre-wrap; overflow-wrap:anywhere; font-size:21px; line-height:1.8; }
.preference-list { display:grid; gap:16px; margin:0 0 20px; font-size:20px; }
.preference-list dt { flex-shrink:0; min-width:80px; color:#8c8887; }
.preference-list dd { margin:0; font-weight:650; overflow-wrap:anywhere; }
.detail-endnote { padding:0 6px; }
.detail-state { padding:36px 20px; border-radius:22px; background:#fff; text-align:center; color:#786861; }
.detail-state h2 { font-size:24px; color:#242424; }
.detail-state .primary-button { margin-top:24px; }
.detail-footer { position:fixed; bottom:0; left:0; right:0; z-index:60; background:#fff; box-shadow:0 -8px 24px #8953370a; padding-bottom:var(--safe-area-bottom); }
.detail-actions { display:grid; grid-template-columns:repeat(auto-fit,minmax(0,1fr)); gap:12px; max-width:720px; padding:14px 18px; margin:auto; }
.detail-actions button { display:flex; align-items:center; justify-content:center; gap:8px; border:1px solid #e79ca6; border-radius:999px; min-height:64px; font:inherit; font-size:22px; font-weight:700; cursor:pointer; }
.return-action { background:#fff5f6; color:#cf5268; }
.detail-actions .match-action { background:#ff5266; color:#fff; border-color:#ff5266; }
.profile-navigation { display:grid; grid-template-columns:1fr auto 1fr; gap:12px; align-items:center; padding:8px max(18px,calc((100vw - 684px) / 2)); background:#25201f; color:#fff; }
.profile-navigation button { min-height:50px; border:0; background:transparent; color:inherit; font:inherit; font-size:21px; font-weight:650; cursor:pointer; }
.profile-navigation button:disabled { opacity:.4; cursor:default; }
.profile-position { font-size:17px; color:#d0bbb5; }
.detail-service-popup { max-height:85dvh; overflow:auto; }
.service-dialog { max-width:660px; margin:auto; padding:24px 24px calc(28px + var(--safe-area-bottom)); font-size:20px; line-height:1.7; }
.service-dialog header { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.service-dialog h2 { margin:0; font-size:28px; }
.service-dialog header button { min-width:48px; min-height:48px; border:0; border-radius:50%; background:#f6f6f7; color:#656565; font-size:32px; cursor:pointer; }
.service-note { font-size:18px; color:#8a7771; }
.service-dialog .primary-button { display:flex; justify-content:center; align-items:center; margin-top:24px; text-align:center; }
.interest-button { width:100%; border:0; cursor:pointer; }
.profile-link { display:block; margin-top:14px; text-align:center; }
.profile-detail-page button:focus-visible { outline:3px solid #b82242; outline-offset:3px; }
@media(max-width:430px) { .profile-actions { flex-direction:column; gap:6px; } .favorite-button,.share-button { min-height:44px; font-size:16px; padding:8px 11px; } }
@media(max-width:350px) { .detail-header { grid-template-columns:76px minmax(0,1fr) 76px; padding-left:12px; padding-right:12px; } .detail-header h1 { font-size:24px; } .detail-content { padding-left:14px; padding-right:14px; } .registrant-card { gap:10px; padding:18px 12px; } .registrant-avatar { width:44px; height:44px; font-size:28px; } .registrant-info { padding-right:40px; } .registrant-info h2 { font-size:20px; } .registrant-info p { font-size:16px; } .approval-seal { width:64px; height:64px; font-size:14px; } .gender-heading h2 { font-size:34px; } .share-button { font-size:16px; padding:8px 10px; } .basic-grid { grid-template-columns:minmax(0,1fr); font-size:22px; gap:16px; } .detail-actions { padding:12px; gap:8px; } .detail-actions button { font-size:20px; gap:5px; } .profile-navigation { padding-left:12px; padding-right:12px; gap:6px; } .profile-navigation button { font-size:19px; } .protected-photos figure { min-height:165px; } }
</style>
