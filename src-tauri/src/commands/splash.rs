// ═══ v0.3.0 – Splash Screen Command ═══
// Wird vom Frontend aufgerufen wenn init() abgeschlossen ist.
// Navigiert dann vom Splash zur echten App.

use tauri::Manager;

/// Wird vom Frontend nach erfolgreichem init() aufgerufen.
/// Wechselt die angezeigte URL von splash.html → index.html.
#[tauri::command]
pub async fn splash_done(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        // Smooth Transition: kurze Pause für die Ladebalken-Animation
        tokio::time::sleep(std::time::Duration::from_millis(400)).await;

        // Zur Haupt-App navigieren
        window
            .navigate("index.html".parse().map_err(|e: url::ParseError| e.to_string())?)
            .map_err(|e| e.to_string())?;

        // Fenster sicherstellen dass es sichtbar ist
        let _ = window.show();
        let _ = window.set_focus();
    }
    Ok(())
}
