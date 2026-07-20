<template>
  <div class="page">
    <el-row :gutter="16">
      <el-col :span="6" v-for="kpi in kpis" :key="kpi.label">
        <el-card class="kpi-card">
          <div class="kpi-label">{{ kpi.label }}</div>
          <div class="kpi-value mono">{{ kpi.value }}</div>
          <div class="kpi-sub muted text-sm">{{ kpi.sub }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="8">
        <el-card>
          <template #header><span class="card-title">近 7 日新增用户</span></template>
          <div class="big mono">{{ data?.newUsers7d ?? '-' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header><span class="card-title">近 7 日新增牵线</span></template>
          <div class="big mono">{{ data?.newMatches7d ?? '-' }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card>
          <template #header><span class="card-title">注销中账号</span></template>
          <div class="big mono">{{ data?.cancelCount ?? '-' }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 16px">
      <template #header><span class="card-title">系统健康</span></template>
      <div v-loading="healthLoading">
        <div class="health-row">
          <span class="health-label">MySQL</span>
          <el-tag :type="health?.checks?.mysql?.status === 'ok' ? 'success' : 'danger'" size="small">
            {{ health?.checks?.mysql?.status ?? 'unknown' }}
          </el-tag>
          <span class="muted text-sm">{{ health?.checks?.mysql?.latencyMs ?? '-' }} ms</span>
        </div>
        <div class="health-row">
          <span class="health-label">OSS</span>
          <el-tag :type="health?.checks?.oss?.status === 'ok' ? 'success' : health?.checks?.oss?.status === 'skip' ? 'info' : 'danger'" size="small">
            {{ health?.checks?.oss?.status ?? 'unknown' }}
          </el-tag>
          <span class="muted text-sm">{{ health?.checks?.oss?.note ?? '' }}</span>
        </div>
        <div class="health-row">
          <span class="health-label">运行时长</span>
          <span class="mono">{{ Math.floor((health?.uptime ?? 0) / 60) }} 分钟</span>
        </div>
        <div class="health-row">
          <span class="health-label">版本</span>
          <span class="mono">{{ health?.version ?? '-' }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { get } from '@/api/request';

const data = ref<any>(null);
const health = ref<any>(null);
const healthLoading = ref(false);

const fetchDashboard = async () => {
  data.value = await get('/api/v1/admin/stats/dashboard');
};

const fetchHealth = async () => {
  healthLoading.value = true;
  try {
    health.value = await get('/api/v1/admin/health');
  } finally {
    healthLoading.value = false;
  }
};

const kpis = computed(() => [
  { label: '总用户数', value: data.value?.totalUsers ?? '-', sub: `其中介绍人 ${data.value?.totalReferrers ?? 0} 人` },
  { label: '总牵线数', value: data.value?.totalMatches ?? '-', sub: '累计成功撮合' },
  { label: '待审核资料', value: data.value?.pendingProfiles ?? '-', sub: '需处理' },
  { label: '近 30 日新增', value: data.value?.newUsers30d ?? '-', sub: `新牵线 ${data.value?.newMatches30d ?? 0} 条` },
]);

onMounted(() => {
  fetchDashboard();
  fetchHealth();
});
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.card-title { font-weight: 600; }
.kpi-card { height: 120px; }
.kpi-label { color: var(--color-text-secondary); font-size: 13px; margin-bottom: 8px; }
.kpi-value { font-size: 28px; font-weight: 600; color: var(--color-text-primary); }
.kpi-sub { margin-top: 8px; }
.big { font-size: 24px; font-weight: 600; color: var(--color-text-primary); }
.health-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--color-border-light); }
.health-row:last-child { border-bottom: none; }
.health-label { width: 100px; color: var(--color-text-regular); font-size: 13px; }
</style>