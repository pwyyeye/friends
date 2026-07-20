<template>
  <el-drawer v-model="visible" title="资料审核" size="640px" direction="rtl">
    <div v-loading="loading" class="review">
      <template v-if="data">
        <section class="block">
          <h4 class="block-title">用户信息</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="用户ID">{{ data.userId }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ data.phone }}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{ data.payload?.nickname }}</el-descriptions-item>
            <el-descriptions-item label="性别">
              {{ data.payload?.gender === 1 ? '男' : data.payload?.gender === 2 ? '女' : '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="年龄">{{ data.payload?.age }}</el-descriptions-item>
            <el-descriptions-item label="身高">{{ data.payload?.height || '-' }}</el-descriptions-item>
            <el-descriptions-item label="城市ID">{{ data.payload?.cityId }}</el-descriptions-item>
            <el-descriptions-item label="职业ID">{{ data.payload?.occupationId || '-' }}</el-descriptions-item>
          </el-descriptions>
        </section>

        <section class="block">
          <h4 class="block-title">兴趣爱好</h4>
          <div class="tags">
            <el-tag v-for="id in data.payload?.interestTagIds" :key="id" type="info" effect="plain">#{{ id }}</el-tag>
            <el-tag v-for="t in data.payload?.customInterests" :key="'c-' + t" type="warning" effect="plain">{{ t }}</el-tag>
            <span v-if="!data.payload?.interestTagIds?.length && !data.payload?.customInterests?.length" class="muted">未填写</span>
          </div>
        </section>

        <section class="block">
          <h4 class="block-title">交友需求</h4>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="期望性别">
              {{ data.payload?.requirement?.targetGender === 1 ? '男' : data.payload?.requirement?.targetGender === 2 ? '女' : '不限' }}
            </el-descriptions-item>
            <el-descriptions-item label="期望年龄">
              {{ data.payload?.requirement?.targetAgeMin || '?' }} ~ {{ data.payload?.requirement?.targetAgeMax || '?' }}
            </el-descriptions-item>
            <el-descriptions-item label="期望城市">{{ data.payload?.requirement?.targetCityId || '-' }}</el-descriptions-item>
            <el-descriptions-item label="自我介绍" :span="2">
              <div class="pre">{{ data.payload?.requirement?.selfDesc || '-' }}</div>
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <section v-if="data.status !== 1" class="block">
          <el-alert
            :title="data.status === 2 ? '该资料已通过' : '该资料已驳回'"
            :type="data.status === 2 ? 'success' : 'error'"
            :closable="false"
            show-icon
          />
        </section>

        <section v-else class="block actions">
          <el-button type="success" :loading="acting" @click="onApprove">通过审核</el-button>
          <el-button type="danger" plain :loading="acting" @click="openReject = true">驳回</el-button>
        </section>
      </template>
    </div>

    <el-dialog v-model="openReject" title="驳回原因" width="420px" append-to-body>
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请填写驳回原因，将展示给用户" />
      <template #footer>
        <el-button @click="openReject = false">取消</el-button>
        <el-button type="danger" :loading="acting" @click="onReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { get, post } from '@/api/request';

const props = defineProps<{ modelValue: boolean; pendingId: string | null }>();
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'reviewed'): void }>();

const visible = ref(props.modelValue);
watch(() => props.modelValue, (v) => (visible.value = v));
watch(visible, (v) => emit('update:modelValue', v));

const loading = ref(false);
const acting = ref(false);
const openReject = ref(false);
const rejectReason = ref('');
const data = ref<any>(null);

watch(() => props.pendingId, async (id) => {
  if (!id) return;
  loading.value = true;
  try {
    data.value = await get(`/api/v1/admin/profiles/pending/${id}`);
  } finally {
    loading.value = false;
  }
}, { immediate: true });

const onApprove = async () => {
  acting.value = true;
  try {
    await post(`/api/v1/admin/profiles/pending/${props.pendingId}/approve`);
    ElMessage.success('审核已通过');
    emit('reviewed');
    visible.value = false;
  } finally {
    acting.value = false;
  }
};

const onReject = async () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写驳回原因');
    return;
  }
  acting.value = true;
  try {
    await post(`/api/v1/admin/profiles/pending/${props.pendingId}/reject`, { reason: rejectReason.value });
    ElMessage.success('已驳回');
    openReject.value = false;
    rejectReason.value = '';
    emit('reviewed');
    visible.value = false;
  } finally {
    acting.value = false;
  }
};
</script>

<style scoped>
.review { padding: 0 8px; }
.block { margin-bottom: 24px; }
.block-title { margin: 0 0 12px; font-size: 14px; font-weight: 600; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; }
.pre { white-space: pre-wrap; word-break: break-word; font-size: 13px; }
.actions { display: flex; gap: 12px; }
</style>