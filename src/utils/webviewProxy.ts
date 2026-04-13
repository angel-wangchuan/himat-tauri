const SUPPORTED_WEBVIEW_PROXY_PROTOCOLS = new Set(["http:", "socks5:"]);

export interface ResolvedWebviewProxy {
  proxyUrl?: string;
  error?: string;
}

export function resolveWebviewProxyUrl(input?: string | null): ResolvedWebviewProxy {
  const trimmed = input?.trim();
  if (!trimmed) {
    return { proxyUrl: undefined };
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return {
      error: "WebView 代理格式无效，请使用 http://127.0.0.1:7890 或 socks5://127.0.0.1:1080",
    };
  }

  if (!SUPPORTED_WEBVIEW_PROXY_PROTOCOLS.has(parsedUrl.protocol)) {
    return {
      error: "WebView 代理仅支持 http:// 或 socks5://",
    };
  }

  if (!parsedUrl.hostname || !parsedUrl.port) {
    return {
      error: "WebView 代理必须包含主机和端口，例如 http://127.0.0.1:7890",
    };
  }

  if (parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
    return {
      error: "WebView 代理暂不支持用户名、密码或附加参数",
    };
  }

  if (parsedUrl.pathname && parsedUrl.pathname !== "/") {
    return {
      error: "WebView 代理地址不能包含路径",
    };
  }

  return {
    proxyUrl: `${parsedUrl.protocol}//${parsedUrl.host}`,
  };
}
