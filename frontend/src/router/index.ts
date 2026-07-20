import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/profile' },
  { path: '/login', component: () => import('@/views/register/LoginPage.vue'), meta: { public: true } },
  { path: '/register', component: () => import('@/views/register/RegisterPage.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      { path: 'profile', component: () => import('@/views/profile/ProfilePage.vue'), meta: { title: '我的资料' } },
      { path: 'invite', component: () => import('@/views/invite/InvitePage.vue'), meta: { title: '我的邀请' } },
      { path: 'me', component: () => import('@/views/me/MePage.vue'), meta: { title: '我的' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.token) {
    next('/login');
  } else {
    next();
  }
});

export default router;