// ═══ v0.3.0 – Session-Isolation Commands ═══
// Verwaltet Webview-Partitionen pro Profil.
// In Tauri v2 werden Sessions über Webview-Partitionen isoliert.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use tauri_plugin_store::StoreExt;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SessionInfo {
    pub profile_id: String,
    pub provider_id: String,
    pub partition:   String,
    pub is_active:   bool,
}

/// Gibt den Partition-Namen für Profil + Anbieter zurück.
/// Format: persist:profileId_providerId
#[tauri::command]
pub fn get_partition_name(profile_id: String, provider_id: String) -> String {
    format!("persist:{}_{}", profile_id, provider_id)
}

/// Speichert bekannte aktive Sessions im Store
#[tauri::command]
pub async fn set_session_active(
    app: tauri::AppHandle,
    profile_id: String,
    provider_id: String,
    active: bool,
) -> Result<(), String> {
    let store = app.store("omnihub.json").map_err(|e| e.to_string())?;
    let key = format!("session_{}_{}", profile_id, provider_id);
    store.set(key, Value::Bool(active));
    store.save().map_err(|e| e.to_string())
}

/// Gibt zurück welche Anbieter eingeloggt sind (aus gespeichertem State)
#[tauri::command]
pub async fn get_active_sessions(
    app: tauri::AppHandle,
    profile_id: String,
) -> Result<Value, String> {
    let store = app.store("omnihub.json").map_err(|e| e.to_string())?;
    let prefix = format!("session_{}_", profile_id);
    
    let mut sessions = serde_json::Map::new();
    for key in store.keys() {
        if key.starts_with(&prefix) {
            let provider = key[prefix.len()..].to_string();
            if let Some(val) = store.get(&key) {
                sessions.insert(provider, val);
            }
        }
    }
    Ok(Value::Object(sessions))
}

/// Löscht den Session-State für einen Anbieter
#[tauri::command]
pub async fn clear_provider_session(
    app: tauri::AppHandle,
    profile_id: String,
    provider_id: String,
) -> Result<(), String> {
    let store = app.store("omnihub.json").map_err(|e| e.to_string())?;
    let key = format!("session_{}_{}", profile_id, provider_id);
    store.delete(key);
    store.save().map_err(|e| e.to_string())
}

/// Löscht alle Session-States für ein Profil
#[tauri::command]
pub async fn clear_all_sessions(
    app: tauri::AppHandle,
    profile_id: String,
) -> Result<(), String> {
    let store = app.store("omnihub.json").map_err(|e| e.to_string())?;
    let prefix = format!("session_{}_", profile_id);
    let keys_to_delete: Vec<String> = store.keys()
        .into_iter()
        .filter(|k| k.starts_with(&prefix))
        .collect();
    for key in keys_to_delete {
        store.delete(key);
    }
    store.save().map_err(|e| e.to_string())
}
