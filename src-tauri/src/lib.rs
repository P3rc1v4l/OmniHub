// OmniHub – Rust-Backend (Tauri v2).

mod tmdb;
mod discord;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
        .manage(discord::DiscordState::default())
        .invoke_handler(tauri::generate_handler![
            tmdb::tmdb_search,
            tmdb::tmdb_trending,
            tmdb::tmdb_upcoming,
            tmdb::tmdb_details,
            discord::discord_connect,
            discord::discord_set_activity,
            discord::discord_clear,
            discord::discord_disconnect,
        ])
        .run(tauri::generate_context!())
        .expect("Fehler beim Start von OmniHub");
}
