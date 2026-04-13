use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tauri::{Emitter, Manager, Runtime, State};
use tokio::sync::RwLock;

use crate::proxy_server::{get_proxy_mode, start_local_proxy, ProxyConfig, ProxyMode, SharedProxy};

pub struct ProxyState {
    pub config: SharedProxy,
    pub local_addr: Arc<RwLock<Option<String>>>,
}

#[derive(Serialize)]
pub struct ProxyStatus {
    mode: String,
    upstream: Option<String>,
    local_addr: Option<String>,
}

#[derive(Deserialize)]
pub struct SetProxyArgs {
    proxy: Option<String>,
}

#[tauri::command]
pub async fn get_local_proxy_addr(state: State<'_, ProxyState>) -> Result<String, String> {
    state
        .local_addr
        .read()
        .await
        .clone()
        .ok_or_else(|| "Local proxy not started".to_string())
}

#[tauri::command]
pub async fn set_proxy(state: State<'_, ProxyState>, args: SetProxyArgs) -> Result<String, String> {
    let next_proxy = args
        .proxy
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty());

    {
        let mut config = state.config.write().await;
        config.upstream = next_proxy.clone();
    }

    let local_addr = get_local_proxy_addr(state).await?;
    match &next_proxy {
        Some(proxy) => Ok(format!(
            "Proxy set to {proxy}, via local proxy {local_addr}"
        )),
        None => Ok(format!("Proxy cleared, direct connection via {local_addr}")),
    }
}

#[tauri::command]
pub async fn clear_proxy(state: State<'_, ProxyState>) -> Result<String, String> {
    {
        let mut config = state.config.write().await;
        config.upstream = None;
    }

    let local_addr = state.local_addr.read().await.clone();
    let _ = local_addr;
    Ok("Proxy cleared, now using direct connection".to_string())
}

#[tauri::command]
pub async fn get_proxy(state: State<'_, ProxyState>) -> Result<Option<String>, String> {
    Ok(state.config.read().await.upstream.clone())
}

#[tauri::command]
pub async fn get_proxy_status(state: State<'_, ProxyState>) -> Result<ProxyStatus, String> {
    let mode = match get_proxy_mode(&state.config).await {
        ProxyMode::Direct => "direct".to_string(),
        ProxyMode::Upstream => "upstream".to_string(),
    };
    let upstream = state.config.read().await.upstream.clone();
    let local_addr = state.local_addr.read().await.clone();

    Ok(ProxyStatus {
        mode,
        upstream,
        local_addr,
    })
}

pub fn setup<R: Runtime>(app: &tauri::App<R>) -> Result<(), String> {
    let config: SharedProxy = Arc::new(RwLock::new(ProxyConfig::default()));
    let local_addr = Arc::new(RwLock::new(None));

    let addr = tauri::async_runtime::block_on(start_local_proxy(config.clone()))
        .map_err(|error| format!("Failed to start local proxy: {error}"))?;
    let addr_str = format!("http://{addr}");
    *local_addr.blocking_write() = Some(addr_str.clone());

    app.manage(ProxyState { config, local_addr });
    let _ = app.app_handle().emit("proxy-server-ready", &addr_str);
    Ok(())
}
