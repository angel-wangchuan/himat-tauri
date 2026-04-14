<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";

import { Webview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTauri } from "@/composables/useTauri";
import { router } from "@/router";
import { AppLogo } from "@/config/env";
import { getAppMenu } from "@/config/launchpad";

import { createBrowserTabKey, useTabsStore } from "@/store/modules/tabs";
import { BROWSER_ROUTE_NAME, HOME_ROUTE_NAME, SETTINGS_ROUTE_NAME } from "@/config/constants";

defineOptions({ name: "Tabs", inheritAttrs: false });

const route = useRoute();
const { invoke, isTauri } = useTauri();
const appWindow = getCurrentWindow();

const staticTabCatalog = computed(() =>
  Object.fromEntries(
    getAppMenu()
      .map((item) => {
        const resolvedRoute = router.resolve(item.path);
        const routeName = resolvedRoute.name;

        if (!routeName || typeof routeName !== "string") {
          return null;
        }

        return [
          routeName,
          {
            key: routeName,
            routeName,
            label: item.name,
            icon: item.icon,
          },
        ] as const satisfies readonly [string, TabEntry];
      })
      .filter((item): item is readonly [string, TabEntry] => !!item),
  ),
);

const tabsStore = useTabsStore();
const { visitedTabs, browserTabs } = storeToRefs(tabsStore);

const dynamicTabCatalog = computed(() =>
  Object.fromEntries(
    browserTabs.value.map((tab) => [
      tab.key,
      {
        key: tab.key,
        routeName: BROWSER_ROUTE_NAME,
        routeParams: { tabId: tab.id },
        label: tab.label,
        icon: tab.icon,
        webviewLabel: tab.webviewLabel,
      } satisfies TabEntry,
    ]),
  ),
);

const tabCatalog = computed(() => ({
  ...staticTabCatalog.value,
  ...dynamicTabCatalog.value,
}));

type TabKey = string;
type TabEntry = {
  key: string;
  routeName: string;
  routeParams?: Record<string, string>;
  label: string;
  icon: string;
  webviewLabel?: string;
};

const tabsScrollRef = ref<HTMLElement | null>(null);

const platform = ref<string>("");
const isFullscreen = ref(false);
const unlistenResize = ref<null | (() => void)>(null);

const showTrafficLightsSpacer = computed(() => platform.value === "macos" && !isFullscreen.value);

const currentTabKey = computed(() => {
  if (route.name === BROWSER_ROUTE_NAME && typeof route.params.tabId === "string") {
    return createBrowserTabKey(route.params.tabId);
  }

  return typeof route.name === "string" ? route.name : null;
});

function tabToLocation(tab: TabEntry) {
  return {
    name: tab.routeName,
    params: tab.routeParams,
  };
}

watch(
  currentTabKey,
  async (tabKey, previousTabKey) => {
    if (previousTabKey && previousTabKey !== tabKey && isTauri.value) {
      const previousTab = tabCatalog.value[previousTabKey] as TabEntry | undefined;
      if (previousTab?.webviewLabel) {
        const webview = await Webview.getByLabel(previousTab.webviewLabel);
        await webview?.hide();
      }
    }

    if (!tabKey || !(tabKey in tabCatalog.value)) {
      return;
    }

    tabsStore.ensureTab(tabKey);
  },
  { immediate: true },
);

watch(
  [currentTabKey, visitedTabs],
  async ([tabKey]) => {
    if (!tabKey) {
      return;
    }

    await nextTick();

    const container = tabsScrollRef.value;
    const activeTab = container?.querySelector<HTMLElement>(`[data-tab-key="${String(tabKey)}"]`);
    activeTab?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  },
  { immediate: true, deep: true },
);

const tabs = computed(() =>
  visitedTabs.value
    .filter((key): key is TabKey => key in tabCatalog.value)
    .map((key) => tabCatalog.value[key] as TabEntry),
);

const closeTab = async (tabKey: string) => {
  const currentIndex = visitedTabs.value.indexOf(tabKey);
  if (currentIndex === -1) {
    return;
  }

  const nextTabs = visitedTabs.value.filter((name) => name !== tabKey);
  const closedTab = tabCatalog.value[tabKey] as TabEntry | undefined;

  tabsStore.closeTab(tabKey);

  if (closedTab?.webviewLabel && isTauri.value) {
    const webview = await Webview.getByLabel(closedTab.webviewLabel);
    await webview?.close();
  }

  if (currentTabKey.value !== tabKey) {
    return;
  }

  const fallbackName = nextTabs[currentIndex] || nextTabs[currentIndex - 1];
  if (!fallbackName) {
    await router.push({ name: HOME_ROUTE_NAME });
    return;
  }

  const fallbackTab = tabCatalog.value[fallbackName] as TabEntry | undefined;
  if (!fallbackTab) {
    await router.push({ name: HOME_ROUTE_NAME });
    return;
  }

  await router.push(tabToLocation(fallbackTab));
};

