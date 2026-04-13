<script setup lang="ts">
import { listen } from "@tauri-apps/api/event";
import BackgroundDark from "@imgs/background-dark.png";
import BackgroundLight from "@imgs/background-light.png";
import { useColorMode } from "@vueuse/core";
import { onMounted, onUnmounted } from "vue";

const mode = useColorMode({ disableTransition: false });

function disableContextMenu(event: MouseEvent) {
  event.preventDefault();
}

listen<string>("navigate", (event) => {
  if (event.payload === "settings") {
    // router.push("/settings");
  }
});

onMounted(() => {
  document.addEventListener("contextmenu", disableContextMenu);
});

onUnmounted(() => {
  document.removeEventListener("contextmenu", disableContextMenu);
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
