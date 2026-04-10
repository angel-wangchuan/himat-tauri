import { App } from "vue";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { storeToRefs } from "pinia";

import { store } from "@/store";
import { useUserStore } from "@/store/modules/user";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Index",
    component: () => import("@/views/index/index.vue"),
    redirect: { name: "Home" },
    meta: { requiresAuth: true },
    children: [
      {
        path: "home",
        name: "Home",
        component: () => import("@/views/home/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "settings",
        name: "Settings",
        component: () => import("@/views/settings/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "chat",
        name: "Chat",
        component: () => import("@/views/chat/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "chatStore",
        name: "ChatStore",
        component: () => import("@/views/chat/store.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "agent",
        name: "Agent",
        component: () => import("@/views/agent/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "apps",
        name: "Apps",
        component: () => import("@/views/apps/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "browser/:tabId",
        name: "Browser",
        component: () => import("@/views/browser/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "knowledge",
        name: "Knowledge",
        component: () => import("@/views/knowledge/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "drawing",
        name: "Drawing",
        component: () => import("@/views/drawing/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "translate",
        name: "Translate",
        component: () => import("@/views/translate/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "files",
        name: "Files",
        component: () => import("@/views/files/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "code",
        name: "Code",
        component: () => import("@/views/code/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "notes",
        name: "Notes",
        component: () => import("@/views/notes/index.vue"),
        meta: { requiresAuth: true },
      },
      {
        path: "workflow",
        name: "Workflow",
        component: () => import("@/views/workflow/index.vue"),
        meta: { requiresAuth: true },
      },
    ],
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: { guestOnly: true },
  },
];

// 创建路由实例
export const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const userStore = useUserStore(store);
  const { isLogin, accessToken } = storeToRefs(userStore);
  const isAuthenticated = Boolean(isLogin.value && accessToken.value);

  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: "Login" };
  }

  if (to.meta.guestOnly && isAuthenticated) {
    return { name: "Home" };
  }

  return true;
});

// 初始化路由
export function initRouter(app: App<Element>): void {
  app.use(router);
}
