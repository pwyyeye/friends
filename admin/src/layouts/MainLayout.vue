<template>
  <el-container class="layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="aside">
      <div class="brand" :class="{ collapsed }">
        <div class="brand-mark">F</div>
        <div v-if="!collapsed" class="brand-text">
          <div class="brand-name">Friends</div>
          <div class="brand-sub">管理后台</div>
        </div>
      </div>

      <el-menu
        :default-active="active"
        router
        class="menu"
        :collapse="collapsed"
        background-color="transparent"
        text-color="#cbd5e1"
        active-text-color="#ffffff"
        unique-opened
      >
        <el-menu-item v-for="item in menus" :key="item.path" :index="item.path">
          <span class="menu-icon" :class="`tone-${item.tone}`">
            <el-icon><component :is="item.iconComp" /></el-icon>
          </span>
          <template #title>
            <span class="menu-label">{{ item.title }}</span>
          </template>
        </el-menu-item>
      </el-menu>

      <div class="aside-footer">
        <el-button text class="collapse-btn" @click="collapsed = !collapsed">
          <el-icon><component :is="collapsed ? 'Expand' : 'Fold'" /></el-icon>
          <span v-if="!collapsed" class="ml-1">收起菜单</span>
        </el-button>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/" class="crumb">
            <el-breadcrumb-item :to="{ path: '/dashboard' }"
              >首页</el-breadcrumb-item
            >
            <el-breadcrumb-item v-if="pageTitle && pageTitle !== '看板'">{{
              pageTitle
            }}</el-breadcrumb-item>
          </el-breadcrumb>
          <div class="header-title">{{ pageTitle }}</div>
        </div>
        <div class="header-right">
          <el-tooltip content="刷新当前页" placement="bottom">
            <el-button text class="icon-btn" @click="onRefresh"
              ><el-icon><Refresh /></el-icon
            ></el-button>
          </el-tooltip>
          <el-divider direction="vertical" />
          <span class="muted text-sm"
            >{{ greeting }}，{{ auth.admin?.username || "管理员" }}</span
          >
          <el-tag
            size="small"
            :type="auth.isSuperAdmin ? 'danger' : 'info'"
            effect="plain"
            round
          >
            {{ auth.admin?.role === "super_admin" ? "超级管理员" : "运营" }}
          </el-tag>
          <el-button text size="small" @click="onLogout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="main">
        <router-view v-slot="{ Component, route }">
          <transition name="fade-page" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, h, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import * as ElIcons from "@element-plus/icons-vue";
import { post } from "@/api/request";
import { useAuthStore } from "@/store/auth";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const collapsed = ref(false);

const active = computed(() => route.path);

const iconMap = ElIcons as unknown as Record<string, any>;
const resolveIcon = (name: string) => iconMap[name] ?? iconMap.Document;

const menus = computed(() =>
  router
    .getRoutes()
    .filter(
      (r) =>
        r.meta?.title &&
        r.path.startsWith("/") &&
        !r.meta?.public &&
        r.path !== "/",
    )
    .filter((r) => r.path !== "/:pathMatch(.*)*")
    .map((r) => ({
      path: r.path,
      title: r.meta.title as string,
      icon: (r.meta.icon as string) || "Document",
      tone: (r.meta.tone as string) || "neutral",
      iconComp: resolveIcon((r.meta.icon as string) || "Document"),
    })),
);

const pageTitle = computed(() => (route.meta?.title as string) || "看板");

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 11) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
});

const onRefresh = () => {
  router.replace({ path: "/redirect" + route.fullPath }).catch(() => {});
  // 简易刷新：跳到 redirect 中转再回来
  setTimeout(() => {
    router
      .replace({ path: route.fullPath, query: { _: Date.now().toString() } })
      .catch(() => {});
  }, 10);
};

const onLogout = async () => {
  await post("/api/v1/auth/logout");
  auth.logout();
  ElMessage.success("已退出登录");
  router.push("/login");
};

// 保留未使用的 h 引入，避免 TS 警告被消除
void h;
</script>

<style scoped>
.layout {
  height: 100vh;
}

.aside {
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  color: #cbd5e1;
  display: flex;
  flex-direction: column;
  transition: width 0.2s ease;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.brand.collapsed {
  justify-content: center;
  padding: 18px 0;
}
.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #3b82f6 0%, #1f3a5f 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}
.brand-text {
  display: flex;
  flex-direction: column;
}
.brand-name {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
}
.brand-sub {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.menu {
  flex: 1;
  border-right: none;
  padding: 8px 0;
}
:deep(.el-menu-item) {
  height: 44px;
  line-height: 44px;
  margin: 4px 10px;
  border-radius: 6px;
  padding-left: 12px !important;
}
:deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.04) !important;
}
:deep(.el-menu-item.is-active) {
  background: rgba(59, 130, 246, 0.12) !important;
  color: #ffffff !important;
}

.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-right: 10px;
  border-radius: 6px;
  font-size: 14px;
  flex-shrink: 0;
  transition: transform 0.15s ease;
}
:deep(.el-menu-item:hover .menu-icon) {
  transform: scale(1.05);
}

.tone-primary {
  background: rgba(59, 130, 246, 0.15);
  color: #60a5fa;
}
.tone-info {
  background: rgba(74, 91, 115, 0.25);
  color: #93c5fd;
}
.tone-success {
  background: rgba(47, 125, 79, 0.25);
  color: #6ee7b7;
}
.tone-warning {
  background: rgba(176, 125, 47, 0.25);
  color: #fcd34d;
}
.tone-danger {
  background: rgba(179, 74, 63, 0.25);
  color: #fca5a5;
}
.tone-neutral {
  background: rgba(148, 163, 184, 0.18);
  color: #cbd5e1;
}

:deep(.el-menu-item.is-active .menu-icon) {
  background: var(--color-primary);
  color: #ffffff;
}

.menu-label {
  font-size: 14px;
}
.menu-badge {
  margin-left: auto;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.aside-footer {
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.collapse-btn {
  width: 100%;
  color: #9ca3af !important;
  display: flex;
  align-items: center;
  justify-content: center;
}
.collapse-btn:hover {
  color: #ffffff !important;
}

.header {
  background: #ffffff;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 60px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}
.crumb {
  font-size: 12px;
}
.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  border-left: 2px solid var(--color-border);
  padding-left: 12px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.icon-btn {
  font-size: 16px;
  padding: 6px;
}

.main {
  padding: 20px 24px;
  background: var(--color-bg-page);
  overflow: auto;
}

.fade-page-enter-active,
.fade-page-leave-active {
  transition: opacity 0.18s ease;
}
.fade-page-enter-from,
.fade-page-leave-to {
  opacity: 0;
}

.ml-1 {
  margin-left: 6px;
}
</style>
