<template>
  <div class="flex flex-col gap-2 p-2">
    <!-- 常规设置卡片 -->
    <Card class="flex min-h-0 flex-col gap-0 overflow-hidden py-0">
      <CardHeader class="border-b pl-3 pr-0 py-2! flex items-center justify-between">
        <div class="text-sm font-medium">{{ t("settings.system.general.title") }}</div>
      </CardHeader>
      <CardContent class="min-h-0 flex-1 p-3">
        <div class="flex flex-col gap-4">
          <!-- 语言选择 -->
          <div class="flex items-center justify-between">
            <span class="text-sm">{{ t("settings.system.general.language") }}</span>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" size="sm">
                  <span>{{ currentLang?.flag }} {{ currentLang?.label }}</span>
                  <SvgIcon icon="radix-icons:caret-sort" class="text-xs" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  @click="switchLocale(lang.value)"
                  v-for="lang in langOptions"
                  :key="lang.value"
                >
                  {{ lang.flag }} {{ lang.label }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <!-- 主题模式切换 -->
          <div class="flex items-center justify-between">
            <span class="text-sm">{{ t("settings.system.general.theme") }}</span>
            <ButtonGroup>
              <Button
                variant="outline"
                size="sm"
                @click="setThemeMode('light', $event)"
                :class="{ 'text-primary': savedMode === 'light' }"
              >
                <SvgIcon icon="ri:sun-line" class="text-xs" />
                {{ t("settings.system.general.light") }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                @click="setThemeMode('dark', $event)"
                :class="{ 'text-primary': savedMode === 'dark' }"
              >
                <SvgIcon icon="ri:moon-line" class="text-xs" />
                {{ t("settings.system.general.dark") }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                @click="setThemeMode('auto', $event)"
                :class="{ 'text-primary': savedMode === 'auto' }"
              >
                <SvgIcon icon="ri:mac-line" class="text-xs" />
                {{ t("settings.system.general.auto") }}
              </Button>
            </ButtonGroup>
          </div>

          <!-- 主题颜色选择 -->
          <div class="flex items-center justify-between">
            <span class="text-sm">{{ t("settings.system.general.color") }}</span>
            <div class="flex gap-2">
              <template v-for="value in colors" :key="value.id">
                <div
                  class="rounded-2xl p-0.5 border border-transparent cursor-pointer"
                  :class="{ 'border-primary!': value.id === color }"
                  @click="setColor(value.id)"
                >
                  <div
                    :style="{ backgroundColor: value.hex }"
                    class="size-4 rounded-2xl flex items-center justify-center"
                  >
                    <SvgIcon
                      v-if="value.id === color"
                      icon="ri:check-line"
                      class="text-xs text-white"
                    />
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- WebView 代理设置 -->
    <div>
      <span class="text-md">{{ t("settings.system.proxy.title") }}</span>
      <Input
        v-model="webviewProxy"
        :placeholder="t('settings.system.proxy.placeholder')"
        class="w-80 mt-2"
      />
      <p class="mt-2 text-xs text-muted-foreground">
        {{ t("settings.system.proxy.hint") }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 系统设置页面
 *
 * 负责：
 * - 语言切换
 * - 主题模式管理（亮色/暗色/自动）
 * - 主题颜色选择
 * - WebView 代理配置
 */

import { useColorMode } from "@vueuse/core";
import { useSettingsStore } from "@stores/settings";
import { nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { useI18nHelper } from "@/composables/useI18nHelper";
import { applyThemeColor, applyThemeMode, type ThemeMode } from "@/utils/theme";
import { THEME_TRANSITION_DURATION, THEME_TRANSITION_EASING } from "@/config/constants";

// ==================== 国际化 ====================

const { t } = useI18n();
const { currentLang, langOptions, switchLocale } = useI18nHelper();

// ==================== 状态管理 ====================

const settingsStore = useSettingsStore();
const { color, mode: savedMode, webviewProxy } = storeToRefs(settingsStore);

// ==================== 主题模式管理 ====================

/**
 * VueUse 的颜色模式响应式引用
 * 用于控制应用的实际显示模式（light/dark/auto）
 */
const mode = useColorMode({ disableTransition: false });

// ==================== 主题颜色配置 ====================

/**
 * 可用的主题颜色方案列表
 * 每个颜色包含：id（标识）、label（显示名称）、hex（色值）
 *
 * 颜色分类：
 * - 默认色：default（蓝色 #0293ff）
 * - 灰色系：zinc
 * - 暖色系：red, rose, orange, yellow
 * - 冷色系：green,  violet
 */
const colors = [
  // 默认色（保持不变）
  { id: "default", label: "默认", hex: "#0293ff" },

  // 暖色系
  { id: "rose", label: "玫红", hex: "#f43f5e" },
  { id: "orange", label: "橙色", hex: "#f97316" },
  { id: "yellow", label: "黄色", hex: "#eab308" },

  // 冷色系
  { id: "green", label: "绿色", hex: "#22c55e" },
  { id: "violet", label: "紫罗兰", hex: "#8b5cf6" },

  // 灰色系
  { id: "zinc", label: "锌色", hex: "#52525b" },
] as const;

/**
 * 设置主题颜色
 * @param colorId - 颜色方案的 ID
 */
function setColor(colorId: string) {
  settingsStore.setColor(colorId);
}

// ==================== 主题切换逻辑 ====================

/**
 * 切换主题模式（亮色/暗色/系统）
 * 支持 View Transition API 实现平滑的圆形扩散动画效果
 *
 * @param nextMode - 目标主题模式
 * @param event - 点击事件对象，用于获取点击位置作为动画起点
 */
async function setThemeMode(nextMode: ThemeMode, event?: MouseEvent) {
  // 如果当前模式与目标模式相同，直接返回避免重复操作
  if (savedMode.value === nextMode && mode.value === nextMode) {
    return;
  }

  /**
   * 应用新的主题模式
   * 更新 store 和响应式引用，并等待 DOM 更新
   */
  const applyNextMode = async () => {
    settingsStore.setMode(nextMode);
    mode.value = nextMode;
    await nextTick();
  };

  // 检查浏览器是否支持 View Transition API 且用户未禁用减少动画
  const startViewTransition = document.startViewTransition?.bind(document);
  const supportsTransition =
    !!startViewTransition && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 如果不支持过渡动画，直接应用新模式
  if (!supportsTransition) {
    await applyNextMode();
    return;
  }

  // 计算动画起始点（默认为点击位置，无点击时为中心点）
  const x = event?.clientX ?? window.innerWidth / 2;
  const y = event?.clientY ?? window.innerHeight / 2;

  // 计算结束半径，确保覆盖整个视口
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  // 启动视图过渡
  const transition = startViewTransition(() => applyNextMode());

  // 等待过渡准备就绪后执行动画
  await transition.ready;

  // 执行圆形扩散动画
  document.documentElement.animate(
    {
      clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
    },
    {
      duration: THEME_TRANSITION_DURATION,
      easing: THEME_TRANSITION_EASING,
      pseudoElement: "::view-transition-new(root)",
    },
  );
}

// ==================== 生命周期钩子 ====================

/**
 * 组件挂载时初始化主题
 * 从 store 中读取保存的主题设置并应用
 */
onMounted(() => {
  mode.value = savedMode.value;
  applyThemeMode(savedMode.value);
  applyThemeColor(color.value);
});
</script>
