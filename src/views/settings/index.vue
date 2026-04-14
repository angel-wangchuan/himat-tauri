<template>
  <div class="custom-box">
    <div class="rounded-md border flex h-full">
      <!-- 左侧 Tab -->
      <ScrollArea class="h-full w-40">
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
            <span class="text-sm">{{ t(tab.labelKey) }}</span>
          </Button>
        </div>
      </ScrollArea>

      <!-- 内容区 -->
      <ScrollArea class="h-full flex-1 border-l">
        <component :is="currentComponent" />
      </ScrollArea>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 设置页面主容器
 *
 * 提供左侧导航和右侧内容区的经典设置布局
 */

import { defineAsyncComponent, type Component } from "vue";
import { useI18n } from "vue-i18n";

// ==================== 国际化 ====================

const { t } = useI18n();

// ==================== 类型定义 ====================

interface SettingsTab {
  name: string;
  labelKey: string; // i18n key
  icon: string;
  component: Component;
}

// ==================== 标签页配置 ====================

const settingsTabs: SettingsTab[] = [
  {
    name: "user",
    labelKey: "settings.user.title",
    icon: "ri:user-line",
    component: defineAsyncComponent(() => import("./modules/user.vue")),
  },
  {
    name: "system",
    labelKey: "settings.system.title",
    icon: "ri:settings-3-line",
    component: defineAsyncComponent(() => import("./modules/system.vue")),
  },
  {
    name: "about",
    labelKey: "settings.about.title",
    icon: "ri:information-line",
    component: defineAsyncComponent(() => import("./modules/about.vue")),
  },
];

// ==================== 状态管理 ====================

const activeTab = ref(settingsTabs[0].name);

const currentComponent = computed(
  () => settingsTabs.find((t) => t.name === activeTab.value)!.component,
);
</script>
