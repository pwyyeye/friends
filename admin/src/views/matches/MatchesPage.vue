<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">牵线记录</span>
          <div class="header-actions">
            <el-button type="primary" @click="openCreate"
              >新增牵线记录</el-button
            >
          </div>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filters">
        <el-form-item label="介绍人 ID">
          <el-input
            v-model="filters.referrerId"
            placeholder="可选"
            clearable
            style="width: 160px"
          />
        </el-form-item>
        <el-form-item label="起始日期">
          <el-date-picker
            v-model="filters.from"
            type="date"
            placeholder="开始"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="结束日期">
          <el-date-picker
            v-model="filters.to"
            type="date"
            placeholder="结束"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe border>
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="孩子 A" width="160">
          <template #default="{ row }">
            <div>{{ row.profileA.nickname || "-" }}</div>
            <div class="muted text-sm mono">
              {{ row.profileA.phone || "-" }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="孩子 B" width="160">
          <template #default="{ row }">
            <div>{{ row.profileB.nickname || "-" }}</div>
            <div class="muted text-sm mono">
              {{ row.profileB.phone || "-" }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="介绍人" width="160">
          <template #default="{ row }">
            <div>{{ row.referrer?.nickname || "平台人工牵线" }}</div>
            <div class="muted text-sm mono">
              {{ row.referrer?.inviteCode || "" }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="牵线时间" width="170">
          <template #default="{ row }">{{
            formatTime(row.matchedAt)
          }}</template>
        </el-table-column>
        <el-table-column label="备注" prop="note" />
        <el-table-column label="录入人" prop="createdBy" width="120" />
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetch"
          @size-change="fetch"
        />
      </div>
    </el-card>

    <el-dialog
      v-model="dialogOpen"
      title="新增牵线记录"
      width="560px"
      destroy-on-close
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100">
        <el-form-item label="孩子 A" prop="profileAId">
          <el-select
            v-model="form.profileAId"
            filterable
            placeholder="选择审核通过的孩子"
            style="width: 100%"
            ><el-option
              v-for="c in children"
              :key="c.id"
              :value="c.id"
              :label="`${c.profileNumber} · ${c.payload.nickname || '孩子'} · ${c.parentName}`"
          /></el-select>
        </el-form-item>
        <el-form-item label="孩子 B" prop="profileBId">
          <el-select
            v-model="form.profileBId"
            filterable
            placeholder="选择另一位审核通过的孩子"
            style="width: 100%"
            ><el-option
              v-for="c in children"
              :key="c.id"
              :value="c.id"
              :label="`${c.profileNumber} · ${c.payload.nickname || '孩子'} · ${c.parentName}`"
          /></el-select>
        </el-form-item>
        <el-form-item label="介绍人" prop="referrerId">
          <el-select
            v-model="form.referrerId"
            filterable
            clearable
            placeholder="选填，默认平台人工牵线"
            style="width: 100%"
            ><el-option
              v-for="r in referrers"
              :key="r.id"
              :value="r.id"
              :label="r.nickname"
          /></el-select>
        </el-form-item>
        <el-form-item label="牵线时间" prop="matchedAt">
          <el-date-picker
            v-model="form.matchedAt"
            type="datetime"
            placeholder="选择日期时间"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.note"
            type="textarea"
            :rows="2"
            placeholder="可选"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogOpen = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="onCreate"
          >提交</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage, FormInstance, FormRules } from "element-plus";
import dayjs from "dayjs";
import { get, post } from "@/api/request";

const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const filters = reactive<{ referrerId: string; from: string; to: string }>({
  referrerId: "",
  from: "",
  to: "",
});

const fetch = async () => {
  loading.value = true;
  try {
    const params: any = { page: page.value, pageSize: pageSize.value };
    if (filters.referrerId) params.referrerId = filters.referrerId;
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;
    const res = await get<{ total: number; items: any[] }>(
      "/api/v1/admin/matches",
      params,
    );
    list.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const onSearch = () => {
  page.value = 1;
  fetch();
};
const onReset = () => {
  filters.referrerId = "";
  filters.from = "";
  filters.to = "";
  onSearch();
};

const dialogOpen = ref(false);
const creating = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({
  profileAId: "",
  profileBId: "",
  referrerId: "",
  matchedAt: new Date(),
  note: "",
});

const rules: FormRules = {
  profileAId: [{ required: true, message: "请填写孩子 A ID" }],
  profileBId: [{ required: true, message: "请填写孩子 B ID" }],
  matchedAt: [{ required: true, message: "请选择牵线时间" }],
};

const children = ref<any[]>([]),
  referrers = ref<any[]>([]);
const openCreate = async () => {
  children.value = (
    await get<{ items: any[] }>("/api/v1/admin/children", {
      approved: true,
      pageSize: 100,
    })
  ).items;
  referrers.value = (
    await get<{ items: any[] }>("/api/v1/admin/referrers", { pageSize: 100 })
  ).items.filter((r) => r.status === 1);
  Object.assign(form, {
    profileAId: "",
    profileBId: "",
    referrerId: "",
    matchedAt: new Date(),
    note: "",
  });
  dialogOpen.value = true;
};

const onCreate = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    creating.value = true;
    try {
      await post("/api/v1/admin/matches", {
        profileAId: Number(form.profileAId),
        profileBId: Number(form.profileBId),
        referrerId: form.referrerId ? Number(form.referrerId) : undefined,
        matchedAt: new Date(form.matchedAt).toISOString(),
        note: form.note || undefined,
      });
      ElMessage.success("录入成功");
      dialogOpen.value = false;
      fetch();
    } finally {
      creating.value = false;
    }
  });
};

const formatTime = (t: string) => dayjs(t).format("YYYY-MM-DD HH:mm");

onMounted(fetch);
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
.filters {
  margin-bottom: 16px;
}
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
