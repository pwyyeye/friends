<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="card-title">操作日志</span>
          <span class="muted text-sm">共 {{ total }} 条</span>
        </div>
      </template>

      <el-form :inline="true" :model="filters" class="filters">
        <el-form-item label="动作">
          <el-select v-model="filters.action" placeholder="全部" clearable style="width: 200px">
            <el-option label="资料审核通过" value="profile.approve" />
            <el-option label="资料审核驳回" value="profile.reject" />
            <el-option label="新增牵线记录" value="match.create" />
            <el-option label="转让介绍人" value="user.transfer_referrer" />
            <el-option label="禁用用户" value="user.disable" />
            <el-option label="更新用户" value="user.update" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="list" v-loading="loading" stripe border>
        <el-table-column label="时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作人" width="160">
          <template #default="{ row }">
            <div>{{ row.admin?.username || '-' }}</div>
            <el-tag size="small" effect="plain" :type="row.admin?.role === 'super_admin' ? 'danger' : 'info'">
              {{ row.admin?.role === 'super_admin' ? '超管' : '运营' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="动作" width="180">
          <template #default="{ row }">
            <el-tag size="small" effect="plain">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="对象">
          <template #default="{ row }">
            <span class="mono">{{ row.targetType }}#{{ row.targetId || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="上下文">
          <template #default="{ row }">
            <code class="payload">{{ JSON.stringify(row.payload) }}</code>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[30, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="fetch"
          @size-change="fetch"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { get } from '@/api/request';

const list = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(30);
const loading = ref(false);
const filters = reactive({ action: '' });

const fetch = async () => {
  loading.value = true;
  try {
    const res = await get<{ total: number; items: any[] }>('/api/v1/admin/audit-logs', {
      page: page.value,
      pageSize: pageSize.value,
      action: filters.action || undefined,
    });
    list.value = res.items;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
};

const onSearch = () => { page.value = 1; fetch(); };
const onReset = () => { filters.action = ''; onSearch(); };
const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm:ss');

onMounted(fetch);
</script>

<style scoped>
.page { display: flex; flex-direction: column; gap: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.card-title { font-weight: 600; }
.filters { margin-bottom: 16px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
.payload {
  font-size: 12px;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 2px;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, Menlo, Consolas, monospace;
}
</style>