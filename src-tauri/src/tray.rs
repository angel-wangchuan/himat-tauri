use serde::Deserialize;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NativeMenuLabels {
    pub tray: TrayMenuLabels,
    pub mac: MacMenuLabels,
}

#[derive(Debug, Clone, Deserialize)]
pub struct TrayMenuLabels {
    pub show: String,
    pub quit: String,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MacMenuLabels {
    pub app_menu_title: String,
    pub about: String,
    pub services: String,
    pub hide: String,
    pub hide_others: String,
    pub show_all: String,
    pub quit: String,
    pub edit_menu_title: String,
    pub undo: String,
    pub redo: String,
    pub cut: String,
    pub copy: String,
    pub paste: String,
    pub select_all: String,
    pub view_menu_title: String,
    pub enter_full_screen: String,
    pub window_menu_title: String,
    pub show_window: String,
    pub minimize: String,
    pub close_window: String,
}

impl Default for NativeMenuLabels {
    fn default() -> Self {
        Self {
            tray: TrayMenuLabels {
                show: "显示窗口".to_string(),
                quit: "退出".to_string(),
            },
            mac: MacMenuLabels {
                app_menu_title: "HiMat".to_string(),
                about: "关于 HiMat".to_string(),
                services: "服务".to_string(),
                hide: "隐藏 HiMat".to_string(),
                hide_others: "隐藏其他".to_string(),
                show_all: "显示全部".to_string(),
                quit: "退出 HiMat".to_string(),
                edit_menu_title: "编辑".to_string(),
                undo: "撤销".to_string(),
                redo: "重做".to_string(),
                cut: "剪切".to_string(),
                copy: "复制".to_string(),
                paste: "粘贴".to_string(),
                select_all: "全选".to_string(),
                view_menu_title: "视图".to_string(),
                enter_full_screen: "进入全屏".to_string(),
                window_menu_title: "窗口".to_string(),
                show_window: "显示窗口".to_string(),
                minimize: "最小化".to_string(),
                close_window: "关闭窗口".to_string(),
            },
        }
    }
}

pub fn create(app: &AppHandle) -> tauri::Result<()> {
    let labels = NativeMenuLabels::default();
    let menu = build_tray_menu(app, &labels)?;

    TrayIconBuilder::with_id("main")
        .icon(Image::from_bytes(include_bytes!("../icons/icon.png"))?)
        .tooltip("My App")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(on_tray_event)
        .build(app)?;

    #[cfg(target_os = "macos")]
    set_app_menu(app, &labels)?;

    Ok(())
}

pub fn update_native_menus(app: &AppHandle, labels: NativeMenuLabels) -> tauri::Result<()> {
    if let Some(tray) = app.tray_by_id("main") {
        let menu = build_tray_menu(app, &labels)?;
        tray.set_menu(Some(menu))?;
    }

    #[cfg(target_os = "macos")]
    set_app_menu(app, &labels)?;

    Ok(())
}

pub fn on_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    match event.id().as_ref() {
        "show" => {
            let _ = show_main_window(app);
        }
        "hide" => {
            if let Some(w) = app.get_webview_window("main") {
                let _ = w.hide();
            }
        }
        "settings" => {
            if show_main_window(app).is_ok() {
                if let Some(w) = app.get_webview_window("main") {
                    let _ = w.emit("navigate", "settings");
                }
            }
        }
        "quit" => {
            app.exit(0);
        }
        _ => {}
    }
}

pub fn show_main_window(app: &AppHandle) -> tauri::Result<()> {
    if let Some(w) = app.get_webview_window("main") {
        w.show()?;
        #[cfg(target_os = "macos")]
        w.unminimize()?;
        w.set_focus()?;
    }

    Ok(())
}

fn build_tray_menu(app: &AppHandle, labels: &NativeMenuLabels) -> tauri::Result<Menu<tauri::Wry>> {
    let show = MenuItem::with_id(app, "show", &labels.tray.show, true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", &labels.tray.quit, true, None::<&str>)?;

    Menu::with_items(app, &[&show, &separator, &quit])
}

#[cfg(target_os = "macos")]
fn set_app_menu(app: &AppHandle, labels: &NativeMenuLabels) -> tauri::Result<()> {
    let menu = build_app_menu(app, &labels.mac)?;
    let _ = app.set_menu(menu)?;
    Ok(())
}

#[cfg(target_os = "macos")]
fn build_app_menu(app: &AppHandle, labels: &MacMenuLabels) -> tauri::Result<Menu<tauri::Wry>> {
    let show_window = MenuItem::with_id(app, "show", &labels.show_window, true, None::<&str>)?;

    let app_menu = Submenu::with_items(
        app,
        &labels.app_menu_title,
        true,
        &[
            &PredefinedMenuItem::about(app, Some(&labels.about), None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::services(app, Some(&labels.services))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, Some(&labels.hide))?,
            &PredefinedMenuItem::hide_others(app, Some(&labels.hide_others))?,
            &PredefinedMenuItem::show_all(app, Some(&labels.show_all))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, Some(&labels.quit))?,
        ],
    )?;

    let edit_menu = Submenu::with_items(
        app,
        &labels.edit_menu_title,
        true,
        &[
            &PredefinedMenuItem::undo(app, Some(&labels.undo))?,
            &PredefinedMenuItem::redo(app, Some(&labels.redo))?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, Some(&labels.cut))?,
            &PredefinedMenuItem::copy(app, Some(&labels.copy))?,
            &PredefinedMenuItem::paste(app, Some(&labels.paste))?,
            &PredefinedMenuItem::select_all(app, Some(&labels.select_all))?,
        ],
    )?;

    let view_menu = Submenu::with_items(
        app,
        &labels.view_menu_title,
        true,
        &[&PredefinedMenuItem::fullscreen(
            app,
            Some(&labels.enter_full_screen),
        )?],
    )?;

    let window_menu = Submenu::with_items(
        app,
        &labels.window_menu_title,
        true,
        &[
            &show_window,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::minimize(app, Some(&labels.minimize))?,
            &PredefinedMenuItem::close_window(app, Some(&labels.close_window))?,
        ],
    )?;

    Menu::with_items(app, &[&app_menu, &edit_menu, &view_menu, &window_menu])
}

fn on_tray_event(tray: &tauri::tray::TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button,
        button_state,
        ..
    } = event
    {
        if button == MouseButton::Left && button_state == MouseButtonState::Down {
            let app = tray.app_handle();
            let _ = show_main_window(&app);
        }
    }
}
