<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">用户列表</span>
          <span class="muted text-sm">共 {{ total }} 个用户</span>
        </div>
      </template>

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
        <el-form-item label="资料状态">
          <el-select v-model="filters.profileStatus" placeholder="全部" clearable style="width: 140px">
            <el-option label="未提交" :value="0" />
            <el-option label="待审核" :value="1" />
            <el-option label="已通过" :value="2" />
            <el-option label="已驳回" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="账号状态">
          <el-select v-model="filters.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe border>
        <el-table-column label="ID" prop="id" width="80" />
        <el-table-column label="手机号" prop="phone" width="140" />
        <el-table-column label="昵称" prop="nickname" width="120" />
        <el-table-column label="性别" width="60">
          <template #default="{ row }">{{ row.gender === 1 ? '男' : row.gender === 2 ? '女' : '-' }}</template>
        </el-table-column>
        <el-table-column label="年龄" prop="age" width="60" />
        <el-table-column label="城市" prop="city" width="100" />
        <el-table-column label="职业" prop="occupation" width="120" />
        <el-table-column label="邀请码" prop="inviteCode" width="100" />
        <el-table-column label="介绍人" width="160">
          <template #default="{ row }">
            <span v-if="row.referrer">{{ row.referrer.nickname }} ({{ row.referrer.inviteCode }})</span>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="资料状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="profileTagType(row.profileStatus)">
              {{ profileLabel(row.profileStatus) }}
            </el-tag>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button text size="small" @click="openDetail(row.id)">详情</el-button>
            <el-button text size="small" type="danger" @click="onDisable(row)" v-if="row.status === 1">禁用</el-button>
            <el-button text size="small" @click="onEnable(row)" v-else>启用</el-button>
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

    <UserDetailDrawer v-model="drawerOpen" :user-id="currentId" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import dayjs from 'dayjs';
import { get, put } from '@/api/request';
import UserDetailDrawer from './UserDetailDrawer.vue';

interface UserRow {
  id: string;
  phone: string;
  nickname: string | null;
  gender: number | null;
  age: number | null;
  city: string | null;
  occupation: string | null;
  inviteCode: string | null;
  referrer: { id: string; nickname: string; inviteCode: string } | null;
  profileStatus: number;
  status: number;
  createdAt: string;
}

const list = ref<UserRow[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const loading = ref(false);

const filters = reactive({
  keyword: '',
  profileStatus: undefined as number | undefined,
  status: undefined as number | undefined,
});

const drawerOpen = ref(false);
const currentId = ref<string | null>(null);

const fetch = async () => {
  loading.value = true;
  try {
    const res = await get<{ total: number; items: UserRow[] }>('/api/v1/admin/users', {
      page: page.value,
      pageSize: pageSize.value,
      ...filters,
    });
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
  filters.keyword = '';
  filters.profileStatus = undefined;
  filters.status = undefined;
  onSearch();
};

const openDetail = (id: string) => {
  currentId.value = id;
  drawerOpen.value = true;
};

const onDisable = async (row: UserRow) => {
  await ElMessageBox.confirm(`确认禁用用户「${row.nickname || row.phone}」？`, '提示', { type: 'warning' });
  await put(`/api/v1/admin/users/${row.id}`, { status: 0 });
  ElMessage.success('已禁用');
  fetch();
};

const onEnable = async (row: UserRow) => {
  await put(`/api/v1/admin/users/${row.id}`, { status: 1 });
  ElMessage.success('已启用');
  fetch();
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
</style>