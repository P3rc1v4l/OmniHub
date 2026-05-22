use tauri::{Manager, WindowEvent, Emitter};
use tauri_plugin_store::StoreExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ═══ DATENSTRUKTUREN ═══════════════════════════════════════════════════════

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WindowBounds { pub x: i32, pub y: i32, pub width: u32, pub height: u32 }

#[derive(Debug, Serialize, Deserialize)]
pub struct WatchTimePayload {
    #[serde(rename = "providerId")] pub provider_id: String,
    pub seconds: u64,
    #[serde(rename = "profileId")] pub profile_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct TmdbDetailPayload {
    pub id: u64,
    #[serde(rename = "type")] pub media_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchPayload { pub query: String, pub page: Option<u32> }

#[derive(Debug, Serialize, Deserialize)]
pub struct ProvidersPayload {
    #[serde(rename = "tmdbId")] pub tmdb_id: u64,
    #[serde(rename = "type")] pub media_type: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SecondWindowPayload { pub url: String, pub title: Option<String> }

// ═══ KONSTANTEN ════════════════════════════════════════════════════════════

const TMDB_KEY:  &str = "2dca580c2a14b55200e784d157207b4d";
const TMDB_BASE: &str = "https://api.themoviedb.org/3";
const CHROME_UA: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const DE_ANIME:  &str = "163|283|8|9|337|384";
const STORE:     &str = "omnihub-store.json";

fn ad_domains() -> Vec<&'static str> {
    vec![
        "doubleclick.net","googlesyndication.com","googletagmanager.com","google-analytics.com",
        "adnxs.com","adsrvr.org","advertising.com","scorecardresearch.com","quantserve.com",
        "outbrain.com","taboola.com","pubmatic.com","rubiconproject.com","openx.net","criteo.com",
        "casalemedia.com","moatads.com","adtech.de","spotxchange.com","smartadserver.com",
        "adsafeprotected.com","doubleverify.com","imasdk.googleapis.com",
        "pagead2.googlesyndication.com","adservice.google.com","securepubads.g.doubleclick.net",
        "ads.crunchyroll.com","fundingchoicesmessages.google.com","amazon-adsystem.com",
        "media.net","revcontent.com","mgid.com","bidswitch.net","appnexus.com",
    ]
}

// ═══ HILFSFUNKTIONEN ═══════════════════════════════════════════════════════

fn client() -> reqwest::Client {
    reqwest::Client::builder().user_agent(CHROME_UA)
        .danger_accept_invalid_certs(true).build().unwrap_or_default()
}

async fn tmdb(path: &str, extra: &str) -> Result<serde_json::Value, String> {
    let url = format!("{path}?api_key={}&language=de-DE{extra}", TMDB_KEY);
    let full = format!("{TMDB_BASE}{url}");
    client().get(&full).send().await.map_err(|e| e.to_string())?
        .json().await.map_err(|e| e.to_string())
}

fn filter(v: Result<serde_json::Value, String>, n: usize) -> Vec<serde_json::Value> {
    v.ok().and_then(|v| v.get("results").and_then(|r| r.as_array()).cloned())
     .unwrap_or_default().into_iter()
     .filter(|i| i.get("poster_path").and_then(|p| p.as_str()).is_some())
     .take(n).collect()
}

fn is_ad(url_str: &str, extra: &[String]) -> bool {
    let Ok(u) = url::Url::parse(url_str) else { return false };
    let Some(host) = u.host_str() else { return false };
    for d in ad_domains().iter().chain(extra.iter().map(|s| s.as_str()).collect::<Vec<_>>().iter()) {
        if host == *d || host.ends_with(&format!(".{d}")) { return true; }
    }
    false
}

fn today() -> String { epoch_to_date(now_days()) }
fn future_months(m: u32) -> String { epoch_to_date(now_days() + m as u64 * 30) }
fn days_ago(n: u64) -> String { epoch_to_date(now_days().saturating_sub(n)) }

fn now_days() -> u64 {
    std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default().as_secs() / 86400
}

fn epoch_to_date(days: u64) -> String {
    let z = days as i64 + 719468;
    let era = if z >= 0 { z } else { z - 146096 } / 146097;
    let doe = z - era * 146097;
    let yoe = (doe - doe/1460 + doe/36524 - doe/146096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365*yoe + yoe/4 - yoe/100);
    let mp = (5*doy + 2) / 153;
    let d = doy - (153*mp + 2)/5 + 1;
    let m = if mp < 10 { mp + 3 } else { mp - 9 };
    let y = if m <= 2 { y+1 } else { y };
    format!("{y:04}-{m:02}-{d:02}")
}

fn day_of_week() -> usize {
    ((now_days() + 4) % 7) as usize
}

fn win(app: &tauri::AppHandle) -> Option<tauri::WebviewWindow> {
    app.get_webview_window("main")
}

fn store(app: &tauri::AppHandle) -> tauri_plugin_store::Store<tauri::Wry> {
    app.store(STORE).unwrap()
}

// ═══ WINDOW COMMANDS ═══════════════════════════════════════════════════════

#[tauri::command] async fn window_minimize(app: tauri::AppHandle) {
    if let Some(w) = win(&app) { let _ = w.minimize(); }
}
#[tauri::command] async fn window_maximize(app: tauri::AppHandle) {
    if let Some(w) = win(&app) {
        if w.is_maximized().unwrap_or(false) { let _ = w.unmaximize(); }
        else { let _ = w.maximize(); }
    }
}
#[tauri::command] async fn window_close(app: tauri::AppHandle) {
    if let Some(w) = win(&app) { let _ = w.close(); }
}
#[tauri::command] async fn window_set_fullscreen(app: tauri::AppHandle, fullscreen: bool) {
    if let Some(w) = win(&app) { let _ = w.set_fullscreen(fullscreen); }
}
#[tauri::command] async fn window_is_fullscreen(app: tauri::AppHandle) -> bool {
    win(&app).and_then(|w| w.is_fullscreen().ok()).unwrap_or(false)
}
#[tauri::command] async fn window_start_dragging(app: tauri::AppHandle) -> Result<(), String> {
    win(&app).ok_or("no window".to_string())?.start_dragging().map_err(|e| e.to_string())
}

