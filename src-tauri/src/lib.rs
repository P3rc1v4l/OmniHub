// OmniHub – Rust-Backend (Tauri v2).

mod tmdb;
mod discord;
mod anilist;
mod favicon;

/// Liest die gespeicherte Einstellung „Hardware-Beschleunigung" aus der Store-Datei
/// (dieselbe Datei, die das Frontend über tauri-plugin-store schreibt) – und zwar
/// BEVOR das Fenster/Webview erzeugt wird. Schlägt das Lesen fehl, bleibt die GPU
/// aktiv (sicherer Standard). Windows: %APPDATA%\<identifier>\omnihub.json.
fn hw_accel_disabled() -> bool {
    let Ok(appdata) = std::env::var("APPDATA") else { return false; };
    let path = std::path::Path::new(&appdata)
        .join("com.p3rc1v4l.omnihub")
        .join("omnihub.json");
    let Ok(text) = std::fs::read_to_string(path) else { return false; };
    let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) else { return false; };
    matches!(
        json.get("settings")
            .and_then(|s| s.get("plugins"))
            .and_then(|p| p.get("hardwareAcceleration"))
            .and_then(|v| v.as_bool()),
        Some(false)
    )
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Hardware-Beschleunigung ggf. abschalten. WebView2 liest dieses Env-Var beim
    // Anlegen seiner Umgebung – es muss daher VOR dem Fenster gesetzt werden.
    if hw_accel_disabled() {
        let prev = std::env::var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS").unwrap_or_default();
        let combined = format!("{} --disable-gpu --disable-gpu-compositing", prev);
        std::env::set_var("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", combined.trim());
    }
    tauri::Builder::default()
        // window-state speichert Position/Größe automatisch und stellt sie beim
        // nächsten Start wieder her. Erststart läuft maximiert (siehe tauri.conf.json).
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(discord::DiscordState::default())
        .invoke_handler(tauri::generate_handler![
            tmdb::tmdb_search,
            tmdb::tmdb_trending,
            tmdb::tmdb_upcoming,
            tmdb::tmdb_list,
            tmdb::tmdb_details,
            discord::discord_connect,
            discord::discord_set_activity,
            discord::discord_clear,
            discord::discord_disconnect,
            anilist::anilist_schedule,
            favicon::fetch_favicon,
        ])
        .run(tauri::generate_context!())
        .expect("Fehler beim Start von OmniHub");
}
