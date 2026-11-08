<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">介绍人管理</span>
          <span class="muted text-sm">
            介绍人 {{ stats.referrerCount }} 人 · 待发展
            {{ stats.candidateCount }} 人
          </span>
        </div>
      </template>

      <el-tabs v-model="tab" class="tabs">
        <!-- ============ 介绍人 ============ -->
        <el-tab-pane label="介绍人" name="referrer">
          <el-form :inline="true" :model="filters" class="filters">
            <el-form-item label="关键字">
              <el-input
                v-model="filters.keyword"
                placeholder="昵称 / 手机号 / 邀请码"
                clearable
                style="width: 240px"
                @keyup.enter="onSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="onSearch">查询</el-button>
              <el-button @click="onReset">重置</el-button>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Plus" @click="openCreate"
                >新建介绍人</el-button
              >
            </el-form-item>
          </el-form>

          <el-table :data="list" v-loading="loading" stripe border>
            <el-table-column label="ID" prop="id" width="80" />
            <el-table-column label="邀请码" prop="inviteCode" width="120" />
            <el-table-column
              label="昵称"
              prop="nickname"
              width="140"
              show-overflow-tooltip
            />
            <el-table-column label="手机号" prop="phone" width="140" />
            <el-table-column label="邀请人数" prop="inviteeCount" width="100" />
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="row.status === 1 ? 'success' : 'danger'"
                  effect="plain"
                >
                  {{ row.status === 1 ? "启用" : "禁用" }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="注册时间" width="170">
              <template #default="{ row }">{{
                formatTime(row.createdAt)
              }}</template>
            </el-table-column>
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <el-button text size="small" @click="openInvitees(row)"
                  >查看邀请</el-button
                >
                <el-button text size="small" @click="openQrcode(row)"
                  >推广二维码</el-button
                >
                <el-button text size="small" @click="openEdit(row)"
                  >编辑</el-button
                >
                <el-button
                  text
                  size="small"
                  type="danger"
                  @click="onToggleStatus(row)"
                  v-if="row.status === 1"
                  >禁用</el-button
                >
                <el-button text size="small" @click="onToggleStatus(row)" v-else
                  >启用</el-button
                >
              </template>
            </el-table-column>
          </el-table>

          <div class="pager">
            <el-pagination
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="fetchReferrers"
              @size-change="fetchReferrers"
            />
          </div>
        </el-tab-pane>

        <!-- ============ 待发展介绍人 ============ -->
        <el-tab-pane label="待发展介绍人" name="candidate">
          <div class="muted text-sm hint">
            这里是尚未被官方认证为介绍人的普通用户，可一键"设为介绍人"生成专属邀请码。
          </div>
          <el-form :inline="true" :model="filters" class="filters">
            <el-form-item label="关键字">
              <el-input
                v-model="filters.keyword"
                placeholder="昵称 / 手机号 / 邀请码"
                clearable
                style="width: 240px"
                @keyup.enter="onSearch"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="onSearch">查询</el-button>
              <el-button @click="onReset">重置</el-button>
            </el-form-item>
          </el-form>

          <el-table :data="candidates" v-loading="candLoading" stripe border>
            <el-table-column label="ID" prop="id" width="80" />
            <el-table-column label="现有邀请码" prop="inviteCode" width="120">
              <template #default="{ row }">
                <span v-if="row.inviteCode">{{ row.inviteCode }}</span>
                <span v-else class="muted">-</span>
              </template>
            </el-table-column>
            <el-table-column
              label="昵称"
              prop="nickname"
              width="140"
              show-overflow-tooltip
            >
              <template #default="{ row }">{{ row.nickname || "-" }}</template>
            </el-table-column>
            <el-table-column label="手机号" prop="phone" width="140" />
            <el-table-column label="注册时间" width="170">
              <template #default="{ row }">{{
                formatTime(row.createdAt)
              }}</template>
            </el-table-column>
            <el-table-column label="操作" width="160" fixed="right">
              <template #default="{ row }">
                <el-button
                  text
                  size="small"
                  type="primary"
                  @click="onPromote(row)"
                  >设为介绍人</el-button
                >
              </template>
            </el-table-column>
          </el-table>

          <div class="pager">
            <el-pagination
              v-model:current-page="candPage"
              v-model:page-size="candPageSize"
              :total="candTotal"
              :page-sizes="[20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              @current-change="fetchCandidates"
              @size-change="fetchCandidates"
            />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 邀请记录抽屉 -->
    <el-drawer
      v-model="inviteesOpen"
      title="邀请记录"
      size="640px"
      direction="rtl"
    >
      <div v-loading="inviteesLoading" class="invitees">
        <el-table :data="invitees" border size="small">
          <el-table-column label="昵称" prop="nickname" width="120" />
          <el-table-column label="手机号" width="140">
            <template #default="{ row }">{{
              row.phone
                ? row.phone.slice(0, 3) + "****" + row.phone.slice(-4)
                : "-"
            }}</template>
          </el-table-column>
          <el-table-column label="注册时间" width="170">
            <template #default="{ row }">{{
              formatTime(row.createdAt)
            }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>

    <!-- 新建介绍人 -->
    <el-dialog
      v-model="createOpen"
      title="新建介绍人"
      width="460px"
      :close-on-click-modal="false"
    >
      <el-form
        :model="createForm"
        :rules="createRules"
        ref="createFormRef"
        label-width="80px"
      >
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="createForm.phone"
            placeholder="11 位手机号"
            maxlength="11"
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="createForm.nickname"
            placeholder="对外展示的昵称"
            maxlength="30"
          />
        </el-form-item>
        <el-form-item label="初始密码" prop="password">
          <el-input
            v-model="createForm.password"
            placeholder="留空则自动生成 8 位密码"
            type="text"
            show-password
          />
        </el-form-item>
        <el-alert
          v-if="createResult"
          :title="
            createResult.upgraded ? '该手机号已注册，已升级为介绍人' : '已创建'
          "
          type="success"
          :closable="false"
          show-icon
          style="margin-top: 8px"
        >
          <template v-if="createResult.initialPassword">
            <p>
              初始密码：<b style="color: var(--color-primary)">{{
                createResult.initialPassword
              }}</b>
            </p>
            <p class="muted text-sm">请妥善保管并转交给介绍人本人。</p>
          </template>
        </el-alert>
      </el-form>
      <template #footer>
        <el-button @click="createOpen = false">关 闭</el-button>
        <el-button type="primary" :loading="createLoading" @click="onCreate"
          >保 存</el-button
        >
      </template>
    </el-dialog>

    <!-- 编辑 -->
    <el-dialog
      v-model="editOpen"
      title="编辑介绍人"
      width="420px"
      :close-on-click-modal="false"
    >
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="邀请码">
          <el-input v-model="editForm.inviteCode" disabled />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" maxlength="30" />
        </el-form-item>
        <el-form-item label="账号状态">
          <el-switch
            v-model="editForm.statusEnabled"
            active-text="启用"
            inactive-text="禁用"
            inline-prompt
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editOpen = false">取 消</el-button>
        <el-button type="primary" :loading="editLoading" @click="onEditSave"
          >保 存</el-button
        >
      </template>
    </el-dialog>

    <!-- 推广二维码 -->
    <el-dialog
      v-model="qrOpen"
      title="推广二维码"
      width="360px"
      align-center
      :close-on-click-modal="false"
    >
      <div v-loading="qrLoading" class="qrcode">
        <img v-if="qrUrl" :src="qrUrl" alt="推广二维码" />
        <div v-if="qrInfo" class="qr-info">
          <p class="qr-info-name">{{ qrInfo.nickname || "介绍人" }}</p>
          <p class="qr-info-code">
            邀请码 <b>{{ qrInfo.inviteCode }}</b>
          </p>
          <p class="qr-info-url">{{ qrInfo.inviteUrl }}</p>
          <el-button type="primary" plain size="small" @click="onCopyUrl"
            >复制链接</el-button
          >
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from "vue";
import dayjs from "dayjs";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import { get, post, put } from "@/api/request";

