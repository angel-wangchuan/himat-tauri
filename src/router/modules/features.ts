/**
 * 功能模块路由配置
 *
 * 包含所有业务功能页面的路由定义
 */

import type { RouteRecordRaw } from "vue-router";
import { HOME_ROUTE_NAME, BROWSER_ROUTE_NAME } from "@/config/constants";

export const featureRoutes: RouteRecordRaw[] = [
  {
    path: "home",
    name: HOME_ROUTE_NAME,
    component: () => import("@/views/home/index.vue"),
    meta: { requiresAuth: true, title: "首页" },
  },
  {
    path: "chat",
    name: "Chat",
    component: () => import("@/views/chat/index.vue"),
    meta: { requiresAuth: true, title: "聊天" },
  },
  {
    path: "chatStore",
    name: "ChatStore",
    component: () => import("@/views/chat/store.vue"),
    meta: { requiresAuth: true, title: "聊天商店" },
  },
  {
    path: "agent",
    name: "Agent",
    component: () => import("@/views/agent/index.vue"),
    meta: { requiresAuth: true, title: "AI Agent" },
  },
  {
    path: "apps",
    name: "Apps",
    component: () => import("@/views/apps/index.vue"),
    meta: { requiresAuth: true, title: "应用市场" },
  },
  {
    path: "browser/:tabId",
    name: BROWSER_ROUTE_NAME,
    component: () => import("@/views/browser/index.vue"),
    meta: { requiresAuth: true, title: "浏览器" },
  },
  {
    path: "knowledge",
    name: "Knowledge",
    component: () => import("@/views/knowledge/index.vue"),
    meta: { requiresAuth: true, title: "知识库" },
  },
  {
    path: "drawing",
    name: "Drawing",
    component: () => import("@/views/drawing/index.vue"),
    meta: { requiresAuth: true, title: "绘图" },
  },
  {
    path: "translate",
    name: "Translate",
    component: () => import("@/views/translate/index.vue"),
    meta: { requiresAuth: true, title: "翻译" },
  },
  {
    path: "files",
    name: "Files",
    component: () => import("@/views/files/index.vue"),
    meta: { requiresAuth: true, title: "文件管理" },
  },
  {
    path: "code",
    name: "Code",
    component: () => import("@/views/code/index.vue"),
    meta: { requiresAuth: true, title: "代码编辑" },
  },
  {
    path: "notes",
    name: "Notes",
    component: () => import("@/views/notes/index.vue"),
    meta: { requiresAuth: true, title: "笔记" },
  },
  {
    path: "workflow",
    name: "Workflow",
    component: () => import("@/views/workflow/index.vue"),
    meta: { requiresAuth: true, title: "工作流" },
  },
];