// ═══ STORE / EINSTELLUNGEN ═════════════════════════════════════════════════

#[tauri::command] async fn get_settings(app: tauri::AppHandle) -> serde_json::Value {
    store(&app).get("settings").unwrap_or(serde_json::json!({}))
}
#[tauri::command] async fn set_settings(app: tauri::AppHandle, value: serde_json::Value) {
    let s = store(&app); let _ = s.set("settings", value); let _ = s.save();
}
#[tauri::command] async fn get_theme(app: tauri::AppHandle) -> String {
    store(&app).get("theme").and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "dark".to_string())
}
#[tauri::command] async fn set_theme(app: tauri::AppHandle, value: String) {
    let s = store(&app); let _ = s.set("theme", serde_json::Value::String(value)); let _ = s.save();
}
#[tauri::command] async fn get_profiles(app: tauri::AppHandle) -> serde_json::Value {
    store(&app).get("profiles").unwrap_or_else(|| serde_json::json!([{
        "id":"default","name":"Standardkonto","favorites":[],"watchlist":[],
        "searchHistory":[],"viewHistory":[]
    }]))
}
#[tauri::command] async fn set_profiles(app: tauri::AppHandle, value: serde_json::Value) {
    let s = store(&app); let _ = s.set("profiles", value); let _ = s.save();
}
#[tauri::command] async fn get_active_profile(app: tauri::AppHandle) -> String {
    store(&app).get("activeProfile").and_then(|v| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "default".to_string())
}
#[tauri::command] async fn set_active_profile(app: tauri::AppHandle, id: String) {
    let s = store(&app); let _ = s.set("activeProfile", serde_json::Value::String(id)); let _ = s.save();
}

// ═══ SESSIONS ══════════════════════════════════════════════════════════════

