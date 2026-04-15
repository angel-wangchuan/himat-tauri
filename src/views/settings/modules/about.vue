<template>
  <div class="flex flex-col gap-2 p-2">
    <!-- 常规设置卡片 -->
    <Card class="flex min-h-0 flex-col gap-0 overflow-hidden py-0">
      <CardHeader class="border-b px-3 py-2! flex items-center justify-between">
        <div class="text-sm font-medium">{{ t("settings.about.title") }}</div>
        <div @click="openOfficialWebsite">
          <SvgIcon icon="radix-icons:external-link" class="text-lg cursor-pointer" />
        </div>
      </CardHeader>
      <CardContent class="min-h-0 flex-1 p-3">
        <div class="flex items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <img src="@imgs/logo.png" alt="Logo" class="size-12 rounded-sm object-contain" />
            <div class="flex flex-col gap-1">
              <div class="text-lg font-semibold flex items-center gap-2">
                <span>{{ t("app.name") }}</span>
                <Badge variant="outline" class="text-primary"> v{{ version }} </Badge>
              </div>
              <div class="text-sm text-muted-foreground">{{ t("settings.about.description") }}</div>
            </div>
          </div>
          <Button
            variant="outline"
            :disabled="updaterStatus.checking || updaterStatus.downloading"
            @click="handleCheckForUpdates"
          >
            <SvgIcon
              v-if="updaterStatus.checking || updaterStatus.downloading"
              icon="line-md:loading-loop"
              class="mr-1 size-4"
            />
            {{
              updaterStatus.checking
                ? t("settings.about.updates.checking")
                : updaterStatus.downloading
                  ? t("settings.about.updates.downloading")
                  : t("settings.about.updates.check")
            }}
          </Button>
        </div>

        <!-- 下载进度 -->
        <div v-if="updaterStatus.downloading" class="mt-4 border-t pt-4">
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">{{
                t("settings.about.updates.downloading")
              }}</span>
              <span class="text-xs font-mono">{{ updaterStatus.progress }}%</span>
            </div>
            <div class="h-2 bg-muted rounded-full overflow-hidden">
              <div
                class="h-full bg-primary transition-all duration-300"
                :style="{ width: `${updaterStatus.progress}%` }"
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- 更新对话框 -->
    <Dialog v-model:open="updateDialogOpen" v-if="updateInfo">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {{ t("settings.about.updates.updateAvailable", { version: updateInfo.version }) }}
          </DialogTitle>
        </DialogHeader>
        <div class="mt-2 max-h-60 overflow-auto rounded border bg-muted/50 p-3">
          <div class="whitespace-pre-wrap text-sm">{{ updateInfo.notes }}</div>
        </div>
        <DialogFooter class="gap-2 sm:gap-1">
          <Button variant="outline" @click="updateDialogOpen = false">
            {{ t("common.later") }}
          </Button>

          <Button :disabled="updaterStatus.downloading" @click="handleDownloadUpdate">
            <SvgIcon
              v-if="updaterStatus.downloading"
              icon="line-md:loading-loop"
              class="mr-1.5 h-4 w-4"
            />
            {{
              updaterStatus.downloading
                ? t("settings.about.updates.downloading")
                : t("settings.about.updates.download")
            }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { OFFICIAL_WEBSITE_URL } from "@/config/constants";
import { useTauri } from "@/composables/useTauri";
import { useAppUpdater } from "@/composables/useAppUpdater";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const { t } = useI18n();
const { isTauri, openUrl, invoke } = useTauri();
const {
  status: updaterStatus,
  checkForUpdates,
  downloadAndUpdate,
  installUpdateAndRestart,
} = useAppUpdater();

// 应用版本号
const version = ref("0.0.0");

// 更新对话框相关
const updateDialogOpen = ref(false);
const updateInfo = ref(null);

onMounted(async () => {
  try {
    // 在 Tauri 环境中，通过 invoke 获取 Rust 后端的版本号
    if (isTauri.value) {
      version.value = await invoke("get_app_version");
    }
  } catch (error) {
    console.error("初始化失败:", error);
    version.value = "0.0.0";
  }
});

async function openOfficialWebsite() {
  try {
    if (isTauri.value) {
      await openUrl(OFFICIAL_WEBSITE_URL);
      return;
    }

    window.open(OFFICIAL_WEBSITE_URL, "_blank", "noopener,noreferrer");
  } catch (error) {
    console.error("打开官方网站失败:", error);
  }
}

async function handleCheckForUpdates() {
  if (updaterStatus.value.checking || updaterStatus.value.downloading) {
    return;
  }

  const hasUpdate = await checkForUpdates();

  // 如果有更新，显示更新对话框
  if (hasUpdate && updaterStatus.value.available) {
    updateInfo.value = {
      version: updaterStatus.value.version,
      notes: updaterStatus.value.notes || "新版本已发布，请及时更新以获得最佳体验。",
    };
    updateDialogOpen.value = true;
  }
}

async function handleDownloadUpdate() {
  try {
    await downloadAndUpdate();
    updateDialogOpen.value = false;

    // 下载完成后提示用户重启
    if (confirm(t("settings.about.updates.restartPrompt"))) {
      await installUpdateAndRestart();
    }
  } catch (error) {
    console.error("下载更新失败:", error);
  }
}
</script>
