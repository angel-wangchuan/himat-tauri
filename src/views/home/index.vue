<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";

import { useUserStore } from "@/store/modules/user";
import { router } from "@/router";
import { getAppMenu } from "@/config/launchpad";

const userStore = useUserStore();
const { serverUrl } = storeToRefs(userStore);

const appMenu = computed(() => getAppMenu());

const miniPrograms = [
  { title: "Reaxys", icon: "ri:planet-line" },
  { title: "在线文献检索", icon: "ri:earth-line" },
  { title: "WOS", icon: "ri:pie-chart-2-line" },
  { title: "PubMed", icon: "ri:hospital-line" },
  { title: "CNKI", icon: "ri:book-2-line" },
  { title: "专利查询", icon: "ri:search-eye-line" },
  { title: "图书馆资源", icon: "ri:building-line" },
  { title: "ITIC-SCI", icon: "ri:global-line" },
  { title: "邮箱", icon: "ri:mail-line" },
  { title: "合成参数预测模型", icon: "ri:test-tube-line" },
  { title: "MAIC 算力集群", icon: "ri:cloud-line" },
];
</script>

<template>
  <ScrollArea class="custom-box">
    <section class="space-y-6 px-3">
      <div class="mt-4 grid gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <div
          variant="ghost"
          v-for="app in appMenu"
          :key="app.name"
          @click.stop="router.push({ path: app.path })"
          class="group cursor-pointer p-2 flex items-center gap-3 rounded-md border border-border bg-background text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_12px_30px_rgba(113,150,206,0.14)]"
        >
          <div
            class="size-12 flex shrink-0 items-center justify-center rounded-md bg-linear-to-br text-slate-700"
            :class="app.path"
          >
            <img :src="app.icon" :alt="app.name" />
          </div>
          <div class="min-w-0">
            <p class="truncate font-semibold text-foreground">{{ app.name }}</p>
            <p class="mt-1 text-xs leading-6 text-foreground/50">{{ app.description }}</p>
          </div>
        </div>
      </div>

      <div class="">
        <div>
          <p class="text-sm font-semibold text-foreground">小程序</p>
        </div>

        <div
          class="mt-5 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
        >
          <div
            v-for="item in miniPrograms"
            :key="item.title"
            type="button"
            class="group flex flex-col items-center rounded-[20px] px-3 py-4 transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <div
              class="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white shadow-sm ring-1 ring-slate-200/60"
            >
              <SvgIcon :icon="item.icon" class="text-4xl text-sky-500" />
            </div>
            <p class="mt-3 text-center text-sm font-medium text-foreground">{{ item.title }}</p>
          </div>
        </div>
      </div>
    </section>
  </ScrollArea>
</template>
