/**
 * 应用更新管理 Composable
 *
 * 使用 Tauri updater 插件的静态 JSON 文件模式
 * 服务端需要提供 latest.json 文件，格式如下：
 * {
 *   "version": "1.0.1",
 *   "notes": "更新说明",
 *   "pub_date": "2025-02-10T14:16:54.999Z",
 *   "platforms": {
 *     "darwin-aarch64": {
 *       "signature": "签名",
 *       "url": "https://example.com/update.tar.gz"
 *     }
 *   }
 * }
 */

import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { toast } from "vue-sonner";
import { check, DownloadEvent, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdateStatus {
  /** 是否正在检查更新 */
  checking: boolean;
  /** 是否正在下载更新 */
  downloading: boolean;
  /** 是否有可用更新 */
  available: boolean;
  /** 当前更新信息 */
  update: Update | null;
  /** 下载进度 (0-100) */
  progress: number;
}

/**
 * 应用更新 Hook
 *
 * @example
 * ```ts
 * const { checkForUpdates, installUpdateAndRestart } = useAppUpdater();
 * await checkForUpdates();
 * ```
 */
export function useAppUpdater() {
  const { t } = useI18n();

  const status = ref<UpdateStatus>({
    checking: false,
    downloading: false,
    available: false,
    update: null,
    progress: 0,
  });

  /**
   * 检查更新
   *
   * @returns 是否有可用更新
   */
  async function checkForUpdates(): Promise<boolean> {
    if (status.value.checking) {
      return false;
    }

    status.value.checking = true;
    toast.info(t("settings.about.updates.checking"));

    try {
      const update = await check();

      if (update) {
        status.value.available = true;
        status.value.update = update;
        toast.success(t("settings.about.updates.updateAvailable", { version: update.version }));
        return true;
      } else {
        status.value.available = false;
        status.value.update = null;
        toast.info(t("settings.about.updates.upToDate"));
        return false;
      }
    } catch (error) {
      console.error("Check for updates failed:", error);
      toast.error(t("settings.about.updates.error"));
      return false;
    } finally {
      status.value.checking = false;
    }
  }

  /**
   * 下载并安装更新
   *
   * @param onUpdateProgress - 进度回调函数 (可选)
   */
  async function downloadAndUpdate(onUpdateProgress?: (progress: number) => void): Promise<void> {
    if (!status.value.update) {
      toast.info(t("settings.about.updates.noUpdate"));
      return;
    }

    status.value.downloading = true;
    status.value.progress = 0;
    toast.info(t("settings.about.updates.downloading"));

    try {
      let downloadedSize = 0;
      let totalSize = 0;

      await status.value.update.downloadAndInstall((event: DownloadEvent) => {
        switch (event.event) {
          case "Started":
            totalSize = event.data.contentLength || 0;
            break;
          case "Progress":
            downloadedSize += event.data.chunkLength;
            if (totalSize > 0) {
              const progress = Math.round((downloadedSize / totalSize) * 100);
              status.value.progress = progress;
              onUpdateProgress?.(progress);
            }
            break;
          case "Finished":
            status.value.progress = 100;
            onUpdateProgress?.(100);
            break;
        }
      });

      toast.success(t("settings.about.updates.installing"));
    } catch (error) {
      console.error("Download and install update failed:", error);
      toast.error(t("settings.about.updates.error"));
      throw error;
    } finally {
      status.value.downloading = false;
    }
  }

  /**
   * 下载更新、安装并重启应用
   */
  async function installUpdateAndRestart(): Promise<void> {
    try {
      await downloadAndUpdate();
      toast.info(t("settings.about.updates.restart"));
      // 等待一下让用户看到提示
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await relaunch();
    } catch (error) {
      console.error("Install update and restart failed:", error);
      throw error;
    }
  }

  /**
   * 重置更新状态
   */
  function resetStatus() {
    status.value = {
      checking: false,
      downloading: false,
      available: false,
      update: null,
      progress: 0,
    };
  }

  return {
    status,
    checkForUpdates,
    downloadAndUpdate,
    installUpdateAndRestart,
    resetStatus,
  };
}
