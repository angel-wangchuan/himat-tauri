<template>
  <div class="flex flex-col gap-6 p-4">
    <span class="text-md">系统设置</span>

    <Mode />

    <div>
      <span class="text-md">WebView 代理</span>
      <Input v-model="webviewProxy" placeholder="例如 http://127.0.0.1:7890" class="w-80 mt-2" />
      <p class="mt-2 text-xs text-muted-foreground">
        仅支持 http:// 和 socks5://，并且必须包含端口。留空时按直连打开。
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";

import { useSettingsStore } from "@/store/modules/settings";

const settingsStore = useSettingsStore();
const { webviewProxy } = storeToRefs(settingsStore);
</script>
