import { ref } from "vue";

import { isTauriEnvironment, tauriInvoke, tauriOpenExternal } from "@/utils/tauri";

export function useTauri() {
  const isTauri = ref(isTauriEnvironment());

  async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    if (!isTauri.value) {
      console.warn("[useTauri] Not running in Tauri context");
      throw new Error("Not in Tauri");
    }
    return tauriInvoke<T>(cmd, args);
  }

  async function openUrl(url: string): Promise<void> {
    if (!isTauri.value) {
      console.warn("[useTauri] Not running in Tauri context");
      throw new Error("Not in Tauri");
    }
    await tauriOpenExternal(url);
  }

  return { isTauri, invoke, openUrl };
}
