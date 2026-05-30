// OmniHub – Anime-Ausstrahlungsplan über die offene AniList-GraphQL-API.
// Kein API-Schlüssel nötig. Wird für den Crunchyroll-Kalender genutzt
// (Crunchyroll selbst hat keine offene API). externalLinks markiert,
// welche Titel auf Crunchyroll laufen.

use serde_json::{json, Value};

const ANILIST_URL: &str = "https://graphql.anilist.co";

#[tauri::command]
pub async fn anilist_schedule(start: i64, end: i64, page: i64) -> Result<Value, String> {
    let query = "query ($start: Int, $end: Int, $page: Int) { \
        Page(page: $page, perPage: 50) { \
            pageInfo { hasNextPage } \
            airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) { \
                episode airingAt \
                media { \
                    id format \
                    title { romaji english } \
                    coverImage { medium } \
                    siteUrl \
                    externalLinks { site url } \
                } \
            } \
        } \
    }";

    let body = json!({
        "query": query,
        "variables": { "start": start, "end": end, "page": page }
    });

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;

    let resp = client
        .post(ANILIST_URL)
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let v: Value = resp.json().await.map_err(|e| e.to_string())?;
    Ok(v)
}
