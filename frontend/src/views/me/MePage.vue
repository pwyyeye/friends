<template>
  <div class="me-page">
    <header class="me-header"><h1>我的</h1></header>
    <main class="me-content">
      <section class="registration-card" aria-label="孩子登记状态">
        <template v-if="loading"><p role="status">正在读取孩子资料…</p></template>
        <template v-else-if="loadError"><p role="alert">{{ loadError }}</p><button class="primary-button" @click="loadMe">重新加载</button></template>
        <template v-else>
          <h2>{{ registrationTitle }}</h2>
          <p v-if="hasChanges" class="registration-note">资料有新的修改，核对后请再次提交审核</p>
          <router-link class="primary-button registration-action" to="/profile">{{ registrationAction }}</router-link>
        </template>
      </section>
      <section class="function-card" aria-labelledby="common-title">
        <h2 id="common-title">常用功能</h2>
        <nav class="function-grid common-grid" aria-label="常用功能">
          <router-link
            v-for="item in activityLinks"
            :key="item.kind"
            :to="`/activity/${item.kind}`"
          >
            <span class="common-icon" :class="item.kind">
              <van-icon :name="item.icon" aria-hidden="true" />
              <b v-if="item.count">{{ item.count > 99 ? '99+' : item.count }}</b>
            </span>
            <span>{{ item.label }}</span>
          </router-link>
        </nav>
      </section>
      <section class="function-card" aria-labelledby="other-title">
        <h2 id="other-title">其他功能</h2>
        <nav class="function-grid other-grid" aria-label="其他功能">
          <button v-for="item in otherFunctions" :key="item.id" type="button" @click="openPanel(item.id)">
            <span class="other-icon"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="item.path" /></svg></span>
            <span>{{ item.label }}</span>
          </button>
        </nav>
      </section>
    </main>
    <van-popup v-model:show="panelOpen" round position="bottom" teleport="body" class="me-popup">
      <section role="dialog" aria-modal="true" :aria-label="panelTitle" class="me-dialog">
        <header class="panel-heading"><h2>{{ panelTitle }}</h2><button type="button" aria-label="关闭功能面板" @click="panelOpen = false">×</button></header>
        <template v-if="panel === 'preview'">
          <template v-if="me?.childProfile"><p class="panel-note">{{ me.childProfile.profileNumber }} · 当前登记资料</p><ChildProfileSummary :profile="me.childProfile.draft" /></template>
          <p v-else class="panel-note">先登记孩子资料，就可以在这里预览</p>
          <router-link class="primary-button panel-action" to="/profile" @click="panelOpen = false">{{ me?.childProfile ? '查看与完善资料' : '立即登记' }}</router-link>
        </template>
        <template v-else-if="panel === 'invite'">
          <p class="panel-note">邀请其他父母，一起为孩子寻找合适的人</p>
          <div class="invite-code">我的邀请码<strong>{{ invite?.inviteCode || me?.inviteCode || '—' }}</strong></div>
          <div class="qr-frame"><img v-if="qrUrl" :src="qrUrl" alt="邀请其他父母登记的二维码" /><p v-else role="status">{{ inviteLoading ? '正在准备二维码…' : '二维码暂未加载' }}</p></div>
          <p class="panel-note qr-caption">长按二维码保存，或复制链接邀请好友</p>
          <p v-if="inviteError" class="panel-error" role="alert">{{ inviteError }}</p>
          <button v-if="inviteError" class="secondary-button" :disabled="inviteLoading" @click="loadInvite">重新加载邀请信息</button>
          <button class="primary-button" :disabled="!invite?.inviteUrl" @click="copyInvite">复制邀请链接</button>
          <p v-if="message" class="panel-feedback" role="status">{{ message }}</p>
          <p v-if="invite?.inviteUrl" class="invite-url">{{ invite.inviteUrl }}</p>
          <p class="panel-note">邀请码为选填，不影响对方正常登记</p>
          <p v-if="me?.referrer" class="panel-note">邀请来源：{{ me.referrer.nickname }}</p>
          <button class="text-button" :disabled="inviteesLoading" @click="loadInvitees">{{ inviteesLoading ? '正在读取…' : '查看我邀请的父母' }}</button>
          <p v-if="inviteesError" class="panel-error" role="alert">{{ inviteesError }}</p>
          <template v-if="invitees"><p v-if="!invitees.length" class="panel-note">还没有通过此邀请码注册的父母</p><ul v-else class="invitees"><li v-for="parent in invitees" :key="parent.id">{{ parent.nickname || '未填写称呼' }}</li></ul></template>
        </template>
        <template v-else-if="panel === 'status'">
          <div class="status-card"><span>消息提醒</span><strong>{{ notificationsEnabled ? '已开启' : '已关闭' }}</strong></div>
          <label class="notification-switch">
            <span><strong>站内消息提醒</strong><small>审核结果、推荐更新和联系意向会出现在消息中心</small></span>
            <input v-model="notificationsEnabled" type="checkbox" @change="saveNotificationSetting" />
          </label>
          <p class="panel-note">当前版本通过站内消息提醒，不会直接向对方公开父母的联系方式</p>
          <router-link class="primary-button panel-action" to="/messages" @click="panelOpen = false">查看消息中心</router-link>
        </template>
        <template v-else-if="panel === 'verification'">
          <div class="verification-mark"><van-icon name="shield-o" aria-hidden="true" /></div>
          <h3>孩子资料实名核验</h3>
          <p class="panel-note">实名核验用于提升资料可信度，身份信息只用于平台审核，不在推荐卡片中展示</p>
          <ul class="verification-steps">
            <li><span>1</span>核对孩子的姓名和身份信息</li>
            <li><span>2</span>上传必要的核验材料</li>
            <li><span>3</span>工作人员审核后更新认证状态</li>
          </ul>
          <router-link class="primary-button panel-action" to="/profile" @click="panelOpen = false">检查孩子资料</router-link>
        </template>
        <template v-else-if="panel === 'service'">
          <div class="service-symbol"><van-icon name="friends-o" aria-hidden="true" /></div>
          <h3>工作人员协助牵线</h3>
          <p class="panel-note">先完善孩子资料并提交审核，工作人员根据双方情况协助牵线</p>
          <p class="panel-note">请先与孩子沟通意愿，推荐不代表已经建立联系</p>
          <router-link class="primary-button panel-action" to="/profile" @click="panelOpen = false">查看资料与审核状态</router-link>
        </template>
        <template v-else-if="panel === 'safety'">
          <ol class="safety-list"><li v-for="tip in safetyTips" :key="tip.title"><h3>{{ tip.title }}</h3><p>{{ tip.content }}</p></li></ol>
          <button class="primary-button" @click="panelOpen = false">我知道了</button>
        </template>
        <template v-else-if="panel === 'settings'">
          <p class="account-phone">登录手机号 <strong>{{ me?.phone }}</strong></p>
          <form novalidate @submit.prevent="updateName">
            <label class="form-field">父母称呼<input v-model="parentName" maxlength="50" placeholder="例如：林妈妈" autocomplete="nickname" /></label>
            <p class="panel-note">这里修改您的称呼，孩子的称呼在孩子资料中填写</p>
            <p v-if="message" class="panel-feedback" role="status">{{ message }}</p>
            <button class="primary-button" :disabled="accountBusy || !me">{{ accountBusy ? '正在处理…' : '保存称呼' }}</button>
          </form>
          <div class="settings-links"><router-link to="/legal/privacy" @click="panelOpen = false">隐私说明 <span aria-hidden="true">›</span></router-link><router-link to="/legal/terms" @click="panelOpen = false">用户协议 <span aria-hidden="true">›</span></router-link></div>
          <button class="secondary-button" :disabled="accountBusy" @click="logout">退出登录</button>
          <button class="text-button cancel-account" :disabled="accountBusy" @click="cancel">申请注销账号</button>
        </template>
      </section>
    </van-popup>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { get, getRaw, post, put } from '@/api/request';
