<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">介绍人列表</span>
          <span class="muted text-sm">共 {{ total }} 名介绍人</span>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filters">
        <el-form-item label="关键字">
          <el-input v-model="filters.keyword" placeholder="昵称 / 手机号 / 邀请码" clearable style="width: 240px" @keyup.enter="onSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe border>
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="邀请码" prop="inviteCode" width="120" />
        <el-table-column label="昵称" prop="nickname" width="120" />
        <el-table-column label="手机号" prop="phone" width="140" />
        <el-table-column label="邀请人数" prop="inviteeCount" width="100" />
        <el-table-column label="账号" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.status === 1 ? 'success' : 'danger'" effect="plain">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="注册时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openInvitees(row)">查看邀请</el-button>
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

    <el-drawer v-model="drawerOpen" title="邀请记录" size="640px" direction="rtl">
      <div v-loading="inviteesLoading" class="invitees">
        <el-table :data="invitees" border size="small">
          <el-table-column label="昵称" prop="nickname" width="120" />
          <el-table-column label="手机号" width="140">
            <template #default="{ row }">{{ row.phone ? row.phone.slice(0,3) + '****' + row.phone.slice(-4) : '-' }}</template>
          </el-table-column>
          <el-table-column label="性别" width="60">
            <template #default="{ row }">{{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '-' }}</template>
          </el-table-column>
          <el-table-column label="年龄" prop="age" width="60" />
          <el-table-column label="资料状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="profileTagType(row.profileStatus)">
                {{ profileLabel(row.profileStatus) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="注册时间" width="170">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { get } from '@/api/request';

const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);
const filters = reactive({ keyword: '' });

const drawerOpen = ref(false);
const invitees = ref<any[]>([]);
const inviteesLoading = ref(false);

const fetch = async () => {
  loading.value = true;
  try {
    const res = await get<{ total: number; items: any[] }>('/api/v1/admin/referrers', {
      page: page.value,
      pageSize: pageSize.value,
      keyword: filters.keyword || undefined,
    });
    list.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const onSearch = () => { page.value = 1; fetch(); };
const onReset = () => { filters.keyword = ''; onSearch(); };

const openInvitees = async (row: any) => {
  drawerOpen.value = true;
  inviteesLoading.value = true;
  try {
    invitees.value = await get(`/api/v1/admin/referrers/${row.id}/invitees`);
  } finally {
    inviteesLoading.value = false;
  }
};

const profileLabel = (s: number) => ['未提交', '待审核', '已通过', '已驳回'][s] || '-';
const profileTagType = (s: number) => ['info', 'warning', 'success', 'danger'][s] || 'info';
const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm');

onMounted(fetch);
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-weight: 600; }
.filters { margin-bottom: 16px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
.invitees { padding: 0 16px; }
</style>