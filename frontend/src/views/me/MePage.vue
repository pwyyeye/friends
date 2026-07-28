<template>
  <div class="me">
    <!-- 用户头像卡：暖色背景 + 圆角 -->
    <section class="me__profile">
      <div class="me__profile-bg"></div>
      <div class="me__profile-content">
        <div class="me__avatar">{{ (me?.nickname || '?').charAt(0) }}</div>
        <div class="me__info">
          <div class="me__name serif">{{ me?.nickname || '未设置昵称' }}</div>
          <div class="me__phone mono">{{ maskedPhone }}</div>
        </div>
      </div>
    </section>

    <!-- 资料状态卡（按 profileStatus） -->
    <section class="card">
      <header class="me__section-head">
        <h3 class="section-title section-title--sm">资料</h3>
      </header>
      <StatusBanner
        v-if="me?.profileStatus === 2"
        variant="approved"
        title="已通过审核"
        description="你的资料已经入池，等待被牵线"
      />
      <StatusBanner
        v-else-if="me?.profileStatus === 1"
        variant="pending"
        title="审核中"
        description="审核通常 1 个工作日内完成"
      />
      <StatusBanner
        v-else-if="me?.profileStatus === 3"
        variant="rejected"
        title="已驳回"
        :description="me.latestReject?.reason || '请修改后重新提交'"
      />
      <StatusBanner
        v-else
        variant="info"
        title="资料未提交"
        description="到「资料」填写完整资料以开启牵线"
      />
    </section>

    <!-- 关系链 -->
    <section class="card">
      <header class="me__section-head">
        <h3 class="section-title section-title--sm">关系链</h3>
      </header>
      <CellItem
        icon="<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M16 11a4 4 0 1 0-4-4'/><path d='M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8'/><path d='M19 9l2 2-2 2'/></svg>"
        title="我的介绍人"
        :value="me?.referrer?.nickname || '无'"
        clickable
        @click="onShowReferrer"
      />
      <CellItem
        icon="<svg viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path d='M16 6l-8 6 8 6'/><circle cx='19' cy='12' r='2'/><circle cx='5' cy='12' r='2'/></svg>"
        title="我的邀请码"
        :value="me?.inviteCode || '-'"
        clickable
        @click="onShowInvite"
      />
    </section>

    <!-- 关于 -->
    <section class="card">
      <header class="me__section-head">
        <h3 class="section-title section-title--sm">关于</h3>
      </header>
      <CellItem title="版本" value="v1.0.0" />
      <CellItem title="环境" :value="envNote" />
    </section>

    <div class="me__actions">
      <van-button block plain type="danger" class="me__logout" @click="onLogout">
        退出登录
      </van-button>
    </div>

    <p class="me__slogan serif">用 一 段 对 的 人 ，开 启 一 段 对 的 关 系</p>

    <!-- 推广二维码弹窗 -->
    <van-popup
      v-model:show="inviteOpen"
      round
      position="bottom"
      :style="{ padding: '20px 18px 24px' }"
      closeable
    >
      <div v-if="inviteLoading" class="invite-loading">
        <van-loading size="24" />
      </div>
      <template v-else-if="inviteInfo">
        <h3 class="invite-title serif">我的推广码</h3>
        <p class="invite-sub">扫码注册即可成为你的邀请用户</p>
        <div class="invite-qr">
          <img v-if="inviteQrUrl" :src="inviteQrUrl" alt="推广二维码" />
        </div>
        <p class="invite-code mono">邀请码 <b>{{ inviteInfo.inviteCode }}</b></p>
        <p class="invite-link mono">{{ inviteInfo.inviteUrl }}</p>
        <van-button
          v-if="inviteInfo.inviteUrl"
          block
          type="primary"
          class="invite-copy"
          @click="onCopyLink"
        >
          复制推广链接
        </van-button>
      </template>
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { toast, successToast, infoDialog } from '@/utils/toast';
import { get, getRaw } from '@/api/request';
import { useAuthStore } from '@/store/auth';
import StatusBanner from '@/components/StatusBanner.vue';
import CellItem from '@/components/CellItem.vue';

const router = useRouter();
const auth = useAuthStore();
const me = ref<any>(null);

const fetchMe = async () => { me.value = await get('/api/v1/me'); };

const maskedPhone = computed(() => {
  const p = me.value?.phone as string | undefined;
  if (!p || p.length < 7) return '-';
  return p.slice(0, 3) + '****' + p.slice(-4);
});

