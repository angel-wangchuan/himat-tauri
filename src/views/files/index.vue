<template>
  <section class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
    <div class="rounded-2xl border bg-background p-6">
      <p class="text-sm text-muted-foreground">文件</p>
      <h1 class="mt-2 text-2xl font-semibold">File</h1>
      <p class="text-muted-foreground mt-3 leading-7">
        这个页面只是用来验证文件已经设置好。后续你可以在这里替换成业务页面。
      </p>
    </div>
  </section>
</template>
<script setup lang="ts">
import { useRouter } from "vue-router";
const router = useRouter();
</script>
