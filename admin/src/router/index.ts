import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { useAuthStore } from "@/store/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    component: () => import("@/views/login/LoginPage.vue"),
    meta: { public: true },
  },
  {
    path: "/",
    component: () => import("@/layouts/MainLayout.vue"),
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("@/views/dashboard/DashboardPage.vue"),
        meta: { title: "看板", icon: "DataAnalysis", tone: "primary" },
      },
      {
        path: "users",
        component: () => import("@/views/users/UsersPage.vue"),
        meta: { title: "父母账号", icon: "User", tone: "info" },
      },
      {
        path: "children",
        component: () => import("@/views/children/ChildrenPage.vue"),
        meta: { title: "孩子档案", icon: "Document", tone: "info" },
      },
      {
        path: "referrers",
        component: () => import("@/views/referrers/ReferrersPage.vue"),
        meta: { title: "介绍人管理", icon: "UserFilled", tone: "success" },
      },
      {
        path: "profiles",
        component: () => import("@/views/profiles/ProfilesPage.vue"),
        meta: { title: "资料审核", icon: "Document", tone: "warning" },
      },
      {
        path: "matches",
        component: () => import("@/views/matches/MatchesPage.vue"),
        meta: { title: "牵线记录", icon: "Connection", tone: "danger" },
      },
      {
        path: "audit",
        component: () => import("@/views/audit/AuditPage.vue"),
        meta: { title: "操作日志", icon: "Tickets", tone: "neutral" },
      },
      {
        path: "features",
        component: () => import("@/views/features/FeaturesPage.vue"),
        meta: { title: "功能开关", icon: "Setting", tone: "primary" },
      },
    ],
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.token) {
    next("/login");
  } else {
    next();
  }
});

export default router;