#[tauri::command] async fn get_all_sessions(app: tauri::AppHandle, profile_id: Option<String>) -> serde_json::Value {
    let pid = profile_id.unwrap_or_else(|| "default".to_string());
    store(&app).get(&format!("sessions_{pid}")).unwrap_or_else(|| serde_json::json!({}))
}
#[tauri::command] async fn set_session_state(app: tauri::AppHandle, profile_id: Option<String>, provider_id: String, logged_in: bool) {
    let pid = profile_id.unwrap_or_else(|| "default".to_string());
    let s = store(&app);
    let key = format!("sessions_{pid}");
    let mut sessions: HashMap<String,bool> = s.get(&key)
        .and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
    sessions.insert(provider_id, logged_in);
    let _ = s.set(&key, serde_json::to_value(&sessions).unwrap_or_default());
    let _ = s.save();
}
#[tauri::command] async fn clear_all_sessions(app: tauri::AppHandle, profile_id: Option<String>) {
    let pid = profile_id.unwrap_or_else(|| "default".to_string());
    let s = store(&app);
    let _ = s.set(&format!("sessions_{pid}"), serde_json::json!({}));
    let _ = s.save();
}

// ═══ WATCH STATS ═══════════════════════════════════════════════════════════

#[tauri::command] async fn record_watch_time(app: tauri::AppHandle, payload: WatchTimePayload) {
    let s = store(&app);
    let pid = payload.profile_id.unwrap_or_else(|| "default".to_string());
    let key = format!("streamStats_{pid}");
    let mut stats: HashMap<String,serde_json::Value> = s.get(&key)
        .and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
    let entry = stats.entry(payload.provider_id).or_insert_with(|| {
        serde_json::json!({"total":0u64,"byDay":[0u64,0,0,0,0,0,0]})
    });
    if let Some(obj) = entry.as_object_mut() {
        let t = obj.entry("total").or_insert(serde_json::json!(0));
        *t = serde_json::json!(t.as_u64().unwrap_or(0) + payload.seconds);
        let day = day_of_week();
        if let Some(arr) = obj.get_mut("byDay").and_then(|v| v.as_array_mut()) {
            if let Some(slot) = arr.get_mut(day) {
                *slot = serde_json::json!(slot.as_u64().unwrap_or(0) + payload.seconds);
            }
        }
    }
    let _ = s.set(&key, serde_json::to_value(&stats).unwrap_or_default());
    let _ = s.save();
}
#[tauri::command] async fn get_stream_stats(app: tauri::AppHandle, profile_id: Option<String>) -> serde_json::Value {
    let pid = profile_id.unwrap_or_else(|| "default".to_string());
    store(&app).get(&format!("streamStats_{pid}")).unwrap_or_else(|| serde_json::json!({}))
}

// ═══ TMDB ══════════════════════════════════════════════════════════════════

#[tauri::command] async fn get_trending() -> serde_json::Value {
    let t = today(); let ago = days_ago(90);
    let anime_q = format!("&with_genres=16&sort_by=popularity.desc&with_watch_providers={DE_ANIME}&watch_region=DE&first_air_date.gte={ago}&first_air_date.lte={t}");
    let (m, s, a) = tokio::join!(
        tmdb("/trending/movie/week","&region=DE"),
        tmdb("/trending/tv/week","&without_genres=16"),
        tmdb("/discover/tv",&anime_q),
    );
    serde_json::json!({"movies":filter(m,25),"shows":filter(s,25),"anime":filter(a,25)})
}

#[tauri::command] async fn get_new_releases() -> serde_json::Value {
    let t = today();
    let anime_q = format!("&with_genres=16&sort_by=first_air_date.desc&first_air_date.lte={t}&with_watch_providers={DE_ANIME}&watch_region=DE");
    let (m, s, a) = tokio::join!(
        tmdb("/movie/now_playing","&region=DE"),
        tmdb("/tv/on_the_air","&watch_region=DE&without_genres=16"),
        tmdb("/discover/tv",&anime_q),
    );
    serde_json::json!({"movies":filter(m,25),"shows":filter(s,25),"anime":filter(a,25)})
}

