<template>
  <div class="dashboard">
    <!-- 顶部欢迎条 -->
    <div class="hero">
      <div class="hero-left">
        <div class="hero-title">{{ greeting }}，{{ auth.admin?.username || '管理员' }}</div>
        <div class="hero-sub">{{ todayText }} · 今天又是高效的一天 🎯</div>
      </div>
      <div class="hero-actions">
        <el-button type="primary" :icon="Plus" @click="$router.push('/profiles')">去审核资料</el-button>
        <el-button :icon="User" @click="$router.push('/users')">查看用户</el-button>
      </div>
    </div>

    <!-- KPI 卡片 -->
    <el-row :gutter="16" class="kpi-row">
      <el-col :xs="24" :sm="12" :md="6" v-for="kpi in kpis" :key="kpi.key">
        <div class="kpi-card" :class="`tone-${kpi.tone}`">
          <div class="kpi-icon"><el-icon><component :is="kpi.icon" /></el-icon></div>
          <div class="kpi-body">
            <div class="kpi-label">{{ kpi.label }}</div>
            <div class="kpi-value tabular">{{ kpi.value }}</div>
            <div class="kpi-sub">{{ kpi.sub }}</div>
          </div>
          <div class="kpi-bar" :class="`bar-${kpi.tone}`"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 关键指标 + 系统健康 -->
    <el-row :gutter="16" class="row-mid">
      <el-col :xs="24" :md="16">
        <el-card class="panel">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">本周增长</span>
              <span class="muted text-sm">近 7 日</span>
            </div>
          </template>
          <div class="metric-grid">
            <div class="metric">
              <div class="metric-label">新增用户</div>
              <div class="metric-value tabular">{{ data?.newUsers7d ?? '-' }}</div>
              <div class="metric-bar"><span :style="{ width: userBarWidth }"></span></div>
            </div>
            <div class="metric">
              <div class="metric-label">新增牵线</div>
              <div class="metric-value tabular">{{ data?.newMatches7d ?? '-' }}</div>
              <div class="metric-bar match"><span :style="{ width: matchBarWidth }"></span></div>
            </div>
            <div class="metric">
              <div class="metric-label">注销中账号</div>
              <div class="metric-value tabular">{{ data?.cancelCount ?? '-' }}</div>
              <div class="metric-bar warn"><span :style="{ width: cancelBarWidth }"></span></div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="8">
        <el-card class="panel health-panel" v-loading="healthLoading">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">系统健康</span>
              <el-tag :type="overallHealth" size="small" effect="plain" round>
                {{ healthOk ? '正常' : '异常' }}
              </el-tag>
            </div>
          </template>
          <div class="health-list">
            <div class="health-item">
              <div class="dot" :class="dotClass(health?.checks?.mysql?.status)"></div>
              <span class="health-name">MySQL</span>
              <span class="health-meta tabular">{{ health?.checks?.mysql?.latencyMs ?? '-' }} ms</span>
            </div>
            <div class="health-item">
              <div class="dot" :class="dotClass(health?.checks?.oss?.status)"></div>
              <span class="health-name">OSS</span>
              <span class="health-meta">{{ health?.checks?.oss?.note || '-' }}</span>
            </div>
            <div class="health-item">
              <div class="dot tone-success"></div>
              <span class="health-name">运行时长</span>
              <span class="health-meta tabular">{{ Math.floor((health?.uptime ?? 0) / 60) }} 分钟</span>
            </div>
            <div class="health-item">
              <div class="dot tone-info"></div>
              <span class="health-name">版本</span>
              <span class="health-meta tabular">{{ health?.version ?? '-' }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-card class="panel shortcuts">
      <template #header>
        <div class="panel-header">
          <span class="panel-title">快捷入口</span>
          <span class="muted text-sm">常用模块直达</span>
        </div>
      </template>
      <div class="shortcut-grid">
        <div
          v-for="s in shortcuts"
          :key="s.path"
          class="shortcut"
          :class="`tone-${s.tone}`"
          @click="$router.push(s.path)"
        >
          <div class="shortcut-icon"><el-icon><component :is="s.icon" /></el-icon></div>
          <div class="shortcut-name">{{ s.title }}</div>
          <div class="shortcut-desc">{{ s.desc }}</div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import { Plus, User, DataAnalysis, UserFilled, Document, Connection, Tickets } from '@element-plus/icons-vue';
import { get } from '@/api/request';
import { useAuthStore } from '@/store/auth';

const auth = useAuthStore();
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

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return '夜深了';
  if (h < 11) return '早上好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
});

