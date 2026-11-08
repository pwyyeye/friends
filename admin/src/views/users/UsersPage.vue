<template>
  <el-card
    ><template #header
      ><div class="card-header">
        <strong>父母账号</strong
        ><span class="muted">共 {{ total }} 个账号</span>
      </div></template
    ><el-form inline @submit.prevent="search"
      ><el-form-item label="父母称呼 / 手机号 / 邀请码"
        ><el-input
          v-model="keyword"
          clearable
          @keyup.enter="search" /></el-form-item
      ><el-form-item label="账号状态"
        ><el-select v-model="status" clearable style="width: 130px"
          ><el-option label="启用" :value="1" /><el-option
            label="禁用"
            :value="0" /></el-select></el-form-item
      ><el-form-item
        ><el-button type="primary" @click="search"
          >查询</el-button
        ></el-form-item
      ></el-form
    ><el-table :data="list" v-loading="loading" stripe border
      ><el-table-column label="账号 ID" prop="id" width="90" /><el-table-column
        label="父母称呼"
        prop="nickname"
      /><el-table-column
        label="父母手机号"
        prop="phone"
        width="150"
      /><el-table-column label="已登记孩子"
        ><template #default="{ row }">{{
          row.children
            .map((c: any) => c.draft.nickname || "未填写称呼")
            .join("、") || "尚未登记"
        }}</template></el-table-column
      ><el-table-column label="邀请来源"
        ><template #default="{ row }">{{
          row.referrer?.nickname || "直接注册"
        }}</template></el-table-column
      ><el-table-column label="账号状态" width="100"
        ><template #default="{ row }"
          ><el-tag :type="row.status === 1 ? 'success' : 'danger'">{{
            row.status === 1 ? "启用" : "禁用"
          }}</el-tag></template
        ></el-table-column
      ><el-table-column label="操作" width="220" align="center" fixed="right"
        ><template #default="{ row }"
          ><div class="row-actions"
            ><el-button link type="primary" @click="open(row.id)"
              >详情</el-button
            ><span class="action-divider" aria-hidden="true"></span
            ><el-button link type="primary" @click="openPassword(row)"
              >重置密码</el-button
            ><span class="action-divider" aria-hidden="true"></span
            ><el-button
              link
              :type="row.status === 1 ? 'danger' : 'success'"
              @click="toggle(row)"
              >{{ row.status === 1 ? "禁用" : "启用" }}</el-button
            ></div
          ></template
        ></el-table-column
      ></el-table
    ><el-pagination
      v-model:current-page="page"
      :page-size="20"
      :total="total"
      layout="total,prev,pager,next"
      @current-change="load"
      class="pager" /><UserDetailDrawer v-model="drawer" :user-id="current"
    /><el-dialog
      v-model="passwordDialog"
      title="重置登录密码"
      width="460px"
      :close-on-click-modal="false"
      @closed="clearPasswordState"
      ><div v-if="passwordTarget" class="password-summary"
        ><strong>{{ passwordTarget.nickname || "未填写称呼" }}</strong
        ><span>{{ passwordTarget.phone }}</span></div
      ><el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="96px"
        ><el-form-item label="新密码" prop="password"
          ><el-input
            v-model="passwordForm.password"
            type="password"
            autocomplete="new-password"
            maxlength="32"
            show-password
            placeholder="请输入 6–32 位新密码" /></el-form-item
        ><el-form-item label="确认密码" prop="confirmPassword"
          ><el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            autocomplete="new-password"
            maxlength="32"
            show-password
            placeholder="请再次输入新密码" /></el-form-item
        ><div class="password-tools"
          ><el-button link type="primary" @click="generatePassword"
            >生成随机密码</el-button
          ><span>生成后可先显示并复制，再提交重置</span></div
        ></el-form
      ><template #footer
        ><el-button @click="passwordDialog = false">取消</el-button
        ><el-button
          type="primary"
          :loading="passwordLoading"
          @click="submitPassword"
          >确认重置</el-button
        ></template
      ></el-dialog
    ></el-card>
</template>
<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { get, put } from "@/api/request";
import UserDetailDrawer from "./UserDetailDrawer.vue";
const list = ref<any[]>([]),
  total = ref(0),
  page = ref(1),
  keyword = ref(""),
  status = ref<number>(),
  loading = ref(false),
  drawer = ref(false),
  current = ref<string | null>(null),
  passwordDialog = ref(false),
  passwordLoading = ref(false),
  passwordTarget = ref<any>(null),
  passwordFormRef = ref<any>();
const passwordForm = reactive({ password: "", confirmPassword: "" });
const passwordRules = {
  password: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, max: 32, message: "密码 6–32 位", trigger: "blur" },
  ],
  confirmPassword: [
    { required: true, message: "请再次输入新密码", trigger: "blur" },
    {
      validator: (_rule: unknown, value: string, callback: (e?: Error) => void) =>
        value === passwordForm.password
          ? callback()
          : callback(new Error("两次输入的密码不一致")),
      trigger: "blur",
    },
  ],
};
async function load() {
  loading.value = true;
  try {
    const r = await get<{ total: number; items: any[] }>(
      "/api/v1/admin/users",
      { page: page.value, keyword: keyword.value, status: status.value },
    );
    list.value = r.items;
    total.value = r.total;
  } finally {
    loading.value = false;
  }
}
function search() {
  page.value = 1;
  load();
}
function open(id: string) {
  current.value = id;
  drawer.value = true;
}
function openPassword(row: any) {
  passwordTarget.value = row;
  passwordForm.password = "";
  passwordForm.confirmPassword = "";
  passwordDialog.value = true;
}
function clearPasswordState() {
  passwordForm.password = "";
  passwordForm.confirmPassword = "";
  passwordTarget.value = null;
  passwordFormRef.value?.clearValidate();
}
function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const values = window.crypto.getRandomValues(new Uint32Array(12));
  passwordForm.password = Array.from(
    values,
    (value) => chars[value % chars.length],
  ).join("");
  passwordForm.confirmPassword = passwordForm.password;
  passwordFormRef.value?.clearValidate();
}
async function submitPassword() {
  if (!passwordFormRef.value || passwordLoading.value) return;
  try {
    await passwordFormRef.value.validate();
  } catch {
    return;
  }
  passwordLoading.value = true;
  try {
    await put(`/api/v1/admin/users/${passwordTarget.value.id}/password`, {
      password: passwordForm.password,
    });
    ElMessage.success("密码已重置，旧登录状态已失效");
    passwordDialog.value = false;
  } finally {
    passwordLoading.value = false;
  }
}
async function toggle(row: any) {
  try {
    await ElMessageBox.confirm(
      `确认${row.status === 1 ? "禁用" : "启用"}父母账号「${row.nickname}」？`,
      "账号状态",
    );
    await put("/api/v1/admin/users/" + row.id, {
      status: row.status === 1 ? 0 : 1,
    });
    await load();
  } catch {}
}
onMounted(load);
</script>
<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
}
.pager {
  margin-top: 20px;
  justify-content: flex-end;
}
.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}
.row-actions :deep(.el-button) {
  margin-left: 0;
  padding: 4px 2px;
  font-weight: 500;
}
.action-divider {
  width: 1px;
  height: 14px;
  background: var(--el-border-color);
}
.password-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  padding: 12px 14px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}
.password-summary span {
  color: var(--el-text-color-secondary);
}
.password-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: -4px 0 14px 96px;
}
.password-tools span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}
</style>
