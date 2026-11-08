<template>
  <el-drawer
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="审核孩子资料"
    size="min(760px,95vw)"
    ><div v-loading="loading">
      <template v-if="detail"
        ><el-alert
          title="正在审核提交时的资料快照，父母后续的草稿修改不会覆盖此版本"
          type="info"
          :closable="false" />
        <h3>登记父母：{{ detail.parentName }} · {{ detail.phone }}</h3>
        <p>孩子资料编号：C{{ String(detail.profileId).padStart(6, "0") }}</p>
        <ChildProfileDetails :payload="detail.payload" />
        <div v-if="detail.status === 1" class="review-actions">
          <el-input
            v-model="reason"
            type="textarea"
            :rows="3"
            maxlength="500"
            show-word-limit
            placeholder="驳回时请填写清晰的修改建议"
          />
          <div>
            <el-button type="danger" :loading="busy" @click="review(false)"
              >驳回，要求修改</el-button
            ><el-button type="primary" :loading="busy" @click="review(true)"
              >审核通过</el-button
            >
          </div>
        </div>
        <el-alert
          v-else
          title="此提交已处理或已被新版本替代"
          type="warning"
          :closable="false"
      /></template></div
  ></el-drawer>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { get, post } from "@/api/request";
import ChildProfileDetails from "@/components/ChildProfileDetails.vue";
const props = defineProps<{ modelValue: boolean; pendingId: string | null }>();
const emit = defineEmits<{
  (e: "update:modelValue", v: boolean): void;
  (e: "reviewed"): void;
}>();
const loading = ref(false),
  busy = ref(false),
  detail = ref<any>(null),
  reason = ref("");
watch(
  () => [props.modelValue, props.pendingId],
  async () => {
    if (!props.modelValue || !props.pendingId) return;
    loading.value = true;
    detail.value = null;
    reason.value = "";
    try {
      detail.value = await get(
        "/api/v1/admin/profiles/pending/" + props.pendingId,
      );
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
async function review(approved: boolean) {
  if (!approved && !reason.value.trim()) {
    ElMessage.warning("请填写修改建议");
    return;
  }
  try {
    await ElMessageBox.confirm(
      approved ? "确认通过这份孩子资料？" : "确认驳回并发送修改建议？",
      "审核确认",
    );
    busy.value = true;
    await post(
      `/api/v1/admin/profiles/pending/${props.pendingId}/${approved ? "approve" : "reject"}`,
      approved ? {} : { reason: reason.value.trim() },
    );
    ElMessage.success("审核结果已保存");
    emit("reviewed");
    emit("update:modelValue", false);
  } catch {
  } finally {
    busy.value = false;
  }
}
</script>
<style scoped>
.review-actions {
  display: grid;
  gap: 16px;
  margin-top: 24px;
}
</style>
