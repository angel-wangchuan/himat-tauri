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

        <!-- 更新配置区域 -->
        <div class="mt-4 border-t pt-4">
          <div class="flex items-center justify-between mb-3">
            <div class="text-sm font-medium">{{ t("settings.about.updateConfig.title") }}</div>
            <div class="flex gap-1">
              <Button
                v-if="isEditing"
                variant="ghost"
                size="sm"
                class="h-7 text-xs"
                @click="cancelEdit"
              >
                {{ t("common.cancel") }}
              </Button>
              <Button variant="ghost" size="sm" class="h-7 text-xs" @click="toggleEdit">
                {{ isEditing ? t("common.save") : t("common.edit") }}
              </Button>
            </div>
          </div>

          <!-- 配置显示/编辑模式 -->
          <div v-if="!isEditing && updateConfig" class="space-y-2 text-sm">
            <div class="flex items-start gap-2">
              <span class="text-muted-foreground min-w-[80px]">{{
                t("settings.about.updateConfig.enabled")
              }}</span>
              <Badge :variant="updateConfig.enabled ? 'default' : 'secondary'">
                {{ updateConfig.enabled ? t("common.yes") : t("common.no") }}
              </Badge>
            </div>
            <div class="flex items-start gap-2">
              <span class="text-muted-foreground min-w-[80px]">{{
                t("settings.about.updateConfig.endpoints")
              }}</span>
              <div class="flex-1 break-all">
                <div
                  v-for="(endpoint, index) in updateConfig.endpoints"
                  :key="index"
                  class="text-xs font-mono bg-muted px-2 py-1 rounded mb-1"
                >
                  {{ endpoint }}
                </div>
              </div>
            </div>
            <div v-if="showPubkey" class="flex items-start gap-2">
              <span class="text-muted-foreground min-w-[80px]">{{
                t("settings.about.updateConfig.pubkey")
              }}</span>
              <div class="flex-1 break-all text-xs font-mono bg-muted px-2 py-1 rounded">
                {{ updateConfig.pubkey.substring(0, 50) }}...
              </div>
            </div>
            <div v-if="updateConfig.lastUpdated" class="flex items-start gap-2">
              <span class="text-muted-foreground min-w-[80px]">{{
                t("settings.about.updateConfig.lastUpdated")
              }}</span>
              <span class="text-xs">{{ formatDate(updateConfig.lastUpdated) }}</span>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-else-if="isEditing" class="space-y-3">
            <div class="flex items-center gap-2">
              <Switch id="config-enabled" v-model="editForm.enabled" />
              <Label for="config-enabled" class="text-sm">{{
                t("settings.about.updateConfig.enabled")
              }}</Label>
            </div>
            <div>
              <Label for="config-endpoints" class="text-xs text-muted-foreground">
                {{ t("settings.about.updateConfig.endpoints") }}
              </Label>
              <Textarea
                id="config-endpoints"
                v-model="editForm.endpointsText"
                :placeholder="t('settings.about.updateConfig.endpointsPlaceholder')"
                class="mt-1 font-mono text-xs"
                rows="3"
              />
              <p class="text-xs text-muted-foreground mt-1">
                {{ t("settings.about.updateConfig.endpointsHint") }}
              </p>
            </div>
            <div>
              <Label for="config-pubkey" class="text-xs text-muted-foreground">
                {{ t("settings.about.updateConfig.pubkey") }}
              </Label>
              <Textarea
                id="config-pubkey"
                v-model="editForm.pubkey"
                :placeholder="t('settings.about.updateConfig.pubkeyPlaceholder')"
                class="mt-1 font-mono text-xs"
                rows="2"
              />
            </div>
            <Button variant="default" size="sm" class="w-full" @click="saveConfig">
              {{ t("common.save") }}
            </Button>
          </div>

          <!-- 未加载状态 -->
          <div v-else class="text-sm text-muted-foreground text-center py-4">
            {{ t("settings.about.updateConfig.loading") }}
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { OFFICIAL_WEBSITE_URL } from "@/config/constants";
import { useTauri } from "@/composables/useTauri";
import { useAppUpdater } from "@/composables/useAppUpdater";

const { t } = useI18n();
const { isTauri, openUrl, invoke } = useTauri();
const {
  status: updaterStatus,
  checkForUpdates,
  installUpdateAndRestart,
  getCurrentConfig,
  saveUpdateConfig,
} = useAppUpdater();

// 应用版本号
const version = ref("0.0.0");

// 更新配置
const updateConfig = ref(null);
const isEditing = ref(false);
const showPubkey = ref(false);

// 编辑表单
const editForm = ref({
  enabled: true,
  endpointsText: "",
  pubkey: "",
});

onMounted(async () => {
  try {
    // 在 Tauri 环境中，通过 invoke 获取 Rust 后端的版本号
    if (isTauri.value) {
      version.value = await invoke("get_app_version");
    }

    // 加载更新配置
    const config = await getCurrentConfig();
    if (config) {
      updateConfig.value = config;
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
  const hasUpdate = await checkForUpdates();

  // 如果有更新，询问用户是否安装
  if (hasUpdate && updaterStatus.value.update) {
    await installUpdateAndRestart();
  }
}

function toggleEdit() {
  if (isEditing.value) {
    // 保存
    saveConfig();
  } else {
    // 进入编辑模式
    if (updateConfig.value) {
      editForm.value = {
        enabled: updateConfig.value.enabled,
        endpointsText: updateConfig.value.endpoints.join("\n"),
        pubkey: updateConfig.value.pubkey,
      };
    }
    isEditing.value = true;
  }
}

function cancelEdit() {
  isEditing.value = false;
}

function saveConfig() {
  if (!updateConfig.value) return;

  const endpoints = editForm.value.endpointsText
    .split("\n")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);

  if (endpoints.length === 0) {
    alert(t("settings.about.updateConfig.validation.endpointsRequired"));
    return;
  }

  const newConfig = {
    ...updateConfig.value,
    enabled: editForm.value.enabled,
    endpoints,
    pubkey: editForm.value.pubkey,
    lastUpdated: new Date().toISOString(),
  };

  saveUpdateConfig(newConfig);
  updateConfig.value = newConfig;
  isEditing.value = false;
}

function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch {
    return dateString;
  }
}
</script>
