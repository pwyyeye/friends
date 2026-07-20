<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="brand">
        <span class="brand-name">Friends</span>
        <span class="brand-sub">管理后台</span>
      </div>
      <el-menu
        :default-active="active"
        router
        class="menu"
        background-color="#1f2937"
        text-color="#cbd5e1"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>看板</span>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        <el-menu-item index="/referrers">
          <el-icon><UserFilled /></el-icon>
          <span>介绍人管理</span>
        </el-menu-item>
        <el-menu-item index="/profiles">
          <el-icon><Document /></el-icon>
          <span>资料审核</span>
        </el-menu-item>
        <el-menu-item index="/matches">
          <el-icon><Connection /></el-icon>
          <span>牵线记录</span>
        </el-menu-item>
        <el-menu-item index="/audit">
          <el-icon><Tickets /></el-icon>
          <span>操作日志</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-title">{{ pageTitle }}</div>
        <div class="header-right">
          <span class="muted text-sm">{{ auth.admin?.username }}</span>
          <el-tag size="small" :type="auth.isSuperAdmin ? 'danger' : 'info'" effect="plain">
            {{ auth.admin?.role === 'super_admin' ? '超级管理员' : '运营' }}
          </el-tag>
          <el-button text size="small" @click="onLogout">退出</el-button>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const active = computed(() => route.path);
const pageTitle = computed(() => (route.meta?.title as string) || '');

const onLogout = () => {
  auth.logout();
  router.push('/login');
};
</script>

<style scoped>
.layout { height: 100vh; }

.aside {
  background: #1f2937;
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
}

.brand {
  padding: 20px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-bottom: 1px solid #374151;
}
.brand-name {
  font-size: 18px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
}
.brand-sub {
  font-size: 12px;
  color: #9ca3af;
}

.menu {
  flex: 1;
  border-right: none;
}
:deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
}
:deep(.el-menu-item.is-active) {
  background: #111827 !important;
  border-left: 3px solid var(--color-primary);
}

.header {
  background: #ffffff;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
}
.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.main {
  padding: 24px;
  background: var(--color-bg-page);
  overflow: auto;
}
</style>