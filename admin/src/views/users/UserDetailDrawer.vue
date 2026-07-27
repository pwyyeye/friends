<template>
  <el-drawer v-model="visible" title="用户详情" size="520px" direction="rtl">
    <div v-loading="loading" class="detail">
      <template v-if="data">
        <section class="block">
          <h4 class="block-title">基础信息</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="用户ID">{{ data.id }}</el-descriptions-item>
            <el-descriptions-item label="手机号">
              <span :class="{ mono: true }">{{ data.phone }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="昵称">{{ data.nickname || '-' }}</el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ data.gender === 1 ? '男' : data.gender === 2 ? '女' : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="年龄">{{ data.age ?? '-' }}</el-descriptions-item>
            <el-descriptions-item label="身高">{{ data.height ? data.height + ' cm' : '-' }}</el-descriptions-item>
            <el-descriptions-item label="城市">{{ data.city?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="职业">
              {{ data.occupation?.name || data.occupationCustom || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="邀请码">{{ data.inviteCode || '-' }}</el-descriptions-item>
            <el-descriptions-item label="介绍人">
              <span v-if="data.referrer">{{ data.referrer.nickname }} ({{ data.referrer.inviteCode }})</span>
              <span v-else class="muted">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="资料状态">
              <el-tag size="small" :type="profileTagType(data.profileStatus)">
                {{ profileLabel(data.profileStatus) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="账号状态">
              <el-tag size="small" :type="data.status === 1 ? 'success' : 'danger'" effect="plain">
                {{ data.status === 1 ? '启用' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="注册时间" :span="2">{{ formatTime(data.createdAt) }}</el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="block">
          <h4 class="block-title">头像</h4>
          <div class="avatar-box">
            <el-image
              v-if="data.avatarUrl"
              :src="data.avatarUrl"
              :preview-src-list="[data.avatarUrl]"
              :initial-index="0"
              fit="cover"
              class="avatar-img"
              :preview-teleported="true"
            >
              <template #error>
                <div class="img-fallback">加载失败</div>
              </template>
            </el-image>
            <div v-else class="img-fallback img-fallback--lg">未上传头像</div>
          </div>
        </section>

        <section class="block">
          <h4 class="block-title">生活照 <span class="muted text-xs">({{ data.photos?.length || 0 }} 张)</span></h4>
          <div v-if="data.photos?.length" class="photo-strip">
            <el-image
              v-for="(p, i) in data.photos"
              :key="p.ossKey"
              :src="p.url"
              :preview-src-list="data.photos.map((x: any) => x.url).filter(Boolean)"
              :initial-index="i"
              fit="cover"
              class="photo-img"
              :preview-teleported="true"
            >
              <template #error>
                <div class="img-fallback">?</div>
              </template>
            </el-image>
          </div>
          <div v-else class="muted">未上传生活照</div>
        </section>

        <section class="block">
          <h4 class="block-title">兴趣爱好</h4>
          <div class="tags">
            <el-tag v-for="t in data.interests" :key="t.id" type="info" effect="plain">{{ t.name }}</el-tag>
            <el-tag v-for="t in data.customInterests" :key="'c-' + t" type="warning" effect="plain">{{ t }}</el-tag>
            <span v-if="!data.interests.length && !data.customInterests.length" class="muted">未填写</span>
          </div>
        </section>

        <section class="block">
          <h4 class="block-title">交友需求</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="期望性别">
              {{ data.requirement?.targetGender === 1 ? '男' : data.requirement?.targetGender === 2 ? '女' : '不限' }}
            </el-descriptions-item>
            <el-descriptions-item label="期望年龄">
              <span v-if="data.requirement">
                {{ data.requirement.targetAgeMin || '?' }} ~ {{ data.requirement.targetAgeMax || '?' }}
              </span>
              <span v-else class="muted">-</span>
            </el-descriptions-item>
            <el-descriptions-item label="期望城市" :span="2">
              {{ data.requirement?.targetCity?.name || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="自我介绍" :span="2">
              <div class="pre">{{ data.requirement?.selfDesc || '-' }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </section>
      </template>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import dayjs from 'dayjs';
import { get } from '@/api/request';

const props = defineProps<{ modelValue: boolean; userId: string | null }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, (v) => (visible.value = v));
watch(visible, (v) => emit('update:modelValue', v));

const loading = ref(false);
const data = ref<any>(null);

watch(() => props.userId, async (id) => {
  if (!id) return;
  loading.value = true;
  try {
    data.value = await get(`/api/v1/admin/users/${id}`);
  } finally {
    loading.value = false;
  }
}, { immediate: true });

const profileLabel = (s: number) => ['未提交', '待审核', '已通过', '已驳回'][s] || '-';
const profileTagType = (s: number) => ['info', 'warning', 'success', 'danger'][s] || 'info';
const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss');
</script>

<style scoped>
.detail { padding: 0 8px; }
.block { margin-bottom: 24px; }
.block-title { margin: 0 0 12px; font-size: 14px; font-weight: 600; color: var(--color-text-primary); }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.pre { white-space: pre-wrap; word-break: break-word; font-size: 13px; color: var(--color-text-regular); }

.avatar-box {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-bg-section);
  border: 1px solid var(--color-border);
}
.avatar-img { width: 120px; height: 120px; display: block; }
.photo-strip { display: flex; flex-wrap: wrap; gap: 8px; }
.photo-img {
  width: 96px;
  height: 96px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--color-border);
}
.img-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-section);
  color: var(--color-text-muted);
  font-size: 12px;
}
.img-fallback--lg { font-size: 13px; }
</style>