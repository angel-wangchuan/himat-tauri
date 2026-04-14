/**
 * 系统设置状态管理
 *
 * 负责：
 * - 主题模式管理（light/dark/auto）
 * - 主题颜色管理
 * - WebView 代理配置
 *
 * 所有设置自动持久化到 localStorage
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import { applyThemeColor, applyThemeMode, type ThemeMode } from "@/utils/theme";

// ==================== 类型定义 ====================

/**
 * 设置中的主题模式类型（与 ThemeMode 保持一致）
 */
export type SettingsMode = ThemeMode;

// ==================== Store 定义 ====================

export const useSettingsStore = defineStore(
  "settings",
  () => {
    // ==================== 状态 ====================

    /** 主题模式（light/dark/auto） */
    const mode = ref<SettingsMode>("light");

    /** 主题颜色方案 ID */
    const color = ref<string>("default");

    /** WebView 代理 URL */
    const webviewProxy = ref<string>("");

    // ==================== Mutations ====================

    /**
     * 设置主题颜色
     *
     * 同时更新 DOM 属性以应用新颜色
     *
     * @param next - 颜色方案 ID
     */
    function setColor(next: string) {
      color.value = next;
      applyThemeColor(next);
    }

    /**
     * 设置主题模式
     *
     * 同时更新 DOM class 和 style 以应用新模式
     *
     * @param next - 主题模式（light/dark/auto）
     */
    function setMode(next: SettingsMode) {
      mode.value = next;
      applyThemeMode(next);
    }

    /**
     * 设置 WebView 代理
     *
     * @param proxy - 代理 URL（如 http://127.0.0.1:7890）
     */
    function setWebviewProxy(proxy: string) {
      webviewProxy.value = proxy;
    }

    // ==================== 导出 ====================

    return {
      // 状态
      mode,
      color,
      webviewProxy,

      // Mutations
      setColor,
      setMode,
      setWebviewProxy,
    };
  },
  {
    persist: true, // 启用持久化到 localStorage
  },
);
