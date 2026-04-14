/**
 * 小程序管理主 Composable
 *
 * 组合数据加载、搜索、操作三个子模块，提供统一的 API
 *
 * @example
 * ```ts
 * const { filteredApps, loadMiniApps, openMiniApp } = useMiniApps();
 * ```
 */

import { storeToRefs } from "pinia";

import { useMiniAppsStore } from "@/store/modules/miniapps";
import { useMiniAppsData } from "./miniApps/useMiniAppsData";
import { useMiniAppsSearch } from "./miniApps/useMiniAppsSearch";
import { useMiniAppsActions } from "./miniApps/useMiniAppsActions";

/**
 * 小程序管理 Hook（统一入口）
 *
 * 整合了：
 * - 数据加载（useMiniAppsData）
 * - 搜索过滤（useMiniAppsSearch）
 * - 业务操作（useMiniAppsActions）
 */
export function useMiniApps() {
  const miniAppsStore = useMiniAppsStore();
  const { apps, hiddenAppIds } = storeToRefs(miniAppsStore);

  // 数据管理
  const data = useMiniAppsData();

  // 搜索功能
  const search = useMiniAppsSearch(apps, hiddenAppIds);

  // 业务操作
  const actions = useMiniAppsActions();

  // 隐藏的小程序列表
  const hiddenApps = computed(() =>
    apps.value.filter((item) => hiddenAppIds.value.includes(item.id)),
  );

  return {
    // 来自数据模块
    loading: data.loading,
    loadMiniApps: data.loadMiniApps,

    // 来自搜索模块
    searchInput: search.searchInput,
    searchKeyword: search.searchKeyword,
    visibleApps: search.visibleApps,
    filteredApps: search.filteredApps,
    applySearch: search.applySearch,
    clearSearch: search.clearSearch,

    // 来自操作模块
    homeApps: actions.homeApps,
    openMiniApp: actions.openMiniApp,
    addMiniAppToHome: actions.addMiniAppToHome,
    removeMiniAppFromHome: actions.removeMiniAppFromHome,
    hideMiniApp: actions.hideMiniApp,
    showMiniApp: actions.showMiniApp,
    swapMiniAppVisibility: actions.swapMiniAppVisibility,
    resetMiniAppVisibility: actions.resetMiniAppVisibility,
    isHomeMiniApp: actions.isHomeMiniApp,

    // 额外状态
    hiddenApps,
  };
}