import { confirmDialog } from '@/utils/toast';
import { useAuthStore } from '@/store/auth';
import { ChildRecord, profileStatuses } from '@/types/profile';
import ChildProfileSummary from '@/components/ChildProfileSummary.vue';
import { useSocialStore } from '@/store/social';
import { useFeaturesStore } from '@/store/features';

type Panel = 'preview' | 'invite' | 'service' | 'status' | 'safety' | 'verification' | 'settings';
const auth = useAuthStore(), router = useRouter();
const social = useSocialStore();
const features = useFeaturesStore();
const me = ref<{ nickname: string; phone: string; inviteCode: string; referrer: { nickname: string } | null; childProfile: ChildRecord | null }>();
const loading = ref(true), loadError = ref(''), panelOpen = ref(false), panel = ref<Panel>('settings');
const parentName = ref(''), message = ref(''), accountBusy = ref(false);
const notificationsEnabled = ref(localStorage.getItem('friends_message_notifications') !== '0');
const invite = ref<{ inviteCode: string; inviteUrl: string }>(), qrUrl = ref(''), inviteLoading = ref(false), inviteError = ref('');
const invitees = ref<{ id: string; nickname: string | null }[] | null>(null), inviteesLoading = ref(false), inviteesError = ref('');
const hasChanges = computed(() => me.value?.childProfile?.submittedRevision != null && me.value.childProfile.draftRevision !== me.value.childProfile.submittedRevision);
const activityLinks = computed(() => {
  const links: {
    kind: 'unlock' | 'favorite' | 'view';
    label: string;
    icon: string;
    count: number;
  }[] = [
    { kind: 'unlock', label: '解锁记录', icon: 'shield-o', count: social.unlocks.length },
    { kind: 'favorite', label: '收藏记录', icon: 'star-o', count: social.favorites.length },
    { kind: 'view', label: '浏览记录', icon: 'eye-o', count: social.views.length },
  ];
  return links.filter(
    (item) =>
      item.kind === 'view' ||
      features.isEnabled(item.kind as 'favorite' | 'unlock'),
  );
});
const registrationTitle = computed(() => !me.value?.childProfile ? '您还未登记孩子的相亲资料' : [
  '孩子的相亲资料还未完成', '孩子的相亲资料正在审核', '孩子的相亲资料已审核通过', '孩子的资料需要补充修改',
][me.value.childProfile.profileStatus]);
const registrationAction = computed(() => !me.value?.childProfile ? '立即登记' : ['继续登记', '查看相亲资料', '查看与完善资料', '修改孩子资料'][me.value.childProfile.profileStatus]);
const otherFunctionItems: {
  id: Panel | 'privacy';
  label: string;
  path: string;
  feature?: 'messages' | 'verification';
}[] = [
  { id: 'invite', label: '邀请好友', path: 'M13 5H5v22h22v-8 M18 5h9v9 M27 5 13 19' },
  { id: 'service', label: '人工牵线', path: 'M6 18v-3a10 10 0 0 1 20 0v3 M6 15H4v9h5v-9H6 M26 15h2v9h-5v-9h3 M26 24v2a3 3 0 0 1-3 3h-7' },
  { id: 'status', label: '通知状态', path: 'M8 23V12a8 8 0 0 1 16 0v11 M5 23h22 M13 27a3 3 0 0 0 6 0', feature: 'messages' },
  { id: 'safety', label: '防骗指南', path: 'M7 4h19v24H7z M13 4v12l4-3 4 3V4' },
  { id: 'verification', label: '实名核验', path: 'M16 3 27 8v8c0 6-5 10-11 13C10 26 5 22 5 16V8z M11 16l4 4 7-8', feature: 'verification' },
  { id: 'settings', label: '设置', path: 'M9 4h14l7 12-7 12H9L2 16z M20 16a4 4 0 1 1-8 0 4 4 0 0 1 8 0' },
];
const otherFunctions = computed(() =>
  otherFunctionItems.filter(
    (item) => !item.feature || features.isEnabled(item.feature),
  ),
);
const panelTitle = computed(() => ({ preview: '孩子资料预览', invite: '邀请好友', service: '人工牵线', status: '通知状态', safety: '防骗指南', verification: '实名核验', settings: '账号设置' })[panel.value]);
const safetyTips = [
  { title: '先核实身份，再深入了解', content: '与孩子一起核对对方情况，初次见面选择公共场所' },
  { title: '涉及转账，请多留心', content: '不要向刚认识的人转账，不参与对方推荐的投资或借贷' },
  { title: '保护好个人信息', content: '不透露密码、短信验证码、银行卡信息，不随意发送证件照片' },
  { title: '与孩子商量后再联系', content: '分享孩子的联系方式、照片和详细资料前，先征得孩子同意' },
];
let disposed = false;
async function loadMe() {
  loading.value = true; loadError.value = '';
  try { me.value = await get<NonNullable<typeof me.value>>('/api/v1/me'); }
  catch { loadError.value = '暂时无法读取账号信息，请重新加载'; }
  finally { loading.value = false; }
}
function openPanel(id: Panel | 'privacy') {
  if (id === 'privacy') { router.push('/legal/privacy'); return; }
  panel.value = id; message.value = ''; panelOpen.value = true;
  if (id === 'settings') parentName.value = me.value?.nickname || '';
  if (id === 'invite' && (!invite.value || !qrUrl.value)) loadInvite();
}
async function saveNotificationSetting() {
  const enabled = notificationsEnabled.value;
  try {
    await social.updateNotifications(enabled);
    message.value = enabled ? '站内消息提醒已开启' : '站内消息提醒已关闭';
  } catch {
    notificationsEnabled.value = !enabled;
    message.value = '通知设置未能保存，请重试';
  }
}
async function loadInvite() {
  if (inviteLoading.value) return;
  inviteLoading.value = true; inviteError.value = '';
  // Retain successful invitation data when only one of the requests fails.
  const results = await Promise.allSettled([
    get<NonNullable<typeof invite.value>>('/api/v1/me/invite-code').then(result => { invite.value = result; }),
    getRaw('/api/v1/me/invite-qrcode').then(blob => {
      if (disposed) return;
      if (qrUrl.value) URL.revokeObjectURL(qrUrl.value);
      qrUrl.value = URL.createObjectURL(blob);
    }),
  ]);
  if (results.some(result => result.status === 'rejected')) inviteError.value = '部分邀请信息未能加载，请重试';
  inviteLoading.value = false;
}
async function loadInvitees() {
  if (inviteesLoading.value) return;
  inviteesLoading.value = true; inviteesError.value = '';
  try { invitees.value = await get<NonNullable<typeof invitees.value>>('/api/v1/me/invites'); }
  catch { inviteesError.value = '暂时无法读取邀请记录，请重试'; }
  finally { inviteesLoading.value = false; }
}
async function copyInvite() {
  if (!invite.value?.inviteUrl) return;
  try { await navigator.clipboard.writeText(invite.value.inviteUrl); message.value = '邀请链接已复制'; }
  catch { message.value = '请长按页面上的邀请链接复制'; }
}
async function updateName() {
  if (accountBusy.value || !me.value) return;
  const nickname = parentName.value.trim();
  if (!nickname) { message.value = '请填写您的称呼'; return; }
  accountBusy.value = true; message.value = '';
  try {
    const result = await put<{ nickname: string }>('/api/v1/me', { nickname });
    me.value.nickname = result.nickname; parentName.value = result.nickname;
    if (auth.user) auth.setAuth(auth.token, { ...auth.user, nickname: result.nickname });
    message.value = '父母称呼已更新';
  } catch { message.value = '称呼未能保存，请重试'; }
  finally { accountBusy.value = false; }
}
async function logout() {
  if (accountBusy.value) return;
  accountBusy.value = true; message.value = '';
  try { await post('/api/v1/auth/logout'); auth.logout(); router.replace('/login'); }
  catch { message.value = '退出登录失败，请重试'; }
  finally { accountBusy.value = false; }
}
async function cancel() {
  if (accountBusy.value) return;
  accountBusy.value = true; message.value = '';
  try {
    const confirmed = await confirmDialog({ title: '申请注销账号', message: '提交后账号将暂停使用，由工作人员处理注销申请', confirmText: '确认申请', cancelText: '暂不注销' });
    if (!confirmed) return;
    await post('/api/v1/account/cancel'); auth.logout(); router.replace('/login');
  } catch { message.value = '注销申请未能提交，请重试'; }
  finally { accountBusy.value = false; }
}
onMounted(async () => {
  await Promise.all([loadMe(), social.hydrate()]);
  if (social.summary) {
    notificationsEnabled.value = social.summary.notificationEnabled;
  }
});
onBeforeUnmount(() => { disposed = true; if (qrUrl.value) URL.revokeObjectURL(qrUrl.value); });
</script>
<style scoped>
.me-page { min-height:calc(100dvh - 110px); background:linear-gradient(180deg,#fff0ed 0,#fff5f4 150px,#f6f6f7 310px); color:#292929; font-size:20px; }
.me-header { max-width:660px; margin:auto; padding:calc(18px + env(safe-area-inset-top)) 20px 18px; }
.me-header h1 { margin:0; font-size:24px; font-weight:700; text-align:center; }
.me-content { max-width:660px; margin:auto; padding:8px 16px 16px; }
.registration-card,.function-card { background:#fff; border-radius:22px; margin-bottom:14px; }
.registration-card { text-align:center; padding:32px 22px 34px; }
.registration-card h2 { margin:0 0 28px; font-size:24px; line-height:1.6; font-weight:750; text-wrap:balance; }
.registration-action { display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#ff7076,#ff4659); min-height:64px; font-size:24px; }
.registration-note { color:#a44254; font-size:18px; margin:-12px 0 22px; }
.function-card { padding:18px 12px 16px; }
.function-card h2 { font-size:22px; margin:0 6px 16px; line-height:1.4; }
.function-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:22px 4px; }
.function-grid a,.function-grid button { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; min-height:84px; padding:4px 0; border:0; border-radius:12px; background:none; color:inherit; text-decoration:none; font:inherit; font-size:20px; line-height:1.35; cursor:pointer; }
.function-grid a:focus-visible,.function-grid button:focus-visible,.panel-heading button:focus-visible { outline:3px solid #be2341; outline-offset:2px; }
.common-grid { color:#682b2c; }
.common-icon { position:relative; display:flex; align-items:center; justify-content:center; width:52px; height:46px; font-size:38px; color:#ff5f66; filter:drop-shadow(0 4px 6px #ff667b45); }
.common-icon :deep(.van-icon) { background:linear-gradient(180deg,#ffaf8d,#ff4b64); background-clip:text; -webkit-text-fill-color:transparent; }
.common-icon.favorite { color:#f36b7e; }
.common-icon.view { color:#ee8b72; }
.common-icon b { position:absolute; top:-4px; right:-7px; min-width:20px; height:20px; display:grid; place-items:center; padding:0 5px; border:2px solid #fff; border-radius:999px; color:#fff; background:#ff5266; font-size:10px; line-height:1; box-shadow:0 2px 6px #b6324940; }
.other-grid { color:#656562; gap:12px 4px; }
.other-icon { position:relative; display:flex; align-items:center; justify-content:center; width:46px; height:42px; }
.other-icon::before { content:''; position:absolute; right:0; bottom:0; width:15px; height:15px; background:#ffe6d2; border-radius:50%; }
.other-icon svg { position:relative; width:36px; height:36px; }
.me-dialog { max-width:660px; margin:auto; padding:22px 24px calc(28px + env(safe-area-inset-bottom)); font-size:20px; line-height:1.65; color:#292929; }
.panel-heading { position:sticky; top:0; z-index:1; background:#fff; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:4px 0; margin-bottom:20px; }
.panel-heading h2 { font-size:26px; margin:0; }
.panel-heading button { flex-shrink:0; width:48px; height:48px; font-size:34px; line-height:1; border:0; border-radius:50%; background:#f6f6f7; color:#656562; cursor:pointer; }
.panel-note { color:#696967; margin:16px 0; font-size:19px; }
.panel-action { display:flex; justify-content:center; align-items:center; margin-top:24px; text-align:center; }
.panel-error,.review-reason { color:#be2341; overflow-wrap:anywhere; }
.panel-feedback { padding:12px 16px; margin-top:18px; border-radius:12px; background:#fff1f3; color:#a12b45; }
.invite-code { text-align:center; font-size:18px; color:#696967; }
.invite-code strong { display:block; color:#be2341; font-size:32px; letter-spacing:4px; }
.qr-frame { display:flex; justify-content:center; align-items:center; min-height:210px; margin:12px auto; max-width:230px; }
.qr-frame img { width:210px; height:210px; max-width:100%; object-fit:contain; }
.qr-caption { text-align:center; }
.invite-url { user-select:text; overflow-wrap:anywhere; padding:12px; border-radius:12px; background:#f6f6f7; font-size:18px; }
.invitees { padding-left:24px; }
.status-card { background:#fff1f3; padding:22px; border-radius:18px; text-align:center; }
.status-card span { display:block; font-size:18px; color:#696967; }
.status-card strong { display:block; font-size:28px; margin-top:8px; color:#be2341; }
.notification-switch { display:flex; align-items:center; justify-content:space-between; gap:16px; margin:20px 0; padding:16px; border:1px solid #f1e7e5; border-radius:16px; background:#fffaf8; }
.notification-switch span { display:flex; min-width:0; flex-direction:column; gap:5px; }
.notification-switch strong { font-size:19px; }
.notification-switch small { color:#7b7170; font-size:16px; line-height:1.5; }
.notification-switch input { width:46px; height:26px; flex-shrink:0; accent-color:#ff5266; }
.verification-mark { display:grid; place-items:center; width:72px; height:72px; margin:4px auto 14px; border-radius:24px; color:#ff5967; background:#fff0f2; font-size:38px; }
.verification-steps { display:grid; gap:12px; margin:20px 0; padding:0; list-style:none; }
.verification-steps li { display:flex; align-items:center; gap:10px; padding:12px; border-radius:14px; background:#fff8f7; font-size:18px; }
.verification-steps span { display:grid; place-items:center; width:28px; height:28px; flex-shrink:0; border-radius:50%; color:#fff; background:#ff6672; font-size:14px; font-weight:700; }
.service-symbol { text-align:center; font-size:54px; color:#ff5266; }
.me-dialog h3 { font-size:22px; margin:12px 0; }
.safety-list { padding-left:24px; }
.safety-list li { padding-left:4px; margin-bottom:24px; }
.safety-list p { color:#696967; margin:8px 0; font-size:19px; }
.account-phone { display:flex; flex-wrap:wrap; justify-content:space-between; gap:6px; font-size:18px; color:#696967; }
.account-phone strong { color:#292929; }
.settings-links { margin:24px 0; }
.settings-links a { display:flex; align-items:center; justify-content:space-between; gap:10px; min-height:64px; border-bottom:1px solid #eee; color:inherit; text-decoration:none; }
.settings-links span { padding-right:8px; font-size:28px; color:#969693; }
.cancel-account { display:block; margin:12px auto 0; font-size:18px; color:#696967; }
@media(max-width:350px) { .me-content { padding-left:12px; padding-right:12px; } .registration-card { padding:28px 18px 30px; } .registration-card h2 { font-size:22px; } .function-card { padding-left:8px; padding-right:8px; } .function-grid a,.function-grid button { font-size:18px; } .me-dialog { padding-left:18px; padding-right:18px; } }
</style>
<style>
.me-popup { max-height:88dvh; overflow-y:auto; background:#fff; }
</style>
