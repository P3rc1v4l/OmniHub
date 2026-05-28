# OmniHub – Changelog

## v0.3.5 – 2026-05-28

### 🔴 HAUPTFEHLER GEFUNDEN: App startete nicht (mehrere Ursachen)

Nach systematischer Durchsicht aller Dateien wurden **4 separate Fehler** gefunden, die zusammen verhinderten dass die App startet:

#### Fehler 1: ES-Imports ohne Bundler (Hauptursache)
`tauri-bridge.js` nutzte `import { invoke } from '@tauri-apps/api/core'`. Da das Projekt **keinen Bundler** (Vite/Webpack) hat, kann der Browser diese "bare module specifier" nicht auflösen → Modul lädt nicht → `window.electronAPI` wird nie definiert → jeder `init()`-Aufruf crasht sofort.
- **Fix**: `withGlobalTauri: true` in `tauri.conf.json` aktiviert
- **Fix**: `tauri-bridge.js` komplett auf `window.__TAURI__` umgeschrieben (keine Imports), wird als normales `<script>` geladen

#### Fehler 2: Fehlender capabilities/ Ordner
In Tauri v2 muss jede Berechtigung explizit freigegeben werden. Ohne `capabilities/` konnte das Frontend keine Commands aufrufen und das Fenster nicht anzeigen.
- **Fix**: `capabilities/default.json` mit allen nötigen Permissions erstellt

#### Fehler 3: Globale const-Kollisionen
`fixes.js` und `patches.js` deklarierten beide `const DISCORD_URL`, `_origInit`, `_origFeedback`, `_origShowOnboarding` im globalen Scope → SyntaxError → `patches.js` brach komplett ab.
- **Fix**: `patches.js` in IIFE gekapselt → consts sind jetzt lokal

#### Fehler 4: Electron-Reste
`app.js` nutzte `require('electron')` (existiert im WebView nicht).
- **Fix**: Electron-Code aus `shareStats()` entfernt

### Weitere Verbesserungen
- Fenster jetzt `visible: true` + Splash-Overlay (robuster als `visible:false` + show())
- Splash nutzt `omnihub-ready` Event statt init()-Wrapping (race-condition-frei) + 10s Sicherheits-Timeout
- Icons auf korrekte Größen skaliert (32x32 war fälschlich 256x256)
- Echte Multi-Resolution `icon.ico` erzeugt (16/32/48/64/128/256)
- `trayIcon` aus Config entfernt + `tray-icon` Feature aus Cargo.toml (war ungenutzt, potenzielle Crash-Quelle)
- `main.js` gelöscht (war ungenutzt)

### Geänderte/Neue/Gelöschte Dateien
| Datei | Was | Status |
|---|---|---|
| `src-tauri/capabilities/default.json` | Alle Tauri v2 Permissions | ✅ NEU |
| `src-tauri/tauri.conf.json` | `withGlobalTauri:true`, `visible:true`, trayIcon entfernt | geändert |
| `src-tauri/Cargo.toml` | `tray-icon` Feature entfernt | geändert |
| `src-tauri/icons/*` | Korrekte Größen + echte ICO | geändert |
| `src/js/tauri-bridge.js` | Komplett auf `window.__TAURI__` umgeschrieben | geändert |
| `src/js/app.js` | `require('electron')` entfernt | geändert |
| `src/js/patches.js` | In IIFE gekapselt, `omnihub-ready` Event | geändert |
| `src/js/main.js` | Ungenutzt | 🗑 GELÖSCHT |
| `src/index.html` | tauri-bridge als normales Script (zuerst), Event-basierter Splash | geändert |

---

## v0.3.4 – 2026-05-28

### 🔴 Crash-Fix: App startet nicht (0xc0000409)
**Root Cause:** `tracing_subscriber::fmt::init()` **panikt**, wenn bereits ein globaler Tracing-Subscriber gesetzt ist. Tauri v2.11 setzt intern einen eigenen Subscriber → zweiter `init()`-Call = Panic = `STATUS_STACK_BUFFER_OVERRUN` (0xc0000409) → sofortiger App-Absturz.

| Datei | Alt (buggy) | Neu (fix) |
|---|---|---|
| `lib.rs` | `tracing_subscriber::fmt::init()` | `let _ = tracing_subscriber::fmt::try_init()` |
| `lib.rs` | `app.store(...).expect(...)` → Panic | `match app.store(...) { Err(e) => eprintln!(...) }` |

