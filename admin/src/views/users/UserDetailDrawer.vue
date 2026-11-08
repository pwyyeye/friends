<template>
  <el-drawer
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    title="父母账号与孩子资料"
    size="min(760px,95vw)"
    ><div v-loading="loading">
      <template v-if="detail"
        ><h3>父母账号</h3>
        <el-descriptions :column="2" border
          ><el-descriptions-item label="父母称呼">{{
            detail.nickname
          }}</el-descriptions-item
          ><el-descriptions-item label="父母手机号">{{
            detail.phone
          }}</el-descriptions-item
          ><el-descriptions-item label="邀请来源">{{
            detail.referrer?.nickname || "直接注册"
          }}</el-descriptions-item
          ><el-descriptions-item label="账号状态">{{
            detail.status === 1 ? "启用" : "禁用"
          }}</el-descriptions-item></el-descriptions
        ><template v-if="detail.childProfile"
          ><h3>孩子资料 · {{ detail.childProfile.profileNumber }}</h3>
          <p>
            状态：{{ labels[detail.childProfile.profileStatus] }}　草稿版本：{{
              detail.childProfile.draftRevision
            }}
          </p>
          <el-tabs
            ><el-tab-pane label="当前草稿"
              ><ChildProfileDetails
                :payload="detail.childProfile.draft" /></el-tab-pane
            ><el-tab-pane
              label="最近提交"
              v-if="detail.childProfile.latestSubmission"
              ><p v-if="detail.childProfile.latestSubmission.rejectReason">
                修改建议：{{
                  detail.childProfile.latestSubmission.rejectReason
                }}
              </p>
              <ChildProfileDetails
                :payload="
                  detail.childProfile.latestSubmission.payload
                " /></el-tab-pane
            ><el-tab-pane
              label="审核通过版本"
              v-if="detail.childProfile.approved"
              ><ChildProfileDetails
                :payload="
                  detail.childProfile.approved
                " /></el-tab-pane></el-tabs></template
        ><el-empty v-else description="尚未登记孩子资料"
      /></template></div
  ></el-drawer>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { get } from "@/api/request";
import ChildProfileDetails from "@/components/ChildProfileDetails.vue";
const props = defineProps<{ modelValue: boolean; userId: string | null }>();
const emit = defineEmits<{ (e: "update:modelValue", v: boolean): void }>();
const loading = ref(false),
  detail = ref<any>(null),
  labels = ["未提交", "待审核", "已通过", "已驳回"];
watch(
  () => [props.modelValue, props.userId],
  async () => {
    if (!props.modelValue || !props.userId) return;
    loading.value = true;
    detail.value = null;
    try {
      detail.value = await get("/api/v1/admin/users/" + props.userId);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);
</script>
