import { defineStore } from "pinia";
import { ref } from "vue";

export interface BrowserTab {
  id: string;
  key: string;
  label: string;
  icon: string;
  url: string;
  webviewLabel: string;
  proxyUrl?: string;
}

export interface OpenBrowserTabPayload {
  id: string;
  label: string;
  icon: string;
  url: string;
  proxyUrl?: string;
}

export function createBrowserTabKey(id: string) {
  return `browser:${id}`;
}

function createBrowserWebviewLabel(id: string) {
  return `browser-webview-${id}`;
}

export const useTabsStore = defineStore(
  "tabs",
  () => {
    const visitedTabs = ref<string[]>([]);
    const browserTabs = ref<BrowserTab[]>([]);

    function ensureTab(tabName: string) {
      if (!visitedTabs.value.includes(tabName)) {
        visitedTabs.value.push(tabName);
      }
    }

    function getBrowserTabById(id: string) {
      return browserTabs.value.find((tab) => tab.id === id);
    }

    function getBrowserTabByKey(key: string) {
      return browserTabs.value.find((tab) => tab.key === key);
    }

    function openBrowserTab(payload: OpenBrowserTabPayload) {
      const normalizedUrl = payload.url.trim();
      const normalizedProxyUrl = payload.proxyUrl?.trim() || undefined;

      const tab: BrowserTab = {
        id: payload.id,
        key: createBrowserTabKey(payload.id),
        label: payload.label,
        icon: payload.icon,
        url: normalizedUrl,
        webviewLabel: createBrowserWebviewLabel(payload.id),
        proxyUrl: normalizedProxyUrl,
      };

      browserTabs.value.push(tab);
      ensureTab(tab.key);
      return tab;
    }

    function closeTab(tabName: string) {
      visitedTabs.value = visitedTabs.value.filter((name) => name !== tabName);
      browserTabs.value = browserTabs.value.filter((tab) => tab.key !== tabName);
    }

    return {
      visitedTabs,
      browserTabs,
      ensureTab,
      getBrowserTabById,
      getBrowserTabByKey,
      openBrowserTab,
      closeTab,
    };
  },
  {
    persist: true,
  },
);