#[tauri::command] async fn get_upcoming(months: Option<u32>) -> serde_json::Value {
    let t = today(); let f = future_months(months.unwrap_or(1));
    let mq = format!("&region=DE&with_release_type=3|2&release_date.gte={t}&release_date.lte={f}&sort_by=release_date.asc");
    let sq = format!("&watch_region=DE&first_air_date.gte={t}&first_air_date.lte={f}&sort_by=first_air_date.asc&without_genres=16");
    let a1q = format!("&with_genres=16&first_air_date.gte={t}&first_air_date.lte={f}&sort_by=first_air_date.asc");
    let a2q = format!("&with_genres=16&first_air_date.gte={t}&first_air_date.lte={f}&sort_by=popularity.desc&page=2");
    let (m, s, a1, a2) = tokio::join!(
        tmdb("/discover/movie",&mq), tmdb("/discover/tv",&sq),
        tmdb("/discover/tv",&a1q), tmdb("/discover/tv",&a2q),
    );
    let mut anime: Vec<serde_json::Value> = Vec::new();
    for src in [a1, a2] {
        if let Ok(v) = src {
            if let Some(arr) = v.get("results").and_then(|r| r.as_array()) {
                for item in arr {
                    if item.get("poster_path").and_then(|p| p.as_str()).is_some() {
                        let id = item.get("id").and_then(|i| i.as_u64()).unwrap_or(0);
                        if !anime.iter().any(|x| x.get("id").and_then(|i| i.as_u64()) == Some(id)) {
                            anime.push(item.clone());
                        }
                    }
                }
            }
        }
    }
    anime.truncate(30);
    serde_json::json!({"movies":filter(m,30),"shows":filter(s,30),"anime":anime})
}

#[tauri::command] async fn get_tmdb_detail(payload: TmdbDetailPayload) -> serde_json::Value {
    let p1 = format!("/{}/{}", payload.media_type, payload.id);
    let p2 = format!("/{}/{}/videos", payload.media_type, payload.id);
    let p3 = format!("/{}/{}/watch/providers", payload.media_type, payload.id);
    let (det, vid, prov) = tokio::join!(
        tmdb(&p1,"&append_to_response=credits"),
        tmdb(&p2,""), tmdb(&p3,""),
    );
    let videos = vid.ok().and_then(|v| v.get("results").cloned()).unwrap_or(serde_json::json!([]));
    let providers = prov.ok().and_then(|v| v.get("results").and_then(|r| r.get("DE")).cloned());
    serde_json::json!({"detail":det.ok().unwrap_or(serde_json::json!({})),"videos":videos,"providers":providers})
}

#[tauri::command] async fn search_tmdb(payload: SearchPayload) -> serde_json::Value {
    let page = payload.page.unwrap_or(1);
    let q = format!("&query={}&page={page}&region=DE", urlencoding::encode(&payload.query));
    tmdb("/search/multi",&q).await.unwrap_or_else(|e| serde_json::json!({"error":e}))
}

#[tauri::command] async fn get_streaming_providers(payload: ProvidersPayload) -> serde_json::Value {
    let p = format!("/{}/{}/watch/providers", payload.media_type, payload.tmdb_id);
    tmdb(&p,"").await.ok().and_then(|v| v.get("results").and_then(|r| r.get("DE")).cloned())
        .unwrap_or(serde_json::Value::Null)
}

#[tauri::command] async fn find_by_imdb(imdb_id: String) -> serde_json::Value {
    let p = format!("/find/{imdb_id}");
    tmdb(&p,"&external_source=imdb_id").await
        .unwrap_or_else(|e| serde_json::json!({"error":e}))
}

// ═══ NETZWERK / VPN ════════════════════════════════════════════════════════

