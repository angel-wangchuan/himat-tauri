// src/i18n/index.ts
import { createI18n } from "vue-i18n";
import zhCN from "./locales/zh-CN";
import zhTW from "./locales/zh-TW";
import enUS from "./locales/en-US";

export type Lang = "zh-CN" | "zh-TW" | "en-US";

const STORAGE_KEY = "app-locale";

export type AppLocale = Lang;

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

export function setLocale(locale: AppLocale): void {
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
  document.documentElement.lang = locale;
}

export function getLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale;
}
