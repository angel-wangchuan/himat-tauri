import { defineStore } from "pinia";
import { ref } from "vue";

export const useTabsStore = defineStore(
  "tabs",
  () => {
    const visitedTabs = ref<string[]>([]);

    function ensureTab(tabName: string) {
      if (!visitedTabs.value.includes(tabName)) {
        visitedTabs.value.push(tabName);
      }
    }

    function closeTab(tabName: string) {
      visitedTabs.value = visitedTabs.value.filter((name) => name !== tabName);
    }

    return {
      visitedTabs,
      ensureTab,
      closeTab,
    };
  },
  {
    persist: true,
  },
);