#[tauri::command] async fn check_online() -> bool {
    client().head("https://www.google.com").send().await.is_ok()
}
#[tauri::command] async fn check_url(url: String) -> serde_json::Value {
    match client().head(&url).send().await {
        Ok(r)  => serde_json::json!({"ok":true,"status":r.status().as_u16()}),
        Err(e) => serde_json::json!({"ok":false,"error":e.to_string()}),
    }
}
#[tauri::command] async fn check_vpn() -> serde_json::Value {
    match client().get("https://ipapi.co/json/").send().await {
        Err(e) => serde_json::json!({"error":e.to_string()}),
        Ok(r)  => match r.json::<serde_json::Value>().await {
            Err(e) => serde_json::json!({"error":e.to_string()}),
            Ok(d) => {
                let org = d.get("org").and_then(|v| v.as_str()).unwrap_or("").to_lowercase();
                serde_json::json!({"ip":d.get("ip"),"country":d.get("country_name"),
                    "city":d.get("city"),"org":d.get("org"),
                    "isVpn":org.contains("vpn")||org.contains("proxy")})
            }
        }
    }
}

// ═══ AD-BLOCK ══════════════════════════════════════════════════════════════

#[tauri::command] async fn fetch_adblock_list(url: String) -> serde_json::Value {
    match client().get(&url).send().await {
        Err(e) => serde_json::json!({"ok":false,"error":e.to_string()}),
        Ok(r)  => match r.text().await {
            Err(e) => serde_json::json!({"ok":false,"error":e.to_string()}),
            Ok(text) => {
                let mut domains: Vec<String> = Vec::new();
                for line in text.lines() {
                    let line = line.trim();
                    if line.is_empty() || line.starts_with('!') || line.starts_with('#') { continue; }
                    if let Some(c) = line.strip_prefix("||") {
                        if let Some(d) = c.split('^').next() { if !d.is_empty() { domains.push(d.to_string()); } }
                        continue;
                    }
                    let p: Vec<&str> = line.splitn(2,' ').collect();
                    if p.len()==2 && (p[0]=="0.0.0.0"||p[0]=="127.0.0.1") && p[1]!="localhost" {
                        domains.push(p[1].trim().to_string());
                    }
                }
                domains.dedup(); let n = domains.len(); domains.truncate(15000);
                serde_json::json!({"ok":true,"count":n,"domains":domains})
            }
        }
    }
}
#[tauri::command] async fn apply_extra_ad_domains(app: tauri::AppHandle, domains: Vec<String>) {
    let s = store(&app); let _ = s.set("extraAdDomains", serde_json::to_value(&domains).unwrap_or_default()); let _ = s.save();
}
#[tauri::command] async fn get_extra_ad_domains(app: tauri::AppHandle) -> Vec<String> {
    store(&app).get("extraAdDomains").and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default()
}
#[tauri::command] async fn check_is_ad(app: tauri::AppHandle, url: String) -> bool {
    let extra: Vec<String> = store(&app).get("extraAdDomains").and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default();
    is_ad(&url, &extra)
}

// ═══ BENACHRICHTIGUNGEN ════════════════════════════════════════════════════

#[tauri::command] async fn show_notification(app: tauri::AppHandle, title: String, body: String) {
    use tauri_plugin_notification::NotificationExt;
    let _ = app.notification().builder().title(&title).body(&body).show();
}

// ═══ DATEIPICKER ═══════════════════════════════════════════════════════════

#[tauri::command] async fn pick_image(app: tauri::AppHandle, dest: String) -> Option<String> {
    use tauri_plugin_dialog::DialogExt;
    let fp = app.dialog().file().add_filter("Bilder",&["jpg","jpeg","png","gif","webp"]).blocking_pick_file()?;
    let src = fp.as_path()?;
    let dir = app.path().app_data_dir().ok()?.join("userImages");
    std::fs::create_dir_all(&dir).ok()?;
    let ext = src.extension().and_then(|e| e.to_str()).unwrap_or("png");
    let ts = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_millis();
    let dst = dir.join(format!("{dest}_{ts}.{ext}"));
    std::fs::copy(src, &dst).ok()?;
    Some(format!("file://{}",dst.to_string_lossy().replace('\\','/')))
}

// ═══ EXTERNES ÖFFNEN ═══════════════════════════════════════════════════════