const envNote = computed(() => (location.hostname === 'localhost' ? '本地开发' : '生产环境'));

const onShowReferrer = () => {
  if (!me.value?.referrer) {
    toast('暂无介绍人');
    return;
  }
  infoDialog({
    title: '我的介绍人',
    message: `${me.value.referrer.nickname || '匿名'}（邀请码 ${me.value.referrer.inviteCode}）`,
  });
};

// ===== 推广二维码弹窗 =====
const inviteOpen = ref(false);
const inviteLoading = ref(false);
const inviteInfo = ref<{ inviteCode: string; inviteUrl: string } | null>(null);
const inviteQrUrl = ref('');
let qrObjectUrl = '';
const loadInvite = async () => {
  inviteLoading.value = true;
  try {
    const info = await get<{ inviteCode: string; inviteUrl: string }>('/api/v1/me/invite-code');
    inviteInfo.value = {
      inviteCode: info.inviteCode,
      inviteUrl: info.inviteUrl ?? '',
    };
    const blob = await getRaw('/api/v1/me/invite-qrcode', { responseType: 'blob' });
    if (qrObjectUrl) URL.revokeObjectURL(qrObjectUrl);
    qrObjectUrl = URL.createObjectURL(blob);
    inviteQrUrl.value = qrObjectUrl;
  } catch (e) {
    toast('加载推广码失败');
  } finally {
    inviteLoading.value = false;
  }
};
const onShowInvite = () => {
  inviteOpen.value = true;
  if (!inviteInfo.value) loadInvite();
};
const onCopyLink = async () => {
  if (!inviteInfo.value?.inviteUrl) return;
  try {
    await navigator.clipboard.writeText(inviteInfo.value.inviteUrl);
    successToast('已复制推广链接');
  } catch {
    toast('复制失败，请手动复制');
  }
};

onBeforeUnmount(() => {
  if (qrObjectUrl) URL.revokeObjectURL(qrObjectUrl);
});

const onLogout = () => {
  auth.logout();
  successToast('已退出');
  router.push('/login');
};

onMounted(fetchMe);
</script>

<style scoped>
.me { padding: 16px 16px 0; }

/* —— 用户头像卡 ——————————————————————————————— */
.me__profile {
  position: relative;
  border-radius: var(--radius-xl);
  overflow: hidden;
  padding: 20px;
  margin-bottom: var(--space-4);
  box-shadow: var(--shadow-sm);
}
.me__profile-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 20% 0%, rgba(217, 119, 6, 0.45) 0%, transparent 50%),
    linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-deep) 100%);
}
.me__profile-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--space-4);
  z-index: 1;
}
.me__avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(8px);
}
.me__info { color: #fff; }
.me__name {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-bottom: 4px;
}
.me__phone {
  font-size: var(--font-size-sm);
  opacity: 0.85;
  letter-spacing: 1px;
}

/* —— section head ————————————————————————————— */
.me__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}
.me__section-head :deep(.section-title) { margin: 0; }

/* —— 退出 ————————————————————————————————— */
.me__actions {
  margin-top: var(--space-6);
}
.me__logout {
  height: 48px;
  background: #fff;
  border: 1px solid #f3c8c8;
  color: var(--color-danger);
  border-radius: var(--radius-md);
}
.me__slogan {
  margin-top: var(--space-6);
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  letter-spacing: 4px;
}

/* —— 推广二维码弹窗 ————————————————————————— */
.invite-title {
  text-align: center;
  margin: 0 0 4px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 1px;
}
.invite-sub {
  text-align: center;
  margin: 0 0 16px;
  font-size: 12px;
  color: var(--color-text-muted);
}
.invite-loading {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}
.invite-qr {
  display: flex;
  justify-content: center;
  margin-bottom: 16px;
}
.invite-qr img {
  width: 220px;
  height: 220px;
  border-radius: 8px;
  border: 1px solid var(--color-border-light);
  background: #fff;
}
.invite-code {
  text-align: center;
  margin: 0 0 6px;
  font-size: 14px;
  color: var(--color-text-secondary);
}
.invite-code b { color: var(--color-primary); font-size: 16px; margin-left: 4px; }
.invite-link {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0 0 16px;
  word-break: break-all;
  padding: 0 8px;
}
.invite-copy {
  height: 44px;
  border-radius: var(--radius-md);
}
</style>
