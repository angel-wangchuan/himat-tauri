import { ref } from "vue";

export function useTauri() {
  const isTauri = ref(typeof window !== "undefined" && "__TAURI_INTERNALS__" in window);

  async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    if (!isTauri.value) {
      console.warn("[useTauri] Not running in Tauri context");
      throw new Error("Not in Tauri");
    }
    const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
    return tauriInvoke<T>(cmd, args);
  }

  async function openUrl(url: string): Promise<void> {
    if (!isTauri.value) {
      console.warn("[useTauri] Not running in Tauri context");
      throw new Error("Not in Tauri");
    }
    await invoke("open_external", { url });
  }

  return { isTauri, invoke, openUrl };
}
