/**
 * 小程序搜索功能 Composable
 *
 * 职责：提供小程序的搜索和过滤功能，带防抖优化
 */

import { computed, ref, type Ref } from "vue";
import { useDebounceFn } from "@vueuse/core";

import { SEARCH_DEBOUNCE_MS } from "@/config/constants";
import type { MiniApp } from "@/store/modules/miniapps";

/**
 * 小程序搜索 Hook
 *
 * @param apps - 小程序列表引用
 * @param hiddenAppIds - 隐藏的小程序 ID 列表
 *
 * @example
 * ```ts
 * const { searchInput, filteredApps, applySearch } = useMiniAppsSearch(apps, hiddenAppIds);
 * ```
 */
export function useMiniAppsSearch(apps: Ref<MiniApp[]>, hiddenAppIds: Ref<string[]>) {
  /** 搜索输入框的值（实时） */
  const searchInput = ref("");

  /** 实际用于过滤的搜索关键词（防抖后） */
  const searchKeyword = ref("");

  /** 可见的小程序列表（排除隐藏的） */
  const visibleApps = computed(() =>
    apps.value.filter((item) => !hiddenAppIds.value.includes(item.id)),
  );

  /** 根据搜索关键词过滤后的小程序列表 */
  const filteredApps = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase();
    if (!keyword) {
      return visibleApps.value;
    }

    return visibleApps.value.filter((item) => item.name.toLowerCase().includes(keyword));
  });

  /**
   * 应用搜索（带 300ms 防抖）
   *
   * 使用防抖避免频繁触发过滤计算
   */
  const applySearch = useDebounceFn(() => {
    searchKeyword.value = searchInput.value.trim();
  }, SEARCH_DEBOUNCE_MS);

  /**
   * 清除搜索
   */
  function clearSearch() {
    searchInput.value = "";
    searchKeyword.value = "";
  }

  return {
    searchInput,
    searchKeyword,
    visibleApps,
    filteredApps,
    applySearch,
    clearSearch,
  };
}
