<script setup lang="ts">
import BackgroundDark from "@imgs/background-dark.png";
import BackgroundLight from "@imgs/background-light.png";
import { useColorMode } from "@vueuse/core";
const mode = useColorMode({ disableTransition: false });
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