const onTabsWheel = (event: WheelEvent) => {
  const container = tabsScrollRef.value;
  if (!container) {
    return;
  }

  if (Math.abs(event.deltaX) < Math.abs(event.deltaY)) {
    container.scrollLeft += event.deltaY;
    event.preventDefault();
  }
};

onMounted(async () => {
  platform.value = await invoke("get_platform");

  if (platform.value === "macos") {
    isFullscreen.value = await appWindow.isFullscreen();
    unlistenResize.value = await appWindow.onResized(async () => {
      isFullscreen.value = await appWindow.isFullscreen();
    });
  }
});

const minimizeWindow = async () => {
  await appWindow.minimize();
};

const maximizeWindow = async () => {
  await appWindow.toggleMaximize();
};

const closeWindow = async () => {
  await appWindow.close();
};

onUnmounted(() => {
  unlistenResize.value?.();
});
</script>

<template>
  <header
    class="sticky top-0 z-20 flex h-[var(--navbar-height)] items-center justify-between gap-2 px-1.5 select-none"
    data-tauri-drag-region
  >
    <div class="flex min-w-0 items-center gap-2">
      <div
        class="flex h-full shrink-0 items-center"
        :class="showTrafficLightsSpacer ? 'w-25 justify-end' : 'w-auto'"
        data-tauri-drag-region
      >
        <img
          :src="AppLogo"
          alt="logo"
          class="pointer-events-none select-none size-6.5 rounded-md"
          data-tauri-drag-region
        />
      </div>

      <div class="max-w-[min(80vw,720px)] overflow-hidden">
        <div
          ref="tabsScrollRef"
          class="flex items-center gap-2 overflow-x-auto whitespace-nowrap scroll-smooth"
          @wheel="onTabsWheel"
        >
          <div
            v-for="tab in tabs"
            :key="tab.key"
            class="shrink-0"
            :data-tab-key="tab.key"
            @mousedown.stop
          >
            <Button
              variant="ghost"
              class="h-6.5 px-1 gap-1 hover:bg-background hover:text-primary group"
              :class="{
                'bg-background text-primary': tab.key === currentTabKey,
              }"
              @click.stop="router.push(tabToLocation(tab))"
            >
              <img :src="tab.icon" :alt="tab.label" class="size-4 rounded-sm object-contain" />
              <span class="text-sm">{{ tab.label }}</span>
              <span
                role="button"
                tabindex="0"
                class="flex size-4 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-destructive"
                @mousedown.stop
                @click.stop="closeTab(tab.key)"
                @keydown.enter.stop.prevent="closeTab(tab.key)"
                @keydown.space.stop.prevent="closeTab(tab.key)"
              >
                <SvgIcon icon="ri:close-line" class="text-xs" />
              </span>
            </Button>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        class="size-6.5 flex shrink-0 hover:bg-background hover:text-primary"
        :class="{
          'bg-background text-primary': route.name === HOME_ROUTE_NAME,
        }"
        @mousedown.stop
        @click="router.push({ name: HOME_ROUTE_NAME })"
      >
        <SvgIcon icon="ri:add-line" />
      </Button>
    </div>

    <div>
      <Button
        variant="ghost"
        class="size-6.5 flex shrink-0 hover:bg-background hover:text-primary"
        :class="{
          'bg-background text-primary': route.name === SETTINGS_ROUTE_NAME,
        }"
        @mousedown.stop
        @click="router.push({ name: SETTINGS_ROUTE_NAME })"
      >
        <SvgIcon icon="ri:settings-line" />
      </Button>
      <ButtonGroup v-if="platform !== 'macos'">
        <Button variant="ghost" @click="minimizeWindow">
          <SvgIcon icon="radix-icons:minus" />
        </Button>
        <Button variant="ghost" @click="maximizeWindow">
          <SvgIcon icon="radix-icons:corners" />
        </Button>
        <Button variant="ghost" class="hover:bg-red-500 hover:text-white" @click="closeWindow">
          <SvgIcon icon="radix-icons:cross-2" />
        </Button>
      </ButtonGroup>
    </div>
  </header>
</template>
