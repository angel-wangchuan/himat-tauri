<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useColorMode } from "@vueuse/core";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18nHelper } from "@/composables/useI18nHelper";

// 传入 { disableTransition: false } 以启用过渡效果
const mode = useColorMode({ disableTransition: false });

const { locale, currentLabel, langOptions, switchLocale } = useI18nHelper();

// 颜色方案
const colors = [
  { id: "default", label: "默认", hex: "#0293ff" },
  { id: "green", label: "绿色", hex: "#22c55e" },
  { id: "purple", label: "紫色", hex: "#a855f7" },
  { id: "orange", label: "橙色", hex: "#f97316" },
  { id: "rose", label: "玫红", hex: "#f43f5e" },
] as const;
type ColorId = (typeof colors)[number]["id"];

const currentColor = ref<ColorId>("default");

function setColor(id: ColorId) {
  document.documentElement.setAttribute("data-color", id);
  localStorage.setItem("color-theme", id);
  currentColor.value = id;
}

onMounted(() => {
  const saved = localStorage.getItem("color-theme") as ColorId | null;
  if (saved) setColor(saved);
});
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline">
        <span>切换主题</span>
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="mode = 'light'"> 亮色 </DropdownMenuItem>
      <DropdownMenuItem @click="mode = 'dark'"> 暗黑 </DropdownMenuItem>
      <DropdownMenuItem @click="mode = 'auto'"> 系统 </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline">
        <span>切换颜色方案</span>
      </Button>
      <div class="bg-primary size-6"></div>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="setColor(color.id)" v-for="color in colors" :key="color.id">
        {{ color.label }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="outline">
        <span>语言 {{ currentLabel }}</span>
        <span>{{ $t("menu.chat.name") }}</span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end">
      <DropdownMenuItem
        @click="switchLocale(lang.value)"
        v-for="lang in langOptions"
        :key="lang.value"
      >
        {{ lang.label }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
