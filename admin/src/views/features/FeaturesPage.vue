<template>
  <div class="features-page" v-loading="loading">
    <el-card>
      <template #header>
        <div class="page-header">
          <div>
            <div class="page-title">用户端功能开关</div>
            <div class="page-subtitle">关闭后，用户端入口会隐藏，相关后端接口也会拒绝新的操作</div>
          </div>
          <div class="header-actions">
            <el-tag type="success" effect="plain" round>
              {{ enabledCount }} / {{ rows.length }} 已开启
            </el-tag>
            <el-button :disabled="!dirty || saving" @click="reset">撤销更改</el-button>
            <el-button type="primary" :loading="saving" :disabled="!dirty" @click="save">
              保存配置
            </el-button>
          </div>
        </div>
      </template>

      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="开关保存后立即生效。已产生的历史记录不会删除，重新开启后可继续查看。"
      />

      <div class="feature-grid">
        <article
          v-for="row in rows"
          :key="row.key"
          class="feature-item"
          :class="{ disabled: !row.enabled }"
        >
          <span class="feature-icon" :class="`tone-${row.key}`">
            <el-icon><component :is="iconMap[row.key]" /></el-icon>
          </span>
          <div class="feature-copy">
            <div class="feature-title-row">
              <strong>{{ row.label }}</strong>
              <el-tag
                size="small"
                :type="row.enabled ? 'success' : 'info'"
                effect="plain"
              >
                {{ row.enabled ? '已开启' : '已关闭' }}
              </el-tag>
            </div>
            <p>{{ row.description }}</p>
            <small v-if="row.updatedAt">
              最近更新 {{ formatTime(row.updatedAt) }}
            </small>
            <small v-else>当前使用默认配置</small>
          </div>
          <el-switch
            v-model="row.enabled"
            inline-prompt
            active-text="开"
            inactive-text="关"
            :disabled="saving"
          />
        </article>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  ChatDotRound,
  CircleCheck,
  Lightning,
  Star,
  Unlock,
  MagicStick,
} from '@element-plus/icons-vue';
import { get, put } from '@/api/request';

type FeatureKey =
  | 'messages'
  | 'verification'
  | 'accelerate'
  | 'favorite'
  | 'unlock'
  | 'likes';

interface FeatureRow {
  key: FeatureKey;
  label: string;
  description: string;
  enabled: boolean;
  updatedAt: string | null;
}

const iconMap = {
  messages: ChatDotRound,
  verification: CircleCheck,
  accelerate: Lightning,
  favorite: Star,
  unlock: Unlock,
  likes: MagicStick,
};

const rows = ref<FeatureRow[]>([]);
const original = ref<FeatureRow[]>([]);
const loading = ref(false);
const saving = ref(false);

const enabledCount = computed(() => rows.value.filter((row) => row.enabled).length);
const dirty = computed(
  () =>
    JSON.stringify(rows.value.map(({ key, enabled }) => ({ key, enabled }))) !==
    JSON.stringify(original.value.map(({ key, enabled }) => ({ key, enabled }))),
);

async function load() {
  loading.value = true;
  try {
    rows.value = await get<FeatureRow[]>('/api/v1/admin/features');
    original.value = rows.value.map((row) => ({ ...row }));
  } finally {
    loading.value = false;
  }
}

async function save() {
  saving.value = true;
  try {
    const payload = Object.fromEntries(rows.value.map((row) => [row.key, row.enabled]));
    rows.value = await put<FeatureRow[]>('/api/v1/admin/features', payload);
    original.value = rows.value.map((row) => ({ ...row }));
    ElMessage.success('功能配置已保存');
  } finally {
    saving.value = false;
  }
}

function reset() {
  rows.value = original.value.map((row) => ({ ...row }));
}

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false });
}

onMounted(load);
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.page-title {
  font-size: 17px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.page-subtitle {
  margin-top: 5px;
  color: var(--color-text-secondary);
  font-size: 12px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}
.feature-item {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  min-height: 126px;
  padding: 18px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: #fff;
  transition: border-color 0.18s ease, background 0.18s ease;
}
.feature-item.disabled {
  background: #fafafa;
  border-color: #e7e7e7;
}
.feature-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 8px;
  color: #fff;
  font-size: 22px;
}
.tone-messages { background: #3b82f6; }
.tone-verification { background: #2f7d4f; }
.tone-accelerate { background: #d97706; }
.tone-favorite { background: #db5c66; }
.tone-unlock { background: #7c5cd6; }
.tone-likes { background: #d45476; }
.feature-copy {
  min-width: 0;
}
.feature-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.feature-title-row strong {
  font-size: 15px;
}
.feature-copy p {
  margin: 7px 0;
  color: var(--color-text-secondary);
  font-size: 12px;
  line-height: 1.55;
}
.feature-copy small {
  color: #9ca3af;
  font-size: 11px;
}
@media (max-width: 1050px) {
  .feature-grid { grid-template-columns: minmax(0, 1fr); }
  .page-header { align-items: flex-start; flex-direction: column; }
}
</style>
