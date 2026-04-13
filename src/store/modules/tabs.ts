import { defineStore } from "pinia";
import { ref } from "vue";

import { resolveWebviewProxyUrl } from "@/utils/webviewProxy";

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

function createBrowserWebviewLabel(id: string, version = 0) {
  return `browser-webview-${id}-${version}`;
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

    function refreshBrowserTabWebview(id: string) {
      const tab = getBrowserTabById(id);
      if (!tab) {
        return undefined;
      }

      tab.webviewLabel = createBrowserWebviewLabel(id, Date.now());
      return tab;
    }

    function openBrowserTab(payload: OpenBrowserTabPayload) {
      const normalizedUrl = payload.url.trim();
      const { proxyUrl: normalizedProxyUrl } = resolveWebviewProxyUrl(payload.proxyUrl);
      const existingTab = browserTabs.value.find((tab) => tab.id === payload.id);

      if (existingTab) {
        existingTab.label = payload.label;
        existingTab.icon = payload.icon;
        existingTab.url = normalizedUrl;
        existingTab.proxyUrl = normalizedProxyUrl;
        ensureTab(existingTab.key);
        return existingTab;
      }

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
      refreshBrowserTabWebview,
      openBrowserTab,
      closeTab,
    };
  },
  {
    persist: true,
  },
);
