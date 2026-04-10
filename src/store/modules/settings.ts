import { defineStore } from "pinia";
import { ref } from "vue";

export type SettingsMode = "light" | "dark";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    const mode = ref<SettingsMode>("light");

    const webviewProxy = ref<string>("http://127.0.0.1:7897");

    return {
      mode,
      webviewProxy,
    };
  },
  {
    persist: true, // 持久化到 localStorage
  },
);
