/**
 * 设置模块路由配置
 */

import type { RouteRecordRaw } from "vue-router";

export const settingsRoutes: RouteRecordRaw[] = [
  {
    path: "settings",
    name: "Settings",
    component: () => import("@/views/settings/index.vue"),
    meta: { requiresAuth: true, title: "设置" },
  },
];
