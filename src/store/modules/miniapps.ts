import { defineStore } from "pinia";
import { ref } from "vue";

export interface MiniApp {
  id: string;
  appId: string;
  name: string;
  url: string;
  logo: string;
}

export const useMiniAppsStore = defineStore(
  "miniapps",
  () => {
    const apps = ref<MiniApp[]>([]);
    const homeAppIds = ref<string[]>([]);
    const hiddenAppIds = ref<string[]>([]);
    const loaded = ref(false);

    function setApps(nextApps: MiniApp[]) {
      apps.value = nextApps;
      loaded.value = true;

      const validIds = new Set(nextApps.map((item) => item.id));
      homeAppIds.value = homeAppIds.value.filter((id) => validIds.has(id));
      hiddenAppIds.value = hiddenAppIds.value.filter((id) => validIds.has(id));
    }

    function addToHome(appId: string) {
      if (!homeAppIds.value.includes(appId)) {
        homeAppIds.value.push(appId);
      }
    }

    function removeFromHome(appId: string) {
      homeAppIds.value = homeAppIds.value.filter((id) => id !== appId);
    }

    function hideApp(appId: string) {
      if (!hiddenAppIds.value.includes(appId)) {
        hiddenAppIds.value.push(appId);
      }
    }

    function showApp(appId: string) {
      hiddenAppIds.value = hiddenAppIds.value.filter((id) => id !== appId);
    }

    function setHiddenAppIds(appIds: string[]) {
      const validIds = new Set(apps.value.map((item) => item.id));
      hiddenAppIds.value = appIds.filter((id) => validIds.has(id));
    }

    function resetHiddenApps() {
      hiddenAppIds.value = [];
    }

    function isHomeApp(appId: string) {
      return homeAppIds.value.includes(appId);
    }

    function isHiddenApp(appId: string) {
      return hiddenAppIds.value.includes(appId);
    }

    return {
      apps,
      homeAppIds,
      hiddenAppIds,
      loaded,
      setApps,
      addToHome,
      removeFromHome,
      hideApp,
      showApp,
      setHiddenAppIds,
      resetHiddenApps,
      isHomeApp,
      isHiddenApp,
    };
  },
  {
    persist: true,
  },
);
