# OmniHub – Changelog

## v0.3.1 – 2026-05-28

### Bugfix: tauri.conf.json – NSIS-Config-Fehler
- **Ursache**: In Tauri v2 gehört `nsis` unter `bundle.windows.nsis`, nicht direkt unter `bundle`
- **Fehlermeldung**: `Additional properties are not allowed ('nsis' was unexpected)`
- **Fix**: `nsis`-Block von `bundle.nsis` → `bundle.windows.nsis` verschoben
- **Bonus**: `certificateThumbprint: null` entfernt (kann Schema-Fehler auslösen)

---

## v0.3.0 – 2026-05-28

### Bugfix: GitHub Actions Build-Fehler
- **Ursache**: `cache: npm` in `setup-node` erwartet `package-lock.json`, welches nicht im Repo war
- **Fix**: `cache: npm` entfernt, `npm install` statt `npm ci` → kein Lock-File mehr nötig

### Neue Features
- **Splash Screen** (`src/splash.html`): Zeigt animierten Ladebildschirm beim App-Start, wechselt nach `init()` zu `index.html`
- **`splash_done` Command** (Rust): Navigiert das Fenster nach erfolgreichem Init von Splash → Haupt-App
- **Session-Isolation** (Rust): Neue Commands `get_partition_name`, `set_session_active`, `get_active_sessions`, `clear_provider_session`, `clear_all_sessions` – Session-State wird persistent im Store gespeichert
- **Session-Tracking** (Frontend): `openProvider()` markiert Provider als aktiv, `stopStream()` als inaktiv; Session-Dots werden alle 30s aktualisiert
- **`sessions.rs`** – neues Rust-Modul für vollständige Session-Verwaltung

### Verbesserungen
- **CSP gehärtet**: `unsafe-eval` entfernt → `script-src 'self' 'unsafe-inline'` only; `object-src 'none'` ergänzt; font/style Sources explizit auf `fonts.googleapis.com`
- **bundle.js aufgeteilt**: Einzelne Quell-Dateien statt einer 5000-Zeilen-Datei:
  - `core/i18n.js`, `core/providers.js`, `core/achievements.js`
  - `ui/notifications.js`, `ui/search.js`
  - `features/widevine.js`, `features/feedback.js`
  - `app.js`, `fixes.js`, `patches.js`
- **bundle.js gelöscht** – nicht mehr benötigt
- **`main.js`** – neuer Einstiegspunkt, lädt Module in korrekter Reihenfolge

### Geänderte Dateien
| Datei | Was geändert |
|---|---|
| `.github/workflows/build.yml` | `cache: npm` entfernt, `npm install` statt `npm ci` |
| `src-tauri/tauri.conf.json` | Version 0.3.0, CSP gehärtet, Fenster startet mit `splash.html` |
| `src-tauri/Cargo.toml` | Version 0.3.0, `url` crate ergänzt |
| `src-tauri/src/lib.rs` | Session-Commands registriert |
| `src-tauri/src/commands/mod.rs` | `splash` + `sessions` Module |
| `src-tauri/src/commands/splash.rs` | **NEU** – `splash_done` Command |
| `src-tauri/src/commands/sessions.rs` | **NEU** – Session-Isolation Commands |
| `src/splash.html` | **NEU** – Animierter Ladebildschirm |
| `src/index.html` | `splash_done()` nach init(), Einzelmodule statt bundle.js |
| `src/js/tauri-bridge.js` | Session-Commands, `splashDone()` |
| `src/js/bundle.js` | **GELÖSCHT** – durch Einzelmodule ersetzt |
| `src/js/main.js` | **NEU** – Modul-Einstiegspunkt |
| `src/js/core/i18n.js` | **NEU** – aus bundle.js extrahiert |
| `src/js/core/providers.js` | **NEU** – aus bundle.js extrahiert |
| `src/js/core/achievements.js` | **NEU** – aus bundle.js extrahiert |
| `src/js/ui/notifications.js` | **NEU** – aus bundle.js extrahiert |
| `src/js/ui/search.js` | **NEU** – aus bundle.js extrahiert |
| `src/js/features/widevine.js` | **NEU** – aus bundle.js extrahiert |
| `src/js/features/feedback.js` | **NEU** – aus bundle.js extrahiert |
| `src/js/app.js` | **NEU** – aus bundle.js extrahiert (Haupt-App-Logik) |
| `src/js/fixes.js` | **NEU** – aus bundle.js extrahiert |
| `src/js/patches.js` | v0.3.0 Session + Splash Patches ergänzt |

---

## v0.2.0 – 2026-05-28

