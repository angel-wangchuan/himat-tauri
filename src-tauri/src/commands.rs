use crate::tray::{self, NativeMenuLabels};
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub fn get_platform() -> String {
    std::env::consts::OS.to_string()
}

#[tauri::command]
pub fn open_external(app: tauri::AppHandle, url: String) -> Result<(), String> {
    app.opener()
        .open_url(url, None::<&str>)
        .map_err(|err| err.to_string())
}

#[tauri::command]
pub fn update_tray_tooltip(app: tauri::AppHandle, text: String) {
    if let Some(tray) = app.tray_by_id("main") {
        let _ = tray.set_tooltip(Some(&text));
    }
}

#[tauri::command]
pub fn update_native_menus(app: tauri::AppHandle, labels: NativeMenuLabels) -> Result<(), String> {
    tray::update_native_menus(&app, labels).map_err(|err| err.to_string())
}
