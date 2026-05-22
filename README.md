# OmniHub

**Dein zentrales Streaming-Hub** – gebaut mit Tauri v2.

> Herausgeber: **Percival Aletheos** | Version: `1.0.0`

---

## Features

- 27 Streaming-Anbieter (Netflix, Prime, Disney+, Crunchyroll, YouTube, Twitch …)
- Eigene Anbieter hinzufügen
- Favoriten, Watchlist, Neuigkeiten, Upcoming
- TMDB-Integration (Trending, Neue Releases, Suche, Detail-Popup, Trailer)
- Statistiken mit Achievements (25 Stück)
- Crunchyroll-Kalender (Sidebar-Widget + Statistiken)
- Profil-System mit isolierten Sessions
- Multi-Tab-System (YouTube, Twitch, BurningSeries, Cine.to)
- Miniplayer (PiP), Vollbild, Zweites Fenster
- Partikel-Hintergrund (10 Formen), konfigurierbare Uhr
- AdBlock mit 4 Plugin-Listen
- VPN-Status, Auto-Update, DE/EN-Übersetzung
- Dark/Light-Mode, vollständig anpassbares Design

---

## Installation (Windows)

Lade den neuesten Installer aus den [Releases](https://github.com/P3rc1v4l/OmniHub/releases) herunter und führe die `.exe` aus. Der Installer fragt nach Installationspfad und Benutzer.

> ⚠️ OmniHub (Tauri) ist unabhängig von einer evtl. vorhandenen OmniSight (Electron) Installation.

---

## Entwicklung

```bash
npm install
npm run bundle   # Tauri API-Bundles erstellen
npm run dev      # Entwicklungsserver
npm run build    # Produktions-Build
```

**Voraussetzungen:** Rust (stable), Node.js ≥ 20, WebView2 (Windows)

---

## Changelog

Alle Änderungen: [CHANGELOG.md](./CHANGELOG.md)

---

© 2025 Percival Aletheos – MIT License