### ⚠️ Warnings behoben
| Datei | Warning | Fix |
|---|---|---|
| `settings.rs` | `unused import: tauri::State` | Import entfernt |
| `sessions.rs` | `struct SessionInfo is never constructed` | Struct entfernt |

### ⚡ Build-Speed verbessert
**Problem:** `cargo generate-lockfile` erzeugte jedes Mal eine neue Lock-Datei → Cache-Key änderte sich → kein stabiler Dependency-Cache.

**Neue Strategie:**
1. `Cargo.lock` wird nach dem ersten Generieren gecacht (Key = Hash von `Cargo.toml`)
2. Nächster Build: Lock-Datei aus Cache → stabile Dep-Versionen
3. `Swatinem/rust-cache` mit `cache-targets: true` → gesamtes `target/` Verzeichnis gecacht
4. sccache bleibt als zusätzliche Ebene

**Erwartete Build-Zeiten:**
- Erster Build: ~8-10 Min (alles neu kompiliert + Caches befüllt)
- **Folge-Builds: ~2-3 Min** (target/ Cache-Hit → nur eigener Code neu kompiliert)

---

## v0.3.3 – 2026-05-28

### Bugfix: App startet nicht nach Installation
- **Ursache**: Fenster startete mit `splash.html`, `splash_done` in Rust versuchte `"index.html".parse()` als URL zu navigieren → ungültiger URL-Parse, App-Crash beim Start
- **Fix**: Splash komplett aus Rust entfernt. Stattdessen:
  - Fenster startet direkt mit `index.html` (`visible: false`)
  - CSS/JS-Overlay in `index.html` zeigt Ladebildschirm
  - Nach `init()` wird Overlay ausgeblendet + `appWindow.show()` aufgerufen
  - Kein Rust-seitiger Navigation-Befehl mehr nötig

### Bugfix: MSI-Installer überflüssig entfernt
- **Ursache**: `targets: "all"` erzeugt NSIS (.exe) **und** WiX (.msi)
- **MSI-Zweck**: Für Enterprise-Deployments via Group Policy / SCCM – für normale User nicht nötig
- **Fix**: `targets: ["nsis"]` → nur noch eine `.exe` im Release

### Gelöschte Dateien
- `src-tauri/src/commands/splash.rs` – nicht mehr benötigt
- `src/splash.html` – nicht mehr benötigt (Splash ist jetzt im index.html integriert)

---

## v0.3.2 – 2026-05-28

### Bugfixes: 7 Rust Compile-Fehler
| Datei | Fehler | Fix |
|---|---|---|
| `lib.rs` | `emit()` nicht gefunden | `use tauri::Emitter;` ergänzt |
| `lib.rs` | `updater()` nicht gefunden | `use tauri_plugin_updater::UpdaterExt;` ergänzt |
| `lib.rs` | `unwrap_or_default()` auf `Output` | → `.map(...).unwrap_or(false)` |
| `streaming.rs` | `weekday()` nicht gefunden | `use chrono::Datelike;` ergänzt |
| `system.rs` | `open::that()` unbekannt | `open = "5"` zu `Cargo.toml` ergänzt |
| `system.rs` | Unused imports | `use tauri::Manager`, `use std::io::Read` entfernt |
| `Cargo.toml` | `open` Crate fehlte | `open = "5"` ergänzt |

### Build-Speed-Optimierung: sccache + Cargo.lock Caching
**Problem:** Ohne `Cargo.lock` im Repo kein stabiler Cache-Key → alle 583 Pakete werden bei jedem Build neu kompiliert (~8-10 Min reine Compile-Zeit)

**Lösung:**
- `mozilla-actions/sccache-action` → cached einzelne `.rlib`-Compilate (50-70% Speedup)
- `cargo generate-lockfile` als eigener Step → erzeugt stabile Cache-Keys
- `Swatinem/rust-cache` gecacht auf Basis des generierten Lock-Files

**Erwartete Build-Zeiten:**
- Erster Build: ~10-12 Min (alles neu + Caches werden befüllt)
- Folge-Builds: ~3-5 Min (Cache-Hits bei Dependencies + sccache)

---

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
