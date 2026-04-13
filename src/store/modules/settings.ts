import { defineStore } from "pinia";
import { ref } from "vue";

export type SettingsMode = "light" | "dark";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    const mode = ref<SettingsMode>("light");

    const webviewProxy = ref<string>("");

    function setWebviewProxy(proxy: string) {
      webviewProxy.value = proxy;
    }

    return {
      mode,
      webviewProxy,
      setWebviewProxy,
    };
  },
  {
    persist: true, // 持久化到 localStorage
  },
);
