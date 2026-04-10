<script setup lang="ts">
import { listen } from "@tauri-apps/api/event";
import BackgroundDark from "@imgs/background-dark.png";
import BackgroundLight from "@imgs/background-light.png";
import { useColorMode } from "@vueuse/core";
const mode = useColorMode({ disableTransition: false });

listen<string>("navigate", (event) => {
  console.log("event", event);
  if (event.payload === "settings") {
    // 跳转到设置页
    // router.push("/settings");？
  }
});
</script>

<template>
  <div
    class="h-dvh overflow-hidden"
    :style="{ backgroundImage: `url(${mode === 'dark' ? BackgroundDark : BackgroundLight})` }"
  >
    <Tabs />
    <router-view />
  </div>
</template>
