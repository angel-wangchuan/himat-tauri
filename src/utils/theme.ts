/**
 * 主题管理工具
 *
 * 负责：
 * - 主题模式切换（light/dark/auto）
 * - 主题颜色应用
 * - DOM 属性更新
 *
 * 注意：localStorage 由 Pinia persist 插件统一管理，
 * 此模块只负责 DOM 操作，不直接读写 localStorage
 */

import { COLOR_ATTRIBUTE, DARK_MEDIA_QUERY } from "@/config/constants";

// ==================== 类型定义 ====================

/**
 * 主题模式类型
 */
export type ThemeMode = "light" | "dark" | "auto";

// ==================== 工具函数 ====================

/**
 * 解析主题模式
 *
 * 当 mode 为 auto 时，根据系统偏好返回 dark 或 light
 *
 * @param mode - 主题模式
 * @returns 解析后的具体模式（light 或 dark）
 *
 * @example
 * ```ts
 * resolveThemeMode("auto") // => "dark" 或 "light"（取决于系统设置）
 * resolveThemeMode("dark") // => "dark"
 * ```
 */
export function resolveThemeMode(mode: ThemeMode): "light" | "dark" {
  if (mode === "auto") {
    return window.matchMedia(DARK_MEDIA_QUERY).matches ? "dark" : "light";
  }
  return mode;
}

/**
 * 应用主题颜色
 *
 * 通过设置 data-color 属性来切换 CSS 变量
 *
 * @param color - 颜色方案 ID（如 "default", "green", "purple" 等）
 *
 * @example
 * ```ts
 * applyThemeColor("green"); // 切换到绿色主题
 * ```
 */
export function applyThemeColor(color: string) {
  document.documentElement.setAttribute(COLOR_ATTRIBUTE, color);
}

/**
 * 应用主题模式
 *
 * - 更新 HTML class（dark 类）
 * - 更新 colorScheme 样式
 * - 不操作 localStorage（由 Pinia persist 管理）
 *
 * @param mode - 主题模式（light/dark/auto）
 *
 * @example
 * ```ts
 * applyThemeMode("dark"); // 切换到暗黑模式
 * ```
 */
export function applyThemeMode(mode: ThemeMode) {
  const resolvedMode = resolveThemeMode(mode);

  // 切换 dark class
  document.documentElement.classList.toggle("dark", resolvedMode === "dark");

  // 更新 colorScheme 以支持浏览器原生深色模式适配
  document.documentElement.style.colorScheme = resolvedMode;

  // 注意：不再写入 localStorage，由 Pinia persist 插件统一管理
}

/**
 * 从存储中读取主题设置并应用
 *
 * @deprecated 此函数已废弃，主题设置应由 Pinia store 管理
 * 保留此函数仅用于向后兼容
 */
export function applyStoredThemeSettings() {
  console.warn("[Deprecated] applyStoredThemeSettings is deprecated. Use Pinia store instead.");
  // 此函数已废弃，主题设置应由 Pinia store 管理
}
