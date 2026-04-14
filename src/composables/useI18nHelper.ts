import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { type AppLocale, setLocale } from "@/i18n";

export function useI18nHelper() {
  const { locale } = useI18n();

  const langOptions = computed(() => [
    { value: "zh-CN" as AppLocale, label: "中文", flag: "🇨🇳" },
    { value: "zh-TW" as AppLocale, label: "繁体", flag: "🇭🇰" },
    { value: "en-US" as AppLocale, label: "English", flag: "🇺🇸" },
  ]);

  const currentLang = computed(() => {
    return langOptions.value.find((option) => option.value === locale.value);
  });

  function switchLocale(next: AppLocale) {
    setLocale(next);
  }

  return { locale, langOptions, currentLang, switchLocale };
}
