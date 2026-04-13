mod commands;
mod proxy_plugin;
mod proxy_server;
mod tray;

use tauri::{RunEvent, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(tauri_plugin_log::log::LevelFilter::Info)
                .build(),
        )
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            commands::get_platform,
            commands::open_external,
            commands::update_tray_tooltip,
            commands::update_native_menus,
            proxy_plugin::get_local_proxy_addr,
            proxy_plugin::set_proxy,
            proxy_plugin::clear_proxy,
            proxy_plugin::get_proxy,
            proxy_plugin::get_proxy_status,
        ])
        .on_menu_event(tray::on_menu_event)
        .setup(|app| {
            tray::create(app.handle())?;
            proxy_plugin::setup(app)?;
            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            #[cfg(target_os = "macos")]
            if let RunEvent::Reopen { .. } = event {
                let _ = tray::show_main_window(app);
            }
        });
}