const tab = ref<"referrer" | "candidate">("referrer");

// ===== 介绍人列表 =====
const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const filters = reactive({ keyword: "" });

const fetchReferrers = async () => {
  loading.value = true;
  try {
    const res = await get<{ total: number; items: any[] }>(
      "/api/v1/admin/referrers",
      {
        page: page.value,
        pageSize: pageSize.value,
        keyword: filters.keyword || undefined,
      },
    );
    list.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

// ===== 候选人列表 =====
const candidates = ref<any[]>([]);
const candTotal = ref(0);
const candPage = ref(1);
const candPageSize = ref(20);
const candLoading = ref(false);

const fetchCandidates = async () => {
  candLoading.value = true;
  try {
    const res = await get<{ total: number; items: any[] }>(
      "/api/v1/admin/referrers/candidates",
      {
        page: candPage.value,
        pageSize: candPageSize.value,
        keyword: filters.keyword || undefined,
      },
    );
    candidates.value = res.items;
    candTotal.value = res.total;
  } finally {
    candLoading.value = false;
  }
};

// 看板上方的统计
const stats = computed(() => ({
  referrerCount: total.value,
  candidateCount: candTotal.value,
}));

const onSearch = () => {
  page.value = 1;
  candPage.value = 1;
  if (tab.value === "referrer") fetchReferrers();
  else fetchCandidates();
};
const onReset = () => {
  filters.keyword = "";
  onSearch();
};

// 切换 tab 时同步拉取
const onTabChange = (v: string | number) => {
  if (v === "referrer" && list.value.length === 0) fetchReferrers();
  if (v === "candidate" && candidates.value.length === 0) fetchCandidates();
};

// ===== 邀请记录 =====
const inviteesOpen = ref(false);
const invitees = ref<any[]>([]);
const inviteesLoading = ref(false);
const openInvitees = async (row: any) => {
  inviteesOpen.value = true;
  inviteesLoading.value = true;
  try {
    invitees.value = await get(`/api/v1/admin/referrers/${row.id}/invitees`);
  } finally {
    inviteesLoading.value = false;
  }
};

// ===== 新建 =====
const createOpen = ref(false);
const createLoading = ref(false);
const createFormRef = ref();
const createForm = reactive({ phone: "", nickname: "", password: "" });
const createRules = {
  phone: [
    { required: true, message: "请输入手机号", trigger: "blur" },
    { pattern: /^1\d{10}$/, message: "手机号格式不正确", trigger: "blur" },
  ],
  nickname: [{ required: true, message: "请输入昵称", trigger: "blur" }],
  password: [{ min: 6, max: 32, message: "密码 6-32 位", trigger: "blur" }],
};
const createResult = ref<any>(null);
const openCreate = () => {
  createForm.phone = "";
  createForm.nickname = "";
  createForm.password = "";
  createResult.value = null;
  createOpen.value = true;
};
const onCreate = async () => {
  await createFormRef.value?.validate();
  createLoading.value = true;
  try {
    const data = await post<any>("/api/v1/admin/referrers", {
      phone: createForm.phone,
      nickname: createForm.nickname,
      password: createForm.password || undefined,
    });
    createResult.value = data;
    ElMessage.success(data.upgraded ? "已升级为介绍人" : "已创建");
    fetchReferrers();
    fetchCandidates();
  } finally {
    createLoading.value = false;
  }
};

// ===== 编辑 =====
const editOpen = ref(false);
const editLoading = ref(false);
const editForm = reactive({
  id: "",
  inviteCode: "",
  nickname: "",
  statusEnabled: true,
});
const openEdit = (row: any) => {
  editForm.id = row.id;
  editForm.inviteCode = row.inviteCode;
  editForm.nickname = row.nickname || "";
  editForm.statusEnabled = row.status === 1;
  editOpen.value = true;
};
const onEditSave = async () => {
  editLoading.value = true;
  try {
    await put(`/api/v1/admin/referrers/${editForm.id}`, {
      nickname: editForm.nickname,
      status: editForm.statusEnabled ? 1 : 0,
    });
    ElMessage.success("已保存");
    editOpen.value = false;
    fetchReferrers();
  } finally {
    editLoading.value = false;
  }
};

// 启用 / 禁用
const onToggleStatus = async (row: any) => {
  const target = row.status === 1 ? 0 : 1;
  await put(`/api/v1/admin/referrers/${row.id}`, { status: target });
  ElMessage.success(target === 1 ? "已启用" : "已禁用");
  fetchReferrers();
};

// ===== 设为介绍人 =====
const onPromote = async (row: any) => {
  await ElMessageBox.confirm(
    `将用户 ${row.nickname || row.phone || row.id} 设为介绍人？将为其生成专属邀请码。`,
    "设为介绍人",
    { type: "warning" },
  );
  const data = await post<any>(`/api/v1/admin/referrers/${row.id}/promote`);
  ElMessage.success(`邀请码已生成：${data.inviteCode}`);
  fetchCandidates();
  fetchReferrers();
};

// ===== 推广二维码 =====
const qrOpen = ref(false);
const qrLoading = ref(false);
const qrInfo = ref<any>(null);
const qrUrl = ref("");
let qrObjectUrl = "";
const openQrcode = async (row: any) => {
  qrOpen.value = true;
  qrLoading.value = true;
  qrInfo.value = null;
  qrUrl.value = "";
  try {
    const info = await get<any>(`/api/v1/admin/referrers/${row.id}/invite-url`);
    qrInfo.value = info;
    const blob = await get<Blob>(
      `/api/v1/admin/referrers/${row.id}/invite-qrcode`,
      {},
      { responseType: "blob" },
    );
    if (qrObjectUrl) URL.revokeObjectURL(qrObjectUrl);
    qrObjectUrl = URL.createObjectURL(blob);
    qrUrl.value = qrObjectUrl;
  } finally {
    qrLoading.value = false;
  }
};
const onCopyUrl = async () => {
  if (!qrInfo.value?.inviteUrl) return;
  try {
    await navigator.clipboard.writeText(qrInfo.value.inviteUrl);
    ElMessage.success("已复制推广链接");
  } catch {
    ElMessage.warning("复制失败，请手动复制");
  }
};

// ===== 通用 =====
const profileLabel = (s: number) =>
  ["未提交", "待审核", "已通过", "已驳回"][s] || "-";
const profileTagType = (s: number) =>
  ["info", "warning", "success", "danger"][s] || "info";
const formatTime = (t: string) => dayjs(t).format("YYYY-MM-DD HH:mm");

onMounted(() => {
  fetchReferrers();
  fetchCandidates();
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-weight: 600;
}
.tabs {
  margin-top: -8px;
}
.hint {
  margin: 0 0 12px;
}
.filters {
  margin-bottom: 16px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.invitees {
  padding: 0 16px;
}
.qrcode {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.qrcode img {
  width: 240px;
  height: 240px;
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
}
.qr-info {
  text-align: center;
}
.qr-info-name {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
}
.qr-info-code {
  color: var(--color-text-secondary);
  margin: 0 0 4px;
}
.qr-info-url {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin: 0 0 10px;
  word-break: break-all;
}
</style>
