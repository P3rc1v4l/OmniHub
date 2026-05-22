# OmniHub – Changelog

Alle Versionsänderungen werden hier kumulativ festgehalten.

---

## [1.0.0] – Kompletter Neuaufbau auf Tauri-Basis

### Neu
- Kompletter Neuaufbau von Grund auf (ignoriert alten Code)
- Tauri v2 Backend (Rust) statt Electron (Node.js)
- 27 Streaming-Anbieter: Netflix, Prime, Disney+, Crunchyroll, YouTube, Twitch und mehr
- Favoriten-System mit Sidebar-Sub-Navigation und Suchfilter
- Drag & Drop Karten-Sortierung (deaktiviert bei A–Z-Sortierung)
- 3 Layout-Modi: Normal (260px), Kompakt (180px), Mini (110px)
- Karten-Editor: Bild, Logo, Farbe, Offset, Transparenz, Name, Tag
- Eigene Anbieter hinzufügen (Name, URL, Farbe)
- Gelöschte Anbieter einzeln oder alle wiederherstellen
- TMDB-Suche (220ms Debounce) mit Provider-Vorschlägen und Suchverlauf (max. 20)
- Detail-Popup mit Backdrop, Poster, Badges, Beschreibung, Trailer (YouTube-nocookie), Streaming-Provider-Chips (nur DE)
- Neuigkeiten-View: Vollbild-Slideshow, Trending/Neu, Filme/Serien/Anime, Ausblenden-Funktion
- Upcoming-View: 1 Monat / 6 Monate / 1 Jahr Zeitraum-Auswahl
- Watchlist (Gemerkt): Filter Alle/Filme/Serien/Anime, Sortierung A–Z/Datum, Rechtsklick Kategorie-Wechsel
- Statistiken: Top-3-Anbieter-Balkendiagramm, Wochenanalyse, CR Kalender, Achievements
- 25 Achievements (Streamzeit, Anbieter, Besonders, Versteckt) mit Push-Notification
- Profil-System: unbegrenzt viele Profile, isolierte Sessions, Erstellen/Umbenennen/Löschen-Modal
- Session-Anzeige (grüner Punkt) auf Provider-Karten
- Multi-Tab-System für YouTube, Twitch, BurningSeries, Cine.to
- Miniplayer (PiP): draggbar, 340×210px, Expand ohne Reload
- Vollbild: F11 / ESC, automatischer Exit-Button bei Mouse-Hover oben
- Einstellungen mit 5 Tabs: Design, Account, Uhr, Plugins, Mehr
- Design-Tab: Hintergrundbild, Akzentfarbe, Schriftart, Schriftgröße, Kartenrundung, Sidebar-Breite, Karten-Schatten, Glasmorphismus
- Partikel-System: 10 Formen, konfigurierbare Anzahl/Größe/Geschwindigkeit/Farbe
- Uhr: Digital/Analog, Farbe, Transparenz, Größe, Drag (nur im Uhr-Tab), Rechtsklick-Menü
- Plugins/AdBlock: EasyList, EasyPrivacy, Fanboy Annoyance, AdGuard Base installierbar
- VPN-Status-Erkennung via ipapi.co
- Auto-Update via GitHub Releases mit Badge und manueller Prüfung
- Dark/Light-Mode-Toggle in der Sidebar
- DE/EN Übersetzung (sofortige Umschaltung)
- CR Kalender-Widget in der Sidebar (aufklappbar) und in Statistiken
- Online-Status-Check alle 30 Sekunden
- Fensterposition wird beim Schließen gespeichert
- NSIS-Installer: Wahl des Installationspfads und Benutzers (Both-Mode)
- Herausgeber: Percival Aletheos

### Technisch
- Tauri v2 mit `@tauri-apps/api` (esbuild-Bundle für Browser)
- IPC via `TauriAPI.invoke` / `TauriEvent.listen`
- Rust-Backend: alle Commands via `AppHandle` (kein `tauri::Window` Parameter)
- Persistenz: `tauri-plugin-store` (omnihub-store.json)
- Benachrichtigungen: `tauri-plugin-notification`
- Datei-Picker: `tauri-plugin-dialog`
- Externes Öffnen: `tauri-plugin-opener`
- Build: LTO thin, strip, opt-level s
- Frameless Window mit eigenem Titlebar (Drag-Region)
- Splash-Screen mit Partikel-Animation, 3s Ladezeit

---
