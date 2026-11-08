<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">待审核孩子资料</span>
          <span class="muted text-sm">共 {{ total }} 条</span>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe border>
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="孩子资料 ID" prop="profileId" width="120" />
        <el-table-column label="孩子称呼"
          ><template #default="{ row }">{{
            row.payload.nickname || "未填写"
          }}</template></el-table-column
        >
        <el-table-column label="登记父母" prop="parentName" />
        <el-table-column label="父母手机号" prop="phone" width="150" />
        <el-table-column label="孩子照片" width="100"
          ><template #default="{ row }"
            >{{ row.payload.photos?.length || 0 }} 张</template
          ></el-table-column
        >
        <el-table-column label="提交时间" width="170">
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
              @click="openDetail(row.id)"
              >查看详情</el-button
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
          @current-change="fetch"
          @size-change="fetch"
        />
      </div>
    </el-card>

    <ProfileReviewDrawer
      v-model="drawerOpen"
      :pending-id="currentId"
      @reviewed="fetch"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import dayjs from "dayjs";
import { get } from "@/api/request";
import ProfileReviewDrawer from "./ProfileReviewDrawer.vue";

const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const drawerOpen = ref(false);
const currentId = ref<string | null>(null);

const fetch = async () => {
  loading.value = true;
  try {
    const res = await get<{ total: number; items: any[] }>(
      "/api/v1/admin/profiles/pending",
      {
        page: page.value,
        pageSize: pageSize.value,
      },
    );
    list.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const openDetail = (id: string) => {
  currentId.value = id;
  drawerOpen.value = true;
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
.pager {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
