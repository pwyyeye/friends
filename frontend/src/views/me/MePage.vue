<template>
  <div class="me">
    <div class="card profile-card">
      <div class="avatar">{{ (me?.nickname || '?').charAt(0) }}</div>
      <div class="info">
        <div class="name">{{ me?.nickname || '未设置昵称' }}</div>
        <div class="muted text-sm mono">{{ maskedPhone }}</div>
      </div>
    </div>

    <div class="card">
      <van-cell title="我的介绍人" :value="me?.referrer?.nickname || '无'" is-link @click="onShowReferrer" />
      <van-cell title="我的邀请码" :value="me?.inviteCode" />
      <van-cell title="资料状态" :value="profileLabel(me?.profileStatus)" />
    </div>

    <div class="card">
      <van-cell title="版本" value="v1.0.0" />
      <van-cell title="服务" :value="envNote" />
    </div>

    <div class="actions">
      <van-button block type="danger" plain @click="onLogout">退出登录</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { showDialog, showToast } from 'vant';
import { get } from '@/api/request';
import { useAuthStore } from '@/store/auth';

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

const profileLabel = (s: number | undefined) => {
  if (s === undefined) return '-';
  return ['未提交', '待审核', '已通过', '已驳回'][s] || '-';
};

const onShowReferrer = () => {
  if (!me.value?.referrer) {
    showToast('暂无介绍人');
    return;
  }
  showDialog({
    title: '我的介绍人',
    message: `${me.value.referrer.nickname || '匿名'}（邀请码 ${me.value.referrer.inviteCode}）`,
    showCancelButton: false,
  });
};

const onLogout = () => {
  auth.logout();
  showToast('已退出');
  router.push('/login');
};

onMounted(fetchMe);
</script>

<style scoped>
.me { padding: 12px 0; }
.profile-card {
  display: flex;
  align-items: center;
  gap: 16px;
}
.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  font-weight: 500;
}
.name { font-size: 17px; font-weight: 600; margin-bottom: 4px; }
.actions { padding: 16px; }
</style>