<script setup lang="ts">
/**
 * 主布局容器
 *
 * 负责：
 * - 应用级背景主题切换
 * - 全局右键菜单禁用
 * - Tauri 事件监听（导航等）
 */

import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import BackgroundDark from "@imgs/background-dark.png";
import BackgroundLight from "@imgs/background-light.png";
import { usePreferredDark } from "@vueuse/core";
import { storeToRefs } from "pinia";
import { computed, onMounted, onUnmounted } from "vue";
import { router } from "@/router";
import { useSettingsStore } from "@/store/modules/settings";
import { resolveThemeMode } from "@/utils/theme";

// ==================== 主题管理 ====================

const settingsStore = useSettingsStore();
const { mode } = storeToRefs(settingsStore);
const preferredDark = usePreferredDark();

/**
 * 解析后的当前主题（dark/light）
 * 当 mode 为 auto 时，根据系统偏好自动切换
 */
const resolvedTheme = computed(() =>
  mode.value === "auto" ? (preferredDark.value ? "dark" : "light") : resolveThemeMode(mode.value),
);

// ==================== 事件处理 ====================

/**
 * 禁用右键菜单
 */
function disableContextMenu(event: MouseEvent) {
  event.preventDefault();
}

/**
 * Tauri 导航事件清理函数
 */
let unlistenNavigate: UnlistenFn | null = null;

// ==================== 生命周期钩子 ====================

onMounted(async () => {
  // 监听 Tauri 导航事件
  unlistenNavigate = await listen<string>("navigate", (event) => {
    if (event.payload === "settings") {
      router.push("/settings");
    }
  });

  // 禁用全局右键菜单
  document.addEventListener("contextmenu", disableContextMenu);
});

onUnmounted(() => {
  // 清理 Tauri 事件监听器，防止内存泄漏
  unlistenNavigate?.();

  // 移除右键菜单禁用
  document.removeEventListener("contextmenu", disableContextMenu);
});
</script>

<template>
  <div
    class="h-dvh overflow-hidden"
    :style="{
      backgroundImage: `url(${resolvedTheme === 'dark' ? BackgroundDark : BackgroundLight})`,
    }"
  >
    <Tabs />
    <router-view />
  </div>
</template>
