// src/i18n/index.ts
import { createI18n } from "vue-i18n";
import zhCN from "./locales/zh-CN";
import zhTW from "./locales/zh-TW";
import enUS from "./locales/en-US";

export type Lang = "zh-CN" | "zh-TW" | "en-US";

const STORAGE_KEY = "app-locale";

export type AppLocale = Lang;

type NativeMenuLabels = {
  tray: {
    show: string;
    quit: string;
  };
  mac: {
    appMenuTitle: string;
    about: string;
    services: string;
    hide: string;
    hideOthers: string;
    showAll: string;
    quit: string;
    editMenuTitle: string;
    undo: string;
    redo: string;
    cut: string;
    copy: string;
    paste: string;
    selectAll: string;
    viewMenuTitle: string;
    enterFullScreen: string;
    windowMenuTitle: string;
    showWindow: string;
    minimize: string;
    closeWindow: string;
  };
};

function getInitialLocale(): AppLocale {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "zh-CN" || saved === "zh-TW" || saved === "en-US") return saved;
  // 检测浏览器语言
  const browser = navigator.language;
  return browser.startsWith("zh") ? "zh-CN" : "en-US";
}

export const i18n = createI18n({
  legacy: false,
  locale: getInitialLocale(),
  fallbackLocale: "zh-CN",
  messages: {
    "zh-CN": zhCN,
    "zh-TW": zhTW,
    "en-US": enUS,
  },
});

function getNativeMenuLabels(locale: AppLocale): NativeMenuLabels {
  const messages = i18n.global.getLocaleMessage(locale) as { nativeMenu: NativeMenuLabels };
  return messages.nativeMenu;
}

export async function syncNativeMenus(locale: AppLocale = getLocale()): Promise<void> {
  document.documentElement.lang = locale;

  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) {
    return;
  }

  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("update_native_menus", { labels: getNativeMenuLabels(locale) });
}

export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  void syncNativeMenus(locale);
}

export function getLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale;
}
