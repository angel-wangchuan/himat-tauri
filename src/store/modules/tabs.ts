/**
 * 浏览器标签页状态管理
 *
 * 负责：
 * - 标签页的打开/关闭
 * - 标签页历史记录
 * - Webview 标签管理
 * - 代理配置管理
 */

import { defineStore } from "pinia";
import { ref } from "vue";

import { resolveWebviewProxyUrl } from "@/utils/webviewProxy";
import { BROWSER_TAB_KEY_PREFIX, WEBVIEW_LABEL_PREFIX } from "@/config/constants";

// ==================== 类型定义 ====================

/**
 * 浏览器标签页接口
 */
export interface BrowserTab {
  /** 标签页唯一 ID */
  id: string;
  /** 标签页键名（用于路由） */
  key: string;
  /** 标签页显示名称 */
  label: string;
  /** 标签页图标 URL */
  icon: string;
  /** 目标 URL */
  url: string;
  /** Webview 标签名 */
  webviewLabel: string;
  /** 代理 URL（可选） */
  proxyUrl?: string;
}

/**
 * 打开浏览器标签的参数
 */
export interface OpenBrowserTabPayload {
  /** 标签页 ID */
  id: string;
  /** 标签页显示名称 */
  label: string;
  /** 标签页图标 URL */
  icon: string;
  /** 目标 URL */
  url: string;
  /** 代理 URL（可选） */
  proxyUrl?: string;
}

// ==================== 工具函数 ====================

/**
 * 创建浏览器标签页的键名
 *
 * @param id - 标签页 ID
 * @returns 格式化的键名（browser:{id}）
 */
export function createBrowserTabKey(id: string): string {
  return `${BROWSER_TAB_KEY_PREFIX}${id}`;
}

/**
 * 创建 Webview 标签名
 *
 * @param id - 标签页 ID
 * @param version - 版本号（用于刷新时生成新标签名）
 * @returns 格式化的 Webview 标签名
 */
function createBrowserWebviewLabel(id: string, version = 0): string {
  return `${WEBVIEW_LABEL_PREFIX}${id}-${version}`;
}

// ==================== Store 定义 ====================

export const useTabsStore = defineStore(
  "tabs",
  () => {
    // ==================== 状态 ====================

    /** 已访问的标签页键名列表（历史记录） */
    const visitedTabs = ref<string[]>([]);

    /** 当前打开的浏览器标签页列表 */
    const browserTabs = ref<BrowserTab[]>([]);

    // ==================== 辅助函数 ====================

    /**
     * 确保标签页在历史记录中
     *
     * @param tabName - 标签页键名
     */
    function ensureTab(tabName: string) {
      if (!visitedTabs.value.includes(tabName)) {
        visitedTabs.value.push(tabName);
      }
    }

    /**
     * 根据 ID 查找标签页
     *
     * @param id - 标签页 ID
     * @returns 匹配的标签页，未找到返回 undefined
     */
    function getBrowserTabById(id: string): BrowserTab | undefined {
      return browserTabs.value.find((tab) => tab.id === id);
    }

    /**
     * 根据键名查找标签页
     *
     * @param key - 标签页键名
     * @returns 匹配的标签页，未找到返回 undefined
     */
    function getBrowserTabByKey(key: string): BrowserTab | undefined {
      return browserTabs.value.find((tab) => tab.key === key);
    }

    /**
     * 刷新标签页的 Webview
     *
     * 通过生成新的 webviewLabel 来强制重新创建 Webview
     *
     * @param id - 标签页 ID
     * @returns 更新后的标签页，未找到返回 undefined
     */
    function refreshBrowserTabWebview(id: string): BrowserTab | undefined {
      const tab = getBrowserTabById(id);
      if (!tab) {
        return undefined;
      }

      // 使用时间戳作为版本号，确保唯一性
      tab.webviewLabel = createBrowserWebviewLabel(id, Date.now());
      return tab;
    }

    /**
     * 打开或更新浏览器标签页
     *
     * - 如果标签页已存在，则更新其属性
     * - 如果标签页不存在，则创建新标签页
     * - 自动处理代理 URL 解析
     *
     * @param payload - 打开标签页的参数
     * @returns 创建或更新后的标签页
     */
    function openBrowserTab(payload: OpenBrowserTabPayload): BrowserTab {
      // 规范化 URL（去除首尾空格）
      const normalizedUrl = payload.url.trim();

      // 解析代理 URL
      const { proxyUrl: normalizedProxyUrl } = resolveWebviewProxyUrl(payload.proxyUrl);

      // 检查标签页是否已存在
      const existingTab = browserTabs.value.find((tab) => tab.id === payload.id);

      if (existingTab) {
        // 更新现有标签页
        existingTab.label = payload.label;
        existingTab.icon = payload.icon;
        existingTab.url = normalizedUrl;
        existingTab.proxyUrl = normalizedProxyUrl;
        ensureTab(existingTab.key);
        return existingTab;
      }

      // 创建新标签页
      const tab: BrowserTab = {
        id: payload.id,
        key: createBrowserTabKey(payload.id),
        label: payload.label,
        icon: payload.icon,
        url: normalizedUrl,
        webviewLabel: createBrowserWebviewLabel(payload.id),
        proxyUrl: normalizedProxyUrl,
      };

      browserTabs.value.push(tab);
      ensureTab(tab.key);
      return tab;
    }

    /**
     * 关闭标签页
     *
     * 同时从 visitedTabs 和 browserTabs 中移除
     *
     * @param tabName - 标签页键名
     */
    function closeTab(tabName: string) {
      // 原子操作：同时更新两个数组，确保数据一致性
      visitedTabs.value = visitedTabs.value.filter((name) => name !== tabName);
      browserTabs.value = browserTabs.value.filter((tab) => tab.key !== tabName);
    }

    // ==================== 导出 ====================

    return {
      // 状态
      visitedTabs,
      browserTabs,

      // 方法
      ensureTab,
      getBrowserTabById,
      getBrowserTabByKey,
      refreshBrowserTabWebview,
      openBrowserTab,
      closeTab,
    };
  },
  {
    persist: true, // 启用持久化
  },
);
