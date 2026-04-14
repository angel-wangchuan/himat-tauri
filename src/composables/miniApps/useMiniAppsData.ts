/**
 * 小程序数据管理 Composable
 *
 * 职责：负责小程序数据的加载和状态管理
 */

import { ref } from "vue";
import { storeToRefs } from "pinia";
import { toast } from "vue-sonner";

import { PROVIDER_LOGOS } from "@/config/minapps";
import { useMiniAppsStore, type MiniApp } from "@/store/modules/miniapps";
import { useUserStore } from "@/store/modules/user";
import api from "@/utils/request";

/**
 * 规范化小程序数据
 *
 * @param rawApp - 原始应用数据
 * @param serverUrl - 服务器地址（用于拼接 logo URL）
 * @returns 规范化后的小程序对象
 */
function normalizeMiniApp(rawApp: any, serverUrl?: string): MiniApp {
  const logo = PROVIDER_LOGOS[rawApp.app_id] || `${serverUrl || ""}${rawApp.logo || ""}`;

  return {
    id: String(rawApp.id),
    appId: String(rawApp.app_id || ""),
    name: String(rawApp.name || ""),
    url: String(rawApp.url || ""),
    logo,
  };
}

/**
 * 小程序数据管理 Hook
 *
 * @example
 * ```ts
 * const { apps, loading, loadMiniApps } = useMiniAppsData();
 * await loadMiniApps();
 * ```
 */
export function useMiniAppsData() {
  const miniAppsStore = useMiniAppsStore();
  const userStore = useUserStore();

  const { apps, loaded } = storeToRefs(miniAppsStore);

  /** 加载状态 */
  const loading = ref(false);

  /**
   * 加载小程序列表
   *
   * @param force - 是否强制刷新（忽略缓存）
   */
  async function loadMiniApps(force = false) {
    // 如果已加载且不强制刷新，直接返回
    if (loaded.value && !force) {
      return;
    }

    loading.value = true;
    try {
      const { data } = await api.minappFindAll();
      miniAppsStore.setApps(data.map((item: any) => normalizeMiniApp(item, userStore.serverUrl)));
    } catch (error) {
      console.error("Failed to fetch apps list:", error);
      toast.error("加载小程序列表失败");
    } finally {
      loading.value = false;
    }
  }

  return {
    apps,
    loading,
    loadMiniApps,
  };
}
