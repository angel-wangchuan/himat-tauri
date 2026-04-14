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
            :disabled="updaterStatus.checking"
            @click="handleCheckForUpdates"
          >
            <SvgIcon
              v-if="updaterStatus.checking"
              icon="line-md:loading-loop"
              class="mr-1.5 h-4 w-4"
            />
            {{
              updaterStatus.checking
                ? t("settings.about.updates.checking")
                : t("settings.about.updates.check")
            }}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { OFFICIAL_WEBSITE_URL } from "@/config/constants";
import { useTauri } from "@/composables/useTauri";
import { useAppUpdater } from "@/composables/useAppUpdater";

const { t } = useI18n();
const { isTauri, openUrl, invoke } = useTauri();
const { status: updaterStatus, checkForUpdates, installUpdateAndRestart } = useAppUpdater();

// 应用版本号
const version = ref("0.0.0");

onMounted(async () => {
  try {
    // 在 Tauri 环境中，通过 invoke 获取 Rust 后端的版本号
    if (isTauri.value) {
      version.value = await invoke("get_app_version");
    }
  } catch (error) {
    console.error("获取版本号失败:", error);
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
  const hasUpdate = await checkForUpdates();

  // 如果有更新，询问用户是否安装
  if (hasUpdate && updaterStatus.value.update) {
    // 这里可以添加确认对话框，目前直接安装
    await installUpdateAndRestart();
  }
}
</script>
