<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useRoute } from "vue-router";

import { getCurrentWindow } from "@tauri-apps/api/window";
import { useTauri } from "@/composables/useTauri";
import { router } from "@/router";
import { AppLogo } from "@/config/env";
import { getAppMenu } from "@/config/launchpad";

import { useTabsStore } from "@/store/modules/tabs";

defineOptions({ name: "Tabs", inheritAttrs: false });

const route = useRoute();
const { invoke } = useTauri();
const appWindow = getCurrentWindow();

const tabCatalog = computed(() =>
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
            name: routeName,
            label: item.name,
            icon: item.icon,
          },
        ] as const;
      })
      .filter(
        (item): item is readonly [string, { name: string; label: string; icon: string }] => !!item,
      ),
  ),
);

type TabName = string;

const tabsScrollRef = ref<HTMLElement | null>(null);

const platform = ref<string>("");
const isFullscreen = ref(false);
const unlistenResize = ref<null | (() => void)>(null);

const tabsStore = useTabsStore();
const { visitedTabs } = storeToRefs(tabsStore);

const showTrafficLightsSpacer = computed(() => platform.value === "macos" && !isFullscreen.value);

watch(
  () => route.name,
  (name) => {
    if (!name || typeof name !== "string" || !(name in tabCatalog.value)) {
      return;
    }

    tabsStore.ensureTab(name);
  },
  { immediate: true },
);

watch(
  [() => route.name, visitedTabs],
  async ([name]) => {
    if (!name) {
      return;
    }

    await nextTick();

    const container = tabsScrollRef.value;
    const activeTab = container?.querySelector<HTMLElement>(`[data-tab-name="${String(name)}"]`);
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
    .filter((name): name is TabName => name in tabCatalog.value)
    .map((name) => tabCatalog.value[name]),
);

const closeTab = async (tabName: string) => {
  const currentIndex = visitedTabs.value.indexOf(tabName);
  if (currentIndex === -1) {
    return;
  }

  const nextTabs = visitedTabs.value.filter((name) => name !== tabName);

  tabsStore.closeTab(tabName);

  if (route.name !== tabName) {
    return;
  }

  const fallbackName = nextTabs[currentIndex] || nextTabs[currentIndex - 1];
  if (!fallbackName) {
    await router.push({ name: "Home" });
    return;
  }
  await router.push({ name: fallbackName });
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
            :key="tab.name"
            class="shrink-0"
            :data-tab-name="tab.name"
            @mousedown.stop
          >
            <Button
              variant="ghost"
              class="h-6.5 px-1 gap-1 hover:bg-background hover:text-primary group"
              :class="{
                'bg-background text-primary': tab.name === route.name,
              }"
              @click.stop="router.push({ name: tab.name })"
            >
              <img :src="tab.icon" :alt="tab.label" class="size-4 rounded-sm object-contain" />
              <span class="text-sm">{{ tab.label }}</span>
              <span
                role="button"
                tabindex="0"
                class="flex size-4 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
                @mousedown.stop
                @click.stop="closeTab(tab.name)"
                @keydown.enter.stop.prevent="closeTab(tab.name)"
                @keydown.space.stop.prevent="closeTab(tab.name)"
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
          'bg-background text-primary': route.name === 'Home',
        }"
        @mousedown.stop
        @click="router.push({ name: 'Home' })"
      >
        <SvgIcon icon="ri:add-line" />
      </Button>
    </div>

    <Button
      variant="ghost"
      class="size-6.5 flex shrink-0 hover:bg-background hover:text-primary"
      :class="{
        'bg-background text-primary': route.name === 'Settings',
      }"
      @mousedown.stop
      @click="router.push({ name: 'Settings' })"
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
  </header>
</template>
