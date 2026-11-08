<template>
  <el-card
    ><template #header
      ><div class="card-header">
        <strong>孩子档案</strong
        ><span class="muted">共 {{ total }} 份资料</span>
      </div></template
    ><el-form inline
      ><el-form-item label="审核状态"
        ><el-select
          v-model="status"
          clearable
          style="width: 140px"
          @change="search"
          ><el-option
            v-for="(label, i) in labels"
            :key="i"
            :value="i"
            :label="label" /></el-select></el-form-item
      ><el-button @click="load">刷新</el-button></el-form
    ><el-table :data="list" v-loading="loading" border stripe
      ><el-table-column
        prop="profileNumber"
        label="资料编号"
        width="130"
      /><el-table-column label="孩子称呼"
        ><template #default="{ row }">{{
          row.payload.nickname || "未填写"
        }}</template></el-table-column
      ><el-table-column label="性别" width="70"
        ><template #default="{ row }">{{
          row.payload.gender === 1
            ? "男"
            : row.payload.gender === 2
              ? "女"
              : "未填"
        }}</template></el-table-column
      ><el-table-column label="年龄" width="70"
        ><template #default="{ row }">{{
          row.payload.age ?? "未填"
        }}</template></el-table-column
      ><el-table-column label="现居城市"
        ><template #default="{ row }">{{
          row.payload.cityName
        }}</template></el-table-column
      ><el-table-column label="学历"
        ><template #default="{ row }">{{
          row.payload.educationLabel
        }}</template></el-table-column
      ><el-table-column prop="parentName" label="登记父母" /><el-table-column
        prop="phone"
        label="父母手机号"
        width="150"
      /><el-table-column label="状态" width="100"
        ><template #default="{ row }">{{
          labels[row.profileStatus]
        }}</template></el-table-column
      ><el-table-column label="操作" width="100"
        ><template #default="{ row }"
          ><el-button
            text
            @click="
              current = row.ownerAccountId;
              drawer = true;
            "
            >详情</el-button
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
  /></el-card>
</template>
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { get } from "@/api/request";
import UserDetailDrawer from "@/views/users/UserDetailDrawer.vue";
const labels = ["未提交", "待审核", "已通过", "已驳回"],
  list = ref<any[]>([]),
  total = ref(0),
  page = ref(1),
  status = ref<number>(),
  loading = ref(false),
  drawer = ref(false),
  current = ref<string | null>(null);
async function load() {
  loading.value = true;
  try {
    const r = await get<{ total: number; items: any[] }>(
      "/api/v1/admin/children",
      { page: page.value, profileStatus: status.value },
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
</style>