const todayText = computed(() => dayjs().format('YYYY年M月D日 dddd'));

const kpis = computed(() => [
  { key: 'users',    label: '总用户数',  value: data.value?.totalUsers ?? '-',     sub: `其中介绍人 ${data.value?.totalReferrers ?? 0} 人`, icon: UserFilled,    tone: 'primary' },
  { key: 'matches',  label: '总牵线数',  value: data.value?.totalMatches ?? '-',   sub: '累计成功撮合',                                       icon: Connection,    tone: 'success' },
  { key: 'pending',  label: '待审核资料', value: data.value?.pendingProfiles ?? '-', sub: '需处理',                                              icon: Document,      tone: 'warning' },
  { key: 'growth',   label: '近 30 日新增', value: data.value?.newUsers30d ?? '-', sub: `新牵线 ${data.value?.newMatches30d ?? 0} 条`,          icon: DataAnalysis,  tone: 'info' },
]);

const userBarWidth   = computed(() => pctBar(data.value?.newUsers7d,  data.value?.newUsers30d));
const matchBarWidth  = computed(() => pctBar(data.value?.newMatches7d, data.value?.newMatches30d));
const cancelBarWidth = computed(() => {
  const c = data.value?.cancelCount ?? 0;
  const t = data.value?.totalUsers ?? 1;
  return Math.min(100, Math.round((c / Math.max(t, 1)) * 100)) + '%';
});

function pctBar(a?: number, b?: number): string {
  if (!a || !b) return '0%';
  return Math.min(100, Math.round((a / b) * 100)) + '%';
}

const healthOk = computed(() => {
  const m = health.value?.checks?.mysql?.status;
  const o = health.value?.checks?.oss?.status;
  return m === 'ok' && (o === 'ok' || o === 'skip');
});
const overallHealth = computed<'success' | 'danger'>(() => (healthOk.value ? 'success' : 'danger'));

function dotClass(s?: string): string {
  if (s === 'ok') return 'tone-success';
  if (s === 'skip') return 'tone-info';
  if (!s) return 'tone-neutral';
  return 'tone-danger';
}

const shortcuts = [
  { path: '/users',     title: '用户管理',  icon: User,        tone: 'info',    desc: '查看 / 启用禁用' },
  { path: '/profiles',  title: '资料审核',  icon: Document,    tone: 'warning', desc: '待审核资料处理' },
  { path: '/matches',   title: '牵线记录',  icon: Connection,  tone: 'success', desc: '历史撮合查询' },
  { path: '/audit',     title: '操作日志',  icon: Tickets,     tone: 'neutral', desc: '后台操作追溯' },
];

void Plus;

onMounted(() => {
  fetchDashboard();
  fetchHealth();
});
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 16px; }

/* 顶部欢迎条 */
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 22px 24px;
  background: linear-gradient(135deg, #1f3a5f 0%, #294a73 100%);
  border-radius: 6px;
  color: #ffffff;
}
.hero-title { font-size: 22px; font-weight: 600; letter-spacing: 0.5px; }
.hero-sub { font-size: 13px; color: rgba(255, 255, 255, 0.78); margin-top: 8px; letter-spacing: 0.2px; }
.hero-actions { display: flex; gap: 10px; }
:deep(.hero-actions .el-button) { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.2); color: #fff; }
:deep(.hero-actions .el-button--primary) { background: #ffffff; color: var(--color-primary); border-color: #ffffff; }
:deep(.hero-actions .el-button:hover) { transform: translateY(-1px); }

/* KPI 卡片 */
.kpi-row { margin: 0 !important; }
.kpi-row .el-col { margin-bottom: 12px; }
.kpi-card {
  position: relative;
  background: #ffffff;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 18px 18px 18px 20px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
.kpi-card:hover { box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08); transform: translateY(-1px); }
.kpi-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}
.kpi-body { flex: 1; min-width: 0; }
.kpi-label { color: var(--color-text-secondary); font-size: 13px; letter-spacing: 0.2px; }
.kpi-value { font-size: 26px; font-weight: 600; color: var(--color-text-primary); margin: 6px 0 4px; letter-spacing: 0.3px; line-height: 1.2; }
.kpi-sub { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
.kpi-bar {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
}
.bar-primary { background: var(--color-primary); }
.bar-info    { background: #4a5b73; }
.bar-success { background: var(--color-success); }
.bar-warning { background: var(--color-warning); }
.bar-danger  { background: var(--color-danger); }

.tone-primary .kpi-icon { background: rgba(31, 58, 95, 0.10);   color: var(--color-primary); }
.tone-info    .kpi-icon { background: rgba(74, 91, 115, 0.12);  color: #4a5b73; }
.tone-success .kpi-icon { background: rgba(47, 125, 79, 0.12);  color: var(--color-success); }
.tone-warning .kpi-icon { background: rgba(176, 125, 47, 0.12); color: var(--color-warning); }
.tone-danger  .kpi-icon { background: rgba(179, 74, 63, 0.12);  color: var(--color-danger); }

/* 中段面板 */
.row-mid { margin: 0 !important; }
.row-mid .el-col { margin-bottom: 12px; }
.panel { border-radius: 6px; }
.panel-header { display: flex; align-items: center; justify-content: space-between; }
.panel-title { font-weight: 600; font-size: 15px; letter-spacing: 0.3px; }

/* 指标网格 */
.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.metric {
  padding: 14px 16px;
  background: var(--color-bg-soft);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
}
.metric-label { font-size: 13px; color: var(--color-text-secondary); letter-spacing: 0.2px; }
.metric-value { font-size: 22px; font-weight: 600; color: var(--color-text-primary); margin: 8px 0 12px; letter-spacing: 0.3px; }
.metric-bar {
  height: 4px;
  background: #eef1f5;
  border-radius: 2px;
  overflow: hidden;
}
.metric-bar span { display: block; height: 100%; background: var(--color-primary); border-radius: 2px; }
.metric-bar.match span { background: var(--color-success); }
.metric-bar.warn  span { background: var(--color-warning); }

/* 系统健康 */
.health-panel { min-height: 100%; }
.health-list { display: flex; flex-direction: column; gap: 14px; }
.health-item {
  display: flex;
  align-items: center;
  gap: 10px;
}
.health-name { width: 80px; font-size: 13px; color: var(--color-text-regular); letter-spacing: 0.2px; }
.health-meta { margin-left: auto; font-size: 12px; color: var(--color-text-secondary); letter-spacing: 0.2px; }
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.04);
}
.tone-success { background: var(--color-success); }
.tone-info    { background: #4a5b73; }
.tone-warning { background: var(--color-warning); }
.tone-danger  { background: var(--color-danger); }
.tone-neutral { background: #cbd5e1; }

/* 快捷入口 */
.shortcuts { margin-bottom: 8px; }
.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.shortcut {
  padding: 16px;
  background: var(--color-bg-hover);
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.18s ease;
}
.shortcut:hover {
  background: #ffffff;
  border-color: var(--color-border);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
}
.shortcut-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  margin-bottom: 10px;
}
.shortcut-name { font-weight: 600; font-size: 14px; letter-spacing: 0.2px; }
.shortcut-desc { font-size: 12px; color: var(--color-text-secondary); margin-top: 4px; letter-spacing: 0.1px; }

.shortcut.tone-info    .shortcut-icon { background: rgba(74, 91, 115, 0.12);  color: #4a5b73; }
.shortcut.tone-warning .shortcut-icon { background: rgba(176, 125, 47, 0.12); color: var(--color-warning); }
.shortcut.tone-success .shortcut-icon { background: rgba(47, 125, 79, 0.12);  color: var(--color-success); }
.shortcut.tone-neutral .shortcut-icon { background: rgba(148, 163, 184, 0.18); color: #64748b; }
</style>
