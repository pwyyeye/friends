<template>
  <div class="invite">
    <div class="card">
      <div class="section-title">我的邀请码</div>
      <div class="code mono">{{ code?.inviteCode || '加载中…' }}</div>
      <div class="actions">
        <van-button type="primary" plain size="small" @click="onCopy">复制</van-button>
        <van-button type="primary" size="small" @click="onShare">分享</van-button>
      </div>
      <div class="muted text-sm" style="margin-top: 8px">
        将邀请码分享给朋友，他/她注册时填入即建立邀请关系
      </div>
    </div>

    <div class="card">
      <div class="section-title">我邀请过的人（{{ list.length }}）</div>
      <div v-if="!list.length" class="empty muted">还没有邀请记录</div>
      <div v-for="u in list" :key="u.id" class="invitee">
        <div class="info">
          <div class="name">{{ u.nickname || '未填写' }}</div>
          <div class="muted text-sm">
            {{ u.gender === 1 ? '男' : u.gender === 2 ? '女' : '-' }} ·
            {{ u.age || '?' }} 岁 ·
            资料 {{ profileLabel(u.profileStatus) }}
          </div>
        </div>
        <div class="time muted text-sm">{{ formatTime(u.createdAt) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { showToast, showDialog } from 'vant';
import dayjs from 'dayjs';
import { get } from '@/api/request';

const code = ref<{ inviteCode: string; nickname: string | null; avatarOssKey: string | null } | null>(null);
const list = ref<any[]>([]);

const fetchCode = async () => { code.value = await get('/api/v1/me/invite-code'); };
const fetchList = async () => { list.value = await get('/api/v1/me/invites'); };

const onCopy = async () => {
  if (!code.value?.inviteCode) return;
  try {
    await navigator.clipboard.writeText(code.value.inviteCode);
    showToast('已复制');
  } catch {
    showToast('复制失败，请手动选择');
  }
};

const onShare = () => {
  if (!code.value?.inviteCode) return;
  const text = `我的 Friends 邀请码：${code.value.inviteCode}`;
  if (navigator.share) {
    navigator.share({ title: 'Friends 邀请', text }).catch(() => {});
  } else {
    showDialog({
      title: '分享我的邀请码',
      message: `${text}\n（请复制后分享给好友）`,
      showCancelButton: false,
    });
  }
};

const profileLabel = (s: number) => ['未提交', '待审核', '已通过', '已驳回'][s] || '-';
const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD');

onMounted(() => { fetchCode(); fetchList(); });
</script>

<style scoped>
.invite { padding: 12px 0; }
.section-title { font-size: 15px; font-weight: 600; margin: 0 0 12px; }
.code {
  font-size: 36px;
  font-weight: 600;
  letter-spacing: 4px;
  text-align: center;
  padding: 20px 0;
  color: var(--color-primary);
  background: var(--color-bg-section);
  border-radius: 4px;
}
.actions {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}
.actions > * { flex: 1; }

.invitee {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--color-border-light);
}
.invitee:last-child { border-bottom: none; }
.name { font-size: 14px; color: var(--color-text-primary); font-weight: 500; }

.empty { padding: 20px 0; text-align: center; }
</style>