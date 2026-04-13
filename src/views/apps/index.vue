<script setup lang="ts">
import { useMiniApps } from "@/composables/useMiniApps";

const {
  searchInput,
  filteredApps,
  loadMiniApps,
  openMiniApp,
  applySearch,
  clearSearch,
  addMiniAppToHome,
  hideMiniApp,
  isHomeMiniApp,
} = useMiniApps();

onMounted(() => {
  void loadMiniApps(true);
});
</script>

<template>
  <ScrollArea class="custom-box">
    <div class="flex items-center justify-between p-2">
      <div class="font-semibold">{{ $t("miniapp.name") }}</div>
      <div class="flex items-center gap-1">
        <div class="relative w-full max-w-sm items-center">
          <Input
            id="search"
            v-model="searchInput"
            type="text"
            :placeholder="$t('common.search')"
            class="h-8 pl-10 pr-10"
            @keydown.enter="applySearch"
          />
          <span
            class="pointer-events-none absolute start-0 inset-y-0 flex items-center justify-center px-2"
          >
            <SvgIcon icon="ri:search-line" class="size-4 text-muted-foreground" />
          </span>
          <Button
            variant="ghost"
            class="absolute end-1 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center text-muted-foreground transition hover:text-destructive"
            @click="clearSearch"
          >
            <SvgIcon icon="ri:close-line" class="size-4" />
          </Button>
        </div>

        <!-- <Button variant="ghost" class="size-8">
          <SvgIcon icon="ri:settings-line" class="size-4" />
        </Button> -->
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 p-2">
      <template v-for="value in filteredApps" :key="value.id">
        <ContextMenu>
          <ContextMenuTrigger>
            <div
              data-custom-context-menu-ignore="true"
              class="py-3 flex cursor-pointer flex-col items-center gap-4 rounded-md border border-border bg-background text-center custom-hover"
              @click="openMiniApp(value)"
            >
              <img :src="value.logo" :alt="value.name" class="size-12 rounded-md" />
              <span class="text-xs text-center">{{ value.name }}</span>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem @click="addMiniAppToHome(value)">
              {{
                isHomeMiniApp(value.id)
                  ? $t("miniapp.menuItem.addedHome")
                  : $t("miniapp.menuItem.addHome")
              }}
            </ContextMenuItem>
            <ContextMenuItem @click="hideMiniApp(value)">
              {{ $t("miniapp.menuItem.hide") }}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </template>
    </div>
  </ScrollArea>
</template>
