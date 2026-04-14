import { listen } from "@tauri-apps/api/event";

import { tauriInvoke } from "@/utils/tauri";
import { PROXY_MAX_RETRY_COUNT, PROXY_RETRY_DELAY_MS, PROXY_TIMEOUT_MS } from "@/config/constants";

interface SetProxyArgs {
  proxy: string | null;
}

export interface ProxyStatus {
  mode: "direct" | "upstream";
  upstream: string | null;
  local_addr: string | null;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function invokeProxy<T>(command: string, args?: Record<string, unknown>) {
  try {
    return await tauriInvoke<T>(command, args);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : JSON.stringify(error);
    throw new Error(`[proxy] ${command} failed: ${message}`);
  }
}

export async function getLocalProxyAddr(): Promise<string> {
  return invokeProxy<string>("get_local_proxy_addr");
}

export async function setProxy(proxyUrl: string): Promise<string> {
  return invokeProxy<string>("set_proxy", {
    args: { proxy: proxyUrl } as SetProxyArgs,
  });
}

export async function clearProxy(): Promise<string> {
  return invokeProxy<string>("clear_proxy");
}

export async function getProxy(): Promise<string | null> {
  return invokeProxy<string | null>("get_proxy");
}

export async function getProxyStatus(): Promise<ProxyStatus> {
  return invokeProxy<ProxyStatus>("get_proxy_status");
}

export function waitForProxyServer(): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId = 0;
    let disposeListener: (() => void) | null = null;

    const cleanup = () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      disposeListener?.();
    };

    const settle = (callback: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      callback();
    };

    void listen<string>("proxy-server-ready", (event) => {
      settle(() => resolve(event.payload));
    }).then((dispose) => {
      disposeListener = dispose;
    });

    void (async () => {
      for (let attempt = 0; attempt < PROXY_MAX_RETRY_COUNT && !settled; attempt += 1) {
        try {
          const localAddr = await getLocalProxyAddr();
          settle(() => resolve(localAddr));
          return;
        } catch {
          await sleep(PROXY_RETRY_DELAY_MS);
        }
      }
    })();

    timeoutId = window.setTimeout(() => {
      settle(() => reject(new Error("本地代理服务启动超时")));
    }, PROXY_TIMEOUT_MS);
  });
}
