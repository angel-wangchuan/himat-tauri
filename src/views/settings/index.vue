<template>
  <div class="custom-box">
    <div class="rounded-md border flex gap-3 h-full">
      <!-- 左侧 Tab -->
      <ScrollArea class="h-full w-40 border-r">
        <div class="flex flex-col gap-2 p-2">
          <Button
            v-for="tab in settingsTabs"
            :key="tab.name"
            variant="ghost"
            class="h-10 gap-2 justify-start"
            :class="{ 'bg-secondary text-secondary-foreground': activeTab === tab.name }"
            @click="activeTab = tab.name"
          >
            <SvgIcon :icon="tab.icon" class="text-lg" />
            <span class="text-sm">{{ tab.label }}</span>
          </Button>
        </div>
      </ScrollArea>

      <!-- 内容区 -->
      <ScrollArea class="h-full flex-1">
        <component :is="currentComponent" />
      </ScrollArea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, type Component } from "vue";

interface SettingsTab {
  name: string;
  label: string;
  icon: string;
  component: Component;
}

const settingsTabs: SettingsTab[] = [
  {
    name: "user",
    label: "用户设置",
    icon: "ri:user-line",
    component: defineAsyncComponent(() => import("./modules/user.vue")),
  },
  {
    name: "system",
    label: "系统设置",
    icon: "ri:settings-3-line",
    component: defineAsyncComponent(() => import("./modules/system.vue")),
  },
  {
    name: "about",
    label: "关于我们",
    icon: "ri:information-line",
    component: defineAsyncComponent(() => import("./modules/about.vue")),
  },
];

const activeTab = ref(settingsTabs[0].name);

const currentComponent = computed(
  () => settingsTabs.find((t) => t.name === activeTab.value)!.component,
);
</script>