### Neue Features
- **Discord-Integration**: Discord-Server Beitrittslink direkt in Einstellungen → Mehr (`https://discord.gg/tnfgta33uj`)
- **Feedback-System**: In-App Feedback per GitHub Issue, Discord-Button im Feedback-Modal
- **`get_tmdb_detail`**: Neuer Rust-Command – lädt Titel-Details, Videos + Streaming-Anbieter in einem einzigen API-Call
- **`get_new_releases`**: Neuer Rust-Command – "Neue Veröffentlichungen" für Neuigkeiten-Tab (Filme, Serien, Anime)
- **`record_watch_time`**: Neuer Rust-Command – Streamzeit wird mit Wochentag-Aufschlüsselung persistent gespeichert
- **`get_watchlist_releases`**: Neuer Rust-Command – prüft ob Watchlist-Titel heute veröffentlicht wurden
- **Echter Datei-Dialog**: `pick_image` nutzt jetzt `tauri-plugin-dialog` (nicht mehr Placeholder)
- **VPN-Check**: Einstellungen → Mehr → VPN-Prüfung via ipapi.co

### Bugfixes
- **`ACH_CATS` undefiniert**: Variable war nicht definiert → Achievement-Sektion in Statistiken war kaputt (behoben)
- **`achName()` undefiniert**: Funktion fehlte → Achievements zeigten keinen Namen (behoben)
- **`tot(stats)` unbekannt**: Aufruf in `buildStatsView` schlug fehl → kein Gesamt-Statistik-Block (behoben, Alias auf `_tot()`)
- **`checkAchievements(true)`**: Falscher Parameter-Typ → wird jetzt korrekt als `null` übergeben
- **Titelbar**: Zeigte "OMNISIGHT" statt "OMNIHUB" (behoben)
- **Version-Chip**: Zeigte statisch "v0.1.0" – zeigt jetzt echte App-Version
- **OmniSight-Referenzen**: Alle Console-Logs, Toast-Nachrichten und URL-Strings auf OmniHub umgestellt
- **Discord-URL**: Alter Link `discord.gg/D6BnznYztF` → korrekter Link `discord.gg/tnfgta33uj`
- **GitHub Issue-URL**: Feedback-Links zeigen jetzt auf `P3rc1v4l/OmniHub`
- **Watchlist-Export**: Dateiname war `omnisight-watchlist-...` → jetzt `omnihub-watchlist-...`
- **`startWatchTimer`**: Nutzt jetzt `recordWatchTime` Rust-Command statt fehlenden Electron-Stub
- **Tauri Window-Controls**: `minimize`, `maximize`, `close` nutzen jetzt korrekte Tauri v2 API
- **`setFullscreen` / `isFullscreen`**: Implementiert via `@tauri-apps/api/window`
- **`showNotification`**: Implementiert via `tauri-plugin-notification`
- **Onboarding Provider-Grid**: War leer – wird jetzt korrekt befüllt

### Verbesserungen
- **Tauri Bridge**: Vollständig überarbeitet – alle `electronAPI`-Methoden sind jetzt korrekt implementiert oder als saubere Stubs vorhanden
- **Auto-Updater**: Nutzt offiziell `tauri-apps/tauri-action` in GitHub Actions
- **Build-Workflow**: Verbessert mit `npm ci`, Rust-Cache, strukturierten Release-Notes
- **`record_watch_time`**: Speichert jetzt auch Wochentag-Index und Session-Count
- **Fehlerbehandlung**: Alle API-Calls haben `try/catch` mit stillen Fehlern
- **System-Theme**: Polling läuft jetzt sauber im Background-Thread

### Geänderte Dateien
| Datei | Was geändert |
|---|---|
| `package.json` | Version 0.1.0 → 0.2.0, dialog-Plugin hinzugefügt |
| `src-tauri/tauri.conf.json` | Version 0.2.0 |
| `src-tauri/Cargo.toml` | Version 0.2.0, `tauri-plugin-dialog` hinzugefügt |
| `src-tauri/src/lib.rs` | Neue Commands registriert, dialog-Plugin initialisiert |
| `src-tauri/src/commands/tmdb.rs` | `get_tmdb_detail`, `get_new_releases`, `get_watchlist_releases` neu |
| `src-tauri/src/commands/streaming.rs` | `record_watch_time` neu mit Wochentag-Tracking |
| `src-tauri/src/commands/system.rs` | `pick_image` mit echtem Dialog-Plugin |
| `src/js/tauri-bridge.js` | Komplett überarbeitet – alle fehlenden Methoden |
| `src/js/bundle.js` | OmniHub-Umbenennung, kritische Bug-Fixes, Patches |
| `src/index.html` | Titelbar-Fix, Discord-Karte in Settings |
| `.github/workflows/build.yml` | tauri-action, strukturierte Release-Notes |
| `CHANGELOG.md` | Neu erstellt |

---

## v0.1.0 – 2026-05-26

- Initiale Grundstruktur auf Tauri v2 Basis
- WideVine via Edge WebView (eingebaut, kein manueller Setup)
- Streaming-Anbieter-Grid mit 25+ Anbietern
- TMDB-Suche (Filme, Serien, Anime)
- Watchlist, Statistiken, Achievements
- Multi-Profil mit PIN-Schutz
- Partikel-Hintergrund, Dark/Light Theme
- Onboarding-Flow
- GitHub Actions Build-Pipeline
