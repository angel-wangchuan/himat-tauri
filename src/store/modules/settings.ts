import { defineStore } from "pinia";
import { ref } from "vue";

export type SettingsMode = "light" | "dark";

export const useSettingsStore = defineStore(
  "settings",
  () => {
    const mode = ref<SettingsMode>("light");

    return {
      mode,
    };
  },
  {
    persist: true, // 持久化到 localStorage
  },
);
