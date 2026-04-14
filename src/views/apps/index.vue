<template>
  <ScrollArea class="custom-box">
    <div class="flex items-center justify-between p-2">
      <div class="font-semibold">{{ $t("miniapp.title") }}</div>
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

        <Dialog>
          <DialogTrigger as-child>
            <Button variant="ghost" class="size-8">
              <SvgIcon icon="ri:settings-line" class="size-4" />
            </Button>
          </DialogTrigger>
          <DialogContent
            class="flex h-[80vh] w-[min(92vw,980px)] max-w-[min(92vw,980px)] flex-col overflow-hidden p-0"
            :show-close-button="true"
          >
            <DialogHeader class="border-b px-3 py-4">
              <DialogTitle>{{ $t("miniapp.settings.title") }}</DialogTitle>
            </DialogHeader>

            <div class="min-h-0 flex-1 rounded-2xl px-3 pb-3">
              <div class="grid h-full grid-cols-2 gap-4">
                <Card class="flex min-h-0 flex-col gap-0 overflow-hidden py-0">
                  <CardHeader class="border-b pl-3 pr-0 py-2! flex items-center justify-between">
                    <DialogTitle class="text-sm font-medium">
                      {{ $t("miniapp.settings.visible") }}
                    </DialogTitle>
                    <Button variant="link" size="sm" @click="swapMiniAppVisibility">
                      {{ $t("miniapp.settings.swap") }}
                    </Button>
                  </CardHeader>
                  <CardContent class="min-h-0 flex-1 p-2 pr-0">
                    <ScrollArea class="h-full pr-2">
                      <div v-if="visibleApps.length" class="flex flex-col gap-2 pb-0.25">
                        <button
                          v-for="app in visibleApps"
                          :key="app.id"
                          type="button"
                          class="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-left transition hover:bg-accent/40"
                          @click="hideMiniApp(app)"
                        >
                          <img
                            :src="app.logo"
                            :alt="app.name"
                            class="size-6 rounded-md object-cover"
                          />
                          <span class="min-w-0 flex-1 truncate text-sm">{{ app.name }}</span>
                          <span
                            v-if="isHomeMiniApp(app.id)"
                            class="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
                          >
                            {{ $t("miniapp.settings.homeTag") }}
                          </span>
                          <SvgIcon
                            icon="ri:eye-off-line"
                            class="size-4 shrink-0 text-muted-foreground"
                          />
                        </button>
                      </div>
                      <div
                        v-else
                        class="flex h-full items-center justify-center text-sm text-muted-foreground"
                      >
                        {{ $t("miniapp.settings.emptyVisible") }}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card class="flex min-h-0 flex-col gap-0 overflow-hidden py-0">
                  <CardHeader class="border-b pl-3 pr-0 py-2! flex items-center justify-between">
                    <DialogTitle class="text-sm font-medium">
                      {{ $t("miniapp.settings.hidden") }}
                    </DialogTitle>
                    <Button variant="link" size="sm" @click="resetMiniAppVisibility">
                      {{ $t("miniapp.settings.reset") }}
                    </Button>
                  </CardHeader>
                  <CardContent class="min-h-0 flex-1 p-2 pr-0">
                    <ScrollArea class="h-full pr-2">
                      <div v-if="hiddenApps.length" class="flex flex-col gap-2 pb-0.25">
                        <button
                          v-for="app in hiddenApps"
                          :key="app.id"
                          type="button"
                          class="flex w-full items-center gap-3 rounded-lg border border-border bg-background px-3 py-2 text-left transition hover:bg-accent/40"
                          @click="showMiniApp(app)"
                        >
                          <img
                            :src="app.logo"
                            :alt="app.name"
                            class="size-6 rounded-md object-cover"
                          />
                          <span class="min-w-0 flex-1 truncate text-sm">{{ app.name }}</span>
                          <SvgIcon
                            icon="ri:close-line"
                            class="size-4 shrink-0 text-muted-foreground"
                          />
                        </button>
                      </div>
                      <div
                        v-else
                        class="flex h-full items-center justify-center text-sm text-muted-foreground"
                      >
                        {{ $t("miniapp.settings.emptyHidden") }}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

<script setup lang="ts">
import { useMiniApps } from "@/composables/useMiniApps";

const {
  searchInput,
  filteredApps,
  visibleApps,
  hiddenApps,
  loadMiniApps,
  openMiniApp,
  applySearch,
  clearSearch,
  addMiniAppToHome,
  hideMiniApp,
  showMiniApp,
  swapMiniAppVisibility,
  resetMiniAppVisibility,
  isHomeMiniApp,
} = useMiniApps();

onMounted(() => {
  void loadMiniApps(true);
});
</script>