#[tauri::command] async fn open_external(app: tauri::AppHandle, url: String) {
    use tauri_plugin_opener::OpenerExt;
    let _ = app.opener().open_url(&url, None::<&str>);
}

// ═══ ZWEITES FENSTER ═══════════════════════════════════════════════════════

#[tauri::command] async fn open_second_window(app: tauri::AppHandle, payload: SecondWindowPayload) -> String {
    let label = "second";
    if let Some(w) = app.get_webview_window(label) { let _ = w.set_focus(); return "focused".to_string(); }
    let url = payload.url.parse().unwrap_or_else(|_| "about:blank".parse().unwrap());
    match tauri::WebviewWindowBuilder::new(&app, label, tauri::WebviewUrl::External(url))
        .title(payload.title.as_deref().unwrap_or("OmniHub – Zweiter Stream"))
        .inner_size(800.0,600.0).min_inner_size(400.0,300.0).build()
    {
        Ok(_)  => "opened".to_string(),
        Err(e) => format!("error:{e}"),
    }
}

// ═══ UPDATER ═══════════════════════════════════════════════════════════════

#[tauri::command] async fn check_for_updates(app: tauri::AppHandle) -> serde_json::Value {
    use tauri_plugin_updater::UpdaterExt;
    match app.updater() {
        Ok(u) => match u.check().await {
            Ok(Some(up)) => serde_json::json!({"available":true,"version":up.version}),
            Ok(None)     => serde_json::json!({"available":false}),
            Err(e)       => serde_json::json!({"available":false,"message":e.to_string()}),
        },
        Err(e) => serde_json::json!({"available":false,"message":e.to_string()}),
    }
}
#[tauri::command] async fn install_update(app: tauri::AppHandle) -> Result<(),String> {
    use tauri_plugin_updater::UpdaterExt;
    let u = app.updater().map_err(|e| e.to_string())?;
    if let Some(up) = u.check().await.map_err(|e| e.to_string())? {
        up.download_and_install(|_,_|{}, ||{}).await.map_err(|e| e.to_string())?;
    }
    Ok(())
}

// ═══ APP SETUP & RUN ═══════════════════════════════════════════════════════

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            // Splash → nach 2.6s Hauptfenster zeigen
            let wc = window.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(2600));
                let _ = wc.emit("splash-done", ());
                let _ = wc.show();
            });

            // Update-Check nach 5s
            let ah = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                use tauri_plugin_updater::UpdaterExt;
                if let Ok(u) = ah.updater() {
                    if let Ok(Some(up)) = u.check().await {
                        let _ = ah.emit("update-available", serde_json::json!({"version":up.version}));
                    }
                }
            });

            // Fensterposition beim Schließen speichern
            let ah2 = app.handle().clone();
            window.on_window_event(move |event| {
                if let WindowEvent::CloseRequested { .. } = event {
                    if let Some(w) = ah2.get_webview_window("main") {
                        if let (Ok(pos), Ok(size)) = (w.outer_position(), w.outer_size()) {
                            let bounds = WindowBounds { x:pos.x, y:pos.y, width:size.width, height:size.height };
                            if let Ok(s) = ah2.store(STORE) {
                                let _ = s.set("windowBounds", serde_json::to_value(&bounds).unwrap_or_default());
                                let _ = s.save();
                            }
                        }
                    }
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            window_minimize, window_maximize, window_close,
            window_set_fullscreen, window_is_fullscreen, window_start_dragging,
            get_settings, set_settings, get_theme, set_theme,
            get_profiles, set_profiles, get_active_profile, set_active_profile,
            get_all_sessions, set_session_state, clear_all_sessions,
            record_watch_time, get_stream_stats,
            get_trending, get_new_releases, get_upcoming,
            get_tmdb_detail, search_tmdb, get_streaming_providers, find_by_imdb,
            check_online, check_url, check_vpn,
            fetch_adblock_list, apply_extra_ad_domains, get_extra_ad_domains, check_is_ad,
            show_notification, pick_image, open_external,
            open_second_window, check_for_updates, install_update,
        ])
        .run(tauri::generate_context!())
        .expect("OmniHub Fehler")
}
