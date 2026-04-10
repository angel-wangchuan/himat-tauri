<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { toast } from "vue-sonner";
import { useRoute } from "vue-router";

import { useTauri } from "@/composables/useTauri";
import { router } from "@/router";
import { useTabsStore } from "@/store/modules/tabs";

type TauriWebview = {
  hide: () => Promise<void>;
  show: () => Promise<void>;
  close: () => Promise<void>;
  setFocus: () => Promise<void>;
  setPosition: (position: unknown) => Promise<void>;
  setSize: (size: unknown) => Promise<void>;
  once: (event: string, handler: (event: { payload?: string }) => void) => Promise<() => void>;
};

type WebviewApi = {
  Webview: {
    new (window: unknown, label: string, options: Record<string, unknown>): TauriWebview;
    getByLabel: (label: string) => Promise<TauriWebview | null>;
  };
  LogicalPosition: new (x: number, y: number) => unknown;
  LogicalSize: new (width: number, height: number) => unknown;
  hostWindow: unknown;
};

const route = useRoute();
const tabsStore = useTabsStore();
const { isTauri } = useTauri();

const browserHostRef = ref<HTMLElement | null>(null);
const isLoading = ref(false);
const statusText = ref("准备打开网页...");
const lastResolvedTab = ref<ReturnType<typeof tabsStore.getBrowserTabById>>();

let resizeObserver: ResizeObserver | null = null;
let unlistenWindowResize: (() => void) | null = null;
let webviewApiPromise: Promise<WebviewApi> | null = null;

const browserTab = computed(() => {
  const { tabId } = route.params;
  if (typeof tabId !== "string") {
    return undefined;
  }

  return tabsStore.getBrowserTabById(tabId);
});

const proxyText = computed(() => browserTab.value?.proxyUrl || "未配置，当前页直连");

function getWebviewApi() {
  if (!webviewApiPromise) {
    webviewApiPromise = Promise.all([
      import("@tauri-apps/api/webview"),
      import("@tauri-apps/api/dpi"),
      import("@tauri-apps/api/window"),
    ]).then(([webviewModule, dpiModule, windowModule]) => ({
      Webview: webviewModule.Webview,
      LogicalPosition: dpiModule.LogicalPosition,
      LogicalSize: dpiModule.LogicalSize,
      hostWindow: windowModule.getCurrentWindow(),
    }));
  }

  return webviewApiPromise;
}

async function getWebviewByLabel(label: string) {
  const { Webview } = await getWebviewApi();
  return Webview.getByLabel(label);
}

async function hideTabWebview(tab = browserTab.value) {
  if (!isTauri.value || !tab) {
    return;
  }

  const webview = await getWebviewByLabel(tab.webviewLabel);
  await webview?.hide();
}

async function syncWebviewBounds(webview: TauriWebview) {
  const host = browserHostRef.value;
  if (!host) {
    return;
  }

  const rect = host.getBoundingClientRect();
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  const { LogicalPosition, LogicalSize } = await getWebviewApi();

  await webview.setPosition(new LogicalPosition(rect.left, rect.top));
  await webview.setSize(new LogicalSize(width, height));
}

async function createWebview() {
  const tab = browserTab.value;
  const host = browserHostRef.value;
  if (!tab || !host) {
    return null;
  }

  const rect = host.getBoundingClientRect();
  const width = Math.max(rect.width, 1);
  const height = Math.max(rect.height, 1);
  const { Webview, hostWindow } = await getWebviewApi();

  return await new Promise<TauriWebview>((resolve, reject) => {
    const webview = new Webview(hostWindow, tab.webviewLabel, {
      url: tab.url,
      x: rect.left,
      y: rect.top,
      width,
      height,
      focus: true,
      proxyUrl: tab.proxyUrl || undefined,
    });

    void webview.once("tauri://created", () => resolve(webview));
    void webview.once("tauri://error", (event) => {
      reject(new Error(event.payload || "创建网页视图失败"));
    });
  });
}

async function showCurrentTabWebview() {
  const tab = browserTab.value;
  if (!tab) {
    await router.replace({ name: "Apps" });
    return;
  }

  lastResolvedTab.value = tab;

  if (!isTauri.value) {
    statusText.value = "";
    return;
  }

  await nextTick();
  if (!browserHostRef.value) {
    return;
  }

  isLoading.value = true;
  statusText.value = "正在打开网页...";

  try {
    const existingWebview = await getWebviewByLabel(tab.webviewLabel);
    const webview = existingWebview || (await createWebview());
    if (!webview) {
      return;
    }

    await syncWebviewBounds(webview);
    await webview.show();
    await webview.setFocus();
    statusText.value = "";
  } catch (error) {
    const message = error instanceof Error ? error.message : "打开网页失败";
    statusText.value = message;
    toast.error(message);
  } finally {
    isLoading.value = false;
  }
}

async function syncActiveWebview() {
  if (!isTauri.value || !browserTab.value) {
    return;
  }

  const webview = await getWebviewByLabel(browserTab.value.webviewLabel);
  if (!webview) {
    return;
  }

  await syncWebviewBounds(webview);
}

watch(
  () => route.params.tabId,
  async (nextTabId, previousTabId) => {
    if (typeof previousTabId === "string" && previousTabId !== nextTabId) {
      const previousTab = tabsStore.getBrowserTabById(previousTabId);
      await hideTabWebview(previousTab);
    }

    await showCurrentTabWebview();
  },
  { immediate: true },
);

onMounted(async () => {
  if (browserHostRef.value) {
    resizeObserver = new ResizeObserver(() => {
      void syncActiveWebview();
    });
    resizeObserver.observe(browserHostRef.value);
  }

  if (isTauri.value) {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const appWindow = getCurrentWindow();
    unlistenWindowResize = await appWindow.onResized(() => {
      void syncActiveWebview();
    });
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  unlistenWindowResize?.();
  void hideTabWebview(lastResolvedTab.value);
});
</script>

<template>
  <div class="custom-box flex min-h-0 flex-col gap-3 overflow-hidden">
    <div ref="browserHostRef" class="relative min-h-0 flex-1 overflow-hidden rounded-xl border">
      <iframe
        v-if="!isTauri && browserTab"
        :src="browserTab.url"
        class="size-full border-0"
        title="browser-view"
      />

      <div
        v-else-if="isLoading || statusText"
        class="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 text-sm text-muted-foreground"
      >
        {{ statusText }}
      </div>
    </div>
  </div>
</template>
