// OmniHub – Discord Rich Presence ("Schaut gerade …").
// Nutzt die lokale Discord-IPC. Erfordert die laufende Discord-Desktop-App
// und eine Discord-Application-ID (Client-ID) aus dem Discord Developer Portal.

use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;

pub struct DiscordState(pub Mutex<Option<DiscordIpcClient>>);

impl Default for DiscordState {
    fn default() -> Self {
        DiscordState(Mutex::new(None))
    }
}

#[tauri::command]
pub fn discord_connect(client_id: String, state: State<DiscordState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    // Bestehende Verbindung sauber schließen.
    if let Some(old) = guard.as_mut() {
        let _ = old.close();
    }
    let mut client = DiscordIpcClient::new(&client_id);
    client.connect().map_err(|e| e.to_string())?;
    *guard = Some(client);
    Ok(())
}

#[tauri::command]
pub fn discord_set_activity(
    details: String,
    state_text: String,
    large_image: Option<String>,
    large_text: Option<String>,
    state: State<DiscordState>,
) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    let client = match guard.as_mut() {
        Some(c) => c,
        None => return Err("Discord ist nicht verbunden".into()),
    };

    let start = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let mut act =
        activity::Activity::new().timestamps(activity::Timestamps::new().start(start));
    if !details.is_empty() {
        act = act.details(&details);
    }
    if !state_text.is_empty() {
        act = act.state(&state_text);
    }
    if let Some(img) = large_image.as_deref() {
        let mut assets = activity::Assets::new().large_image(img);
        if let Some(t) = large_text.as_deref() {
            assets = assets.large_text(t);
        }
        act = act.assets(assets);
    }

    client.set_activity(act).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn discord_clear(state: State<DiscordState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(client) = guard.as_mut() {
        client.clear_activity().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn discord_disconnect(state: State<DiscordState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|e| e.to_string())?;
    if let Some(mut client) = guard.take() {
        client.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
