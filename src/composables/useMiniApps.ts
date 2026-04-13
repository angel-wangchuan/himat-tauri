import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { toast } from "vue-sonner";

import { PROVIDER_LOGOS } from "@/config/minapps";
import { router } from "@/router";
import { useMiniAppsStore, type MiniApp } from "@/store/modules/miniapps";
import { useSettingsStore } from "@/store/modules/settings";
import { useTabsStore } from "@/store/modules/tabs";
import { useUserStore } from "@/store/modules/user";
import api from "@/utils/request";
import { resolveWebviewProxyUrl } from "@/utils/webviewProxy";

function normalizeMiniApp(rawApp: any, serverUrl?: string) {
  const logo = PROVIDER_LOGOS[rawApp.app_id] || `${serverUrl || ""}${rawApp.logo || ""}`;

  return {
    id: String(rawApp.id),
    appId: String(rawApp.app_id || ""),
    name: String(rawApp.name || ""),
    url: String(rawApp.url || ""),
    logo,
  } satisfies MiniApp;
}

export function useMiniApps() {
  const miniAppsStore = useMiniAppsStore();
  const tabsStore = useTabsStore();
  const settingsStore = useSettingsStore();
  const userStore = useUserStore();

  const { apps, hiddenAppIds, homeAppIds, loaded } = storeToRefs(miniAppsStore);
  const { webviewProxy } = storeToRefs(settingsStore);

  const loading = ref(false);
  const searchInput = ref("");
  const searchKeyword = ref("");

  const visibleApps = computed(() =>
    apps.value.filter((item) => !hiddenAppIds.value.includes(item.id)),
  );

  const filteredApps = computed(() => {
    const keyword = searchKeyword.value.trim().toLowerCase();
    if (!keyword) {
      return visibleApps.value;
    }

    return visibleApps.value.filter((item) => item.name.toLowerCase().includes(keyword));
  });

  const homeApps = computed(() => {
    const appMap = new Map(apps.value.map((item) => [item.id, item]));
    return homeAppIds.value.map((id) => appMap.get(id)).filter((item): item is MiniApp => !!item);
  });

  async function loadMiniApps(force = false) {
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

  async function openMiniApp(app: MiniApp) {
    const { proxyUrl, error } = resolveWebviewProxyUrl(webviewProxy.value);
    if (error) {
      toast.info(`${error}，当前将按直连打开`);
    }

    const browserTab = tabsStore.openBrowserTab({
      id: `miniapp-${app.id}`,
      label: app.name,
      icon: app.logo,
      url: app.url,
      proxyUrl,
    });

    await router.push({
      name: "Browser",
      params: { tabId: browserTab.id },
    });
  }

  function applySearch() {
    searchKeyword.value = searchInput.value.trim();
  }

  function clearSearch() {
    searchInput.value = "";
    searchKeyword.value = "";
  }

  function addMiniAppToHome(app: MiniApp) {
    if (miniAppsStore.isHomeApp(app.id)) {
      toast.info("该应用已在首页");
      return;
    }

    miniAppsStore.addToHome(app.id);
    toast.success(`已将 ${app.name} 添加到首页`);
  }

  function hideMiniApp(app: MiniApp) {
    if (miniAppsStore.isHiddenApp(app.id)) {
      return;
    }

    miniAppsStore.hideApp(app.id);
    toast.success(`已隐藏 ${app.name}`);
  }

  function isHomeMiniApp(appId: string) {
    return miniAppsStore.isHomeApp(appId);
  }

  return {
    loading,
    searchInput,
    searchKeyword,
    filteredApps,
    homeApps,
    loadMiniApps,
    openMiniApp,
    applySearch,
    clearSearch,
    addMiniAppToHome,
    hideMiniApp,
    isHomeMiniApp,
  };
}
