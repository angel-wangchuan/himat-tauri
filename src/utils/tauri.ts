export function isTauriEnvironment() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function tauriInvoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauriEnvironment()) {
    throw new Error("Not in Tauri");
  }

  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

export async function tauriOpenExternal(url: string): Promise<void> {
  await tauriInvoke("open_external", { url });
}
