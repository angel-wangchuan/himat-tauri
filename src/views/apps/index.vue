<script setup lang="ts">
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

import { storeToRefs } from "pinia";

import { useSettingsStore } from "@/store/modules/settings";
import { useTabsStore } from "@/store/modules/tabs";
import { useUserStore } from "@/store/modules/user";

import { router } from "@/router";
import api from "@/utils/request";

import { PROVIDER_LOGOS } from "@/config/minapps";

const settingsStore = useSettingsStore();
const { webviewProxy } = storeToRefs(settingsStore);
const tabsStore = useTabsStore();
const { serverUrl } = useUserStore();

const miniAppList = ref<any[]>([]);

async function openInProxiedWebview(item: any) {
  const browserTab = tabsStore.openBrowserTab({
    id: `miniapp-${item.id}`,
    label: item.name,
    icon: item.logo,
    url: item.url,
    proxyUrl: webviewProxy.value,
  });

  console.log("browserTab", browserTab);

  await router.push({
    name: "Browser",
    params: { tabId: browserTab.id },
  });
}

const getList = async () => {
  try {
    const { data } = await api.minappFindAll();
    data.forEach((item: any) => {
      item.logo = PROVIDER_LOGOS[item.app_id] || `${serverUrl}${item.logo}`;
    });
    console.log("Apps List:", data);
    miniAppList.value = data;
  } catch (error) {
    console.error("Failed to fetch apps list:", error);
  }
};

onMounted(() => {
  getList();
});
</script>

<template>
  <ScrollArea class="custom-box">
    <div class="flex justify-end p-3">
      <div class="flex items-center gap-1">
        <div class="relative w-full max-w-sm items-center">
          <Input id="search" type="text" :placeholder="$t('common.search')" class="pl-10 h-8" />
          <span class="absolute start-0 inset-y-0 flex items-center justify-center px-2">
            <SvgIcon icon="ri:search-line" class="size-4 text-muted-foreground" />
          </span>
        </div>

        <!-- <Button variant="ghost" class="size-8">
          <SvgIcon icon="ri:settings-line" class="size-4" />
        </Button> -->
      </div>
    </div>

    <ContextMenu>
      <ContextMenuTrigger>右键点击</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>个人资料</ContextMenuItem>
        <ContextMenuItem>账单</ContextMenuItem>
        <ContextMenuItem>团队</ContextMenuItem>
        <ContextMenuItem>订阅</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>

    <div class="grid gap-4 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 p-3">
      <div
        v-for="value in miniAppList"
        :key="value.id"
        class="py-3 flex cursor-pointer flex-col items-center gap-4 rounded-md border border-border bg-background text-center custom-hover"
        @click="openInProxiedWebview(value)"
      >
        <img :src="value.logo" :alt="value.name" class="size-12 rounded-md" />
        <span class="text-xs text-center">{{ value.name }}</span>
      </div>
    </div>
  </ScrollArea>
</template>
