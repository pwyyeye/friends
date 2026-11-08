import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import { useFeaturesStore } from '@/store/features';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/home' },
  {
    path: '/login',
    component: () => import('@/views/register/LoginPage.vue'),
    meta: { public: true },
  },
  {
    path: '/register',
    component: () => import('@/views/register/RegisterPage.vue'),
    meta: { public: true },
  },
  {
    path: '/legal/:kind',
    component: () => import('@/views/legal/LegalPage.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    children: [
      {
        path: 'home',
        component: () => import('@/views/home/HomePage.vue'),
        meta: { title: '今日推荐', home: true, public: true },
      },
      {
        path: 'accelerate',
        component: () => import('@/views/accelerate/AcceleratePage.vue'),
        meta: { title: '加速脱单', customHeader: true, feature: 'accelerate' },
      },
      {
        path: 'messages',
        component: () => import('@/views/messages/MessagesPage.vue'),
        meta: { title: '消息', customHeader: true, feature: 'messages' },
      },
      {
        path: 'activity/:kind',
        component: () => import('@/views/activity/ActivityPage.vue'),
        meta: { title: '互动记录', customHeader: true },
      },
      {
        path: 'recommendations/:id',
        name: 'recommendation-detail',
        component: () => import('@/views/home/RecommendationDetailPage.vue'),
        meta: { title: '相亲资料', customHeader: true, recommendationDetail: true },
      },
      {
        path: 'profile',
        component: () => import('@/views/profile/ProfilePage.vue'),
        meta: { title: '相亲资料', tab: '/me', back: true, backTo: '/me' },
      },
      {
        path: 'me',
        component: () => import('@/views/me/MePage.vue'),
        meta: { title: '我的', customHeader: true },
      },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

let recommendationScroll = { left: 0, top: 0 };
const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (from.meta.home && to.meta.recommendationDetail) {
      recommendationScroll = { left: window.scrollX, top: window.scrollY };
    }
    if (savedPosition) return savedPosition;
    if (to.meta.home && from.meta.recommendationDetail) return recommendationScroll;
    return { left: 0, top: 0 };
  },
});

router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore();
  if (!to.meta.public && !auth.token) {
    next({ path: '/login', query: to.query });
    return;
  }
  const features = useFeaturesStore();
  await features.load();
  let required = to.meta.feature as keyof typeof features.flags | undefined;
  if (to.path.startsWith('/activity/')) {
    const kind = String(to.params.kind || '');
    if (kind === 'favorite') required = 'favorite';
    if (kind === 'unlock') required = 'unlock';
  }
  if (required && !features.isEnabled(required)) {
    next('/home');
    return;
  }
  next();
});

export default router;
