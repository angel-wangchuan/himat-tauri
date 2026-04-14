/**
 * 小程序操作 Composable
 *
 * 职责：提供小程序的业务操作（打开、添加到首页、显示/隐藏等）
 */

import { computed, type Ref } from "vue";
import { storeToRefs } from "pinia";
import { toast } from "vue-sonner";

import { router } from "@/router";
import { useMiniAppsStore, type MiniApp } from "@/store/modules/miniapps";
import { useSettingsStore } from "@/store/modules/settings";
import { useTabsStore } from "@/store/modules/tabs";
import { resolveWebviewProxyUrl } from "@/utils/webviewProxy";
import { BROWSER_ROUTE_NAME, MINIAPP_ID_PREFIX } from "@/config/constants";

/**
 * 小程序操作 Hook
 *
 * @example
 * ```ts
 * const { openMiniApp, addMiniAppToHome } = useMiniAppsActions();
 * await openMiniApp(app);
 * ```
 */
export function useMiniAppsActions() {
  const miniAppsStore = useMiniAppsStore();
  const tabsStore = useTabsStore();
  const settingsStore = useSettingsStore();

  const { apps, hiddenAppIds, homeAppIds } = storeToRefs(miniAppsStore);
  const { webviewProxy } = storeToRefs(settingsStore);

  /**
   * 首页显示的小程序列表
   */
  const homeApps = computed(() => {
    const appMap = new Map(apps.value.map((item) => [item.id, item]));
    return homeAppIds.value.map((id) => appMap.get(id)).filter((item): item is MiniApp => !!item);
  });

  /**
   * 打开小程序
   *
   * - 解析代理配置
   * - 创建浏览器标签页
   * - 跳转到浏览器页面
   *
   * @param app - 要打开的小程序
   */
  async function openMiniApp(app: MiniApp) {
    const { proxyUrl, error } = resolveWebviewProxyUrl(webviewProxy.value);

    if (error) {
      toast.info(`${error}，当前将按直连打开`);
    }

    const browserTab = tabsStore.openBrowserTab({
      id: `${MINIAPP_ID_PREFIX}${app.id}`,
      label: app.name,
      icon: app.logo,
      url: app.url,
      proxyUrl,
    });

    await router.push({
      name: BROWSER_ROUTE_NAME,
      params: { tabId: browserTab.id },
    });
  }

  /**
   * 添加小程序到首页
   *
   * @param app - 要添加的小程序
   */
  function addMiniAppToHome(app: MiniApp) {
    if (miniAppsStore.isHomeApp(app.id)) {
      toast.info("该应用已在首页");
      return;
    }

    miniAppsStore.addToHome(app.id);
    toast.success(`已将 ${app.name} 添加到首页`);
  }

  /**
   * 从首页移除小程序
   *
   * @param app - 要移除的小程序
   * @returns
   */
  function removeMiniAppFromHome(app: MiniApp) {
    if (!miniAppsStore.isHomeApp(app.id)) {
      toast.info("该应用不在首页");
      return;
    }

    miniAppsStore.removeFromHome(app.id);
    toast.success(`已将 ${app.name} 从首页移除`);
  }

  /**
   * 隐藏小程序
   *
   * @param app - 要隐藏的小程序
   */
  function hideMiniApp(app: MiniApp) {
    if (miniAppsStore.isHiddenApp(app.id)) {
      return;
    }

    miniAppsStore.hideApp(app.id);
    toast.success(`已隐藏 ${app.name}`);
  }

  /**
   * 显示小程序
   *
   * @param app - 要显示的小程序
   */
  function showMiniApp(app: MiniApp) {
    if (!miniAppsStore.isHiddenApp(app.id)) {
      return;
    }

    miniAppsStore.showApp(app.id);
    toast.success(`已显示 ${app.name}`);
  }

  /**
   * 交换显示与隐藏的小程序
   *
   * 将所有可见的小程序设为隐藏，所有隐藏的小程序设为可见
   */
  function swapMiniAppVisibility() {
    const visibleApps = apps.value.filter((item) => !hiddenAppIds.value.includes(item.id));
    const nextHiddenIds = visibleApps.map((item) => item.id);
    miniAppsStore.setHiddenAppIds(nextHiddenIds);
    toast.success("已交换显示与隐藏的小程序");
  }

  /**
   * 重置小程序显示设置
   *
   * 清除所有隐藏设置，显示所有小程序
   */
  function resetMiniAppVisibility() {
    miniAppsStore.resetHiddenApps();
    toast.success("已重置小程序显示设置");
  }

  /**
   * 检查小程序是否在首页显示
   *
   * @param appId - 小程序 ID
   * @returns 是否在首页显示
   */
  function isHomeMiniApp(appId: string): boolean {
    return miniAppsStore.isHomeApp(appId);
  }

  return {
    homeApps,
    openMiniApp,
    addMiniAppToHome,
    removeMiniAppFromHome,
    hideMiniApp,
    showMiniApp,
    swapMiniAppVisibility,
    resetMiniAppVisibility,
    isHomeMiniApp,
  };
}
