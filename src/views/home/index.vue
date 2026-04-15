<script setup lang="ts">
import { computed } from "vue";

import { router } from "@/router";
import { getAppMenu } from "@/config/launchpad";
import { useMiniApps } from "@/composables/useMiniApps";

const appMenu = computed(() => getAppMenu());
const { homeApps, loadMiniApps, openMiniApp, removeMiniAppFromHome } = useMiniApps();

onMounted(() => {
  void loadMiniApps();
});
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
          class="group cursor-pointer p-2 flex items-center gap-3 rounded-md border border-border bg-background text-left custom-hover"
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
          <p class="text-sm font-semibold text-foreground">{{ $t("home.quickAccess") }}</p>
        </div>

        <div
          class="mt-5 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10"
        >
          <div
            v-for="item in homeApps"
            :key="item.id"
            type="button"
            class="group flex flex-col items-center rounded-[20px] px-3 py-4 transition-all hover:-translate-y-0.5 cursor-pointer"
            @click="openMiniApp(item)"
          >
            <ContextMenu>
              <ContextMenuTrigger>
                <div
                  class="flex h-16 w-16 items-center justify-center rounded-[22px] bg-white shadow-sm ring-1 ring-slate-200/60"
                >
                  <img
                    :src="item.logo"
                    :alt="item.name"
                    class="size-12 rounded-[16px] object-cover"
                  />
                </div>
                <p class="mt-3 text-center text-sm font-medium text-foreground">{{ item.name }}</p>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem @click="removeMiniAppFromHome(item)">
                  {{ $t("miniapp.menuItem.removeHome") }}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>

        <div
          v-if="homeApps.length === 0"
          class="mt-5 rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center text-sm text-muted-foreground"
        >
          {{ $t("home.emptyApps") }}
        </div>
      </div>
    </section>
  </ScrollArea>
</template>
