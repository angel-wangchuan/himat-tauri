/**
 * 路由配置主文件
 *
 * 负责：
 * - 路由实例创建
 * - 路由守卫注册
 * - 模块化路由汇总
 */

import { App } from "vue";
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { storeToRefs } from "pinia";

import { store } from "@/store";
import { useUserStore } from "@/store/modules/user";
import { featureRoutes } from "./modules/features";
import { settingsRoutes } from "./modules/settings";
import { LOGIN_ROUTE_NAME, HOME_ROUTE_NAME } from "@/config/constants";

// ==================== 路由配置 ====================

/**
 * 主布局路由（需要认证）
 */
const mainLayoutRoute: RouteRecordRaw = {
  path: "/",
  name: "Index",
  component: () => import("@/views/index/index.vue"),
  redirect: { name: HOME_ROUTE_NAME },
  meta: { requiresAuth: true },
  children: [...featureRoutes, ...settingsRoutes],
};

/**
 * 认证路由（仅访客可访问）
 */
const authRoutes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: LOGIN_ROUTE_NAME,
    component: () => import("@/views/login/index.vue"),
    meta: { guestOnly: true, title: "登录" },
  },
];

/**
 * 所有路由
 */
const routes: RouteRecordRaw[] = [mainLayoutRoute, ...authRoutes];

// ==================== 路由实例 ====================

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// ==================== 路由守卫 ====================

/**
 * 全局前置守卫
 *
 * 认证逻辑：
 * - requiresAuth: 需要登录才能访问
 * - guestOnly: 仅未登录用户可访问
 */
router.beforeEach((to) => {
  const userStore = useUserStore(store);
  const { isLogin, accessToken } = storeToRefs(userStore);
  const isAuthenticated = Boolean(isLogin.value && accessToken.value);

  // 需要认证的路由
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: LOGIN_ROUTE_NAME };
  }

  // 仅访客可访问的路由
  if (to.meta.guestOnly && isAuthenticated) {
    return { name: HOME_ROUTE_NAME };
  }

  return true;
});

// ==================== 初始化函数 ====================

/**
 * 初始化路由
 *
 * @param app - Vue 应用实例
 */
export function initRouter(app: App<Element>): void {
  app.use(router);
}
