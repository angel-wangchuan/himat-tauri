import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { type AppLocale, setLocale, getLocale } from "@/i18n";

export function useI18nHelper() {
  const { locale } = useI18n();

  const langOptions = computed(() => [
    { value: "zh-CN" as AppLocale, label: "中文" },
    { value: "zh-TW" as AppLocale, label: "繁体" },
    { value: "en-US" as AppLocale, label: "English" },
  ]);

  const currentLabel = computed(() => {
    return getLocale() === "zh-CN" ? "中文" : getLocale() === "zh-TW" ? "繁体" : "English";
  });

  function switchLocale(next: AppLocale) {
    setLocale(next);
  }

  return { locale, langOptions, currentLabel, switchLocale };
}
