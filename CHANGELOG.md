# Changelog

Alle nennenswerten Änderungen an OmniHub werden hier dokumentiert.
Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/),
Versionierung nach [SemVer](https://semver.org/lang/de/).

## [0.5.0] – 2026-05-29

Großer Funktionsblock aus der 17-Punkte-Liste.

### Hinzugefügt
- **50 Achievements** (statt 9), gestaffelt nach Streamzeit, gestarteten Streams, genutzten Anbietern, Favoriten und Watchlist.
- **In-App-Benachrichtigungen (Toasts).** Alle Push-Hinweise – inkl. Achievement-Freischaltung – erscheinen nur in der App, **nicht** mehr in den Windows-Benachrichtigungen.
- **Uhr-Overlay** wird angezeigt (digital oder analog, mit Farbe, Größe, Sekunden und Transparenz).
- **Partikel-Hintergrund** wird gerendert, mit Detailoptionen für Anzahl, Geschwindigkeit und Farbe.
- **„+ Anbieter"** öffnet einen Editor, um eigene Anbieter anzulegen (Name, URL, Beschreibung, Farbe, Qualität).
- **Raster-/Listenansicht** der Anbieter ist umschaltbar.
- Profilverwaltung: **PIN-Änderung fragt zuerst den alten PIN ab**; PIN entfernen ebenso geschützt.
- **ROADMAP.md** angelegt – hält alle 17 Wunsch-Punkte mit Status fest und wird laufend aktualisiert.

### Geändert
- **Favoriten verschwinden aus „Alle Anbieter"** und erscheinen dort erst wieder, wenn sie keine Favoriten mehr sind.
- **Glassmorphismus** sowie **Karten-Schatten, Hover-Zoom und Animationen** wirken jetzt tatsächlich.
- **Mehr Schriftarten** zur Auswahl; die gewählte Schrift gilt jetzt für **alle** Bedienelemente.
- **Alle Checkboxen** sehen als moderne Schalter aus.

### Noch offen (siehe ROADMAP.md)
- Titel-Info mit Trailer & Anbieter-Liste (5), Original-Logos (6), Hintergrundbild (13e), kompletter Profileditor + Admin-PIN-Reset (15b), komplette DE/EN-Übersetzung (13f), Anbieter in der App öffnen (8), CR-Kalender mit Login-Erkennung (9), „Account"-Tab mit aktiven Logins (14).

---

## [0.4.1] – 2026-05-29

### Behoben
- **Build schlug fehl** (`bundle > windows > nsis ... is not valid`). Der Lizenz-Pfad stand fälschlich unter `bundle.windows.nsis.license` – dieses Feld existiert dort nicht. Korrekt liegt er nun als **`bundle.licenseFile`** auf Bundle-Ebene; der NSIS-Installer zeigt die Lizenz-Seite weiterhin automatisch. Der Fehler steckte bereits seit v0.2.0 in der Konfiguration.
- Die komplette `tauri.conf.json` wird jetzt gegen das offizielle Tauri-Schema geprüft – aktuell **fehlerfrei**.

### Aufgeräumt
- Verwaiste Datei **`app-icon.png`** aus dem Projekt-Root entfernt (Überbleibsel des ersten Gerüsts, wurde nicht mehr verwendet).
- Leeren, ungenutzten Ordner `src/lib/i18n/` entfernt.

---

## [0.4.0] – 2026-05-29

Profiltrennung & getrennte Streaming-Logins.

### Hinzugefügt
- **Profile vollständig getrennt.** Jedes Profil hat eigene **Favoriten, Watchlist, „zuletzt geöffnet", Streamzeit und Achievements**. Beim Profilwechsel wird alles neu geladen.
- **Getrennte Logins beim Streamen.** Anbieter-Fenster nutzen pro Profil ein eigenes `dataDirectory` (Windows/WebView2) – Cookies und Anmeldungen sind dadurch je Profil getrennt und bleiben erhalten. Beim Wechsel werden die Fenster des vorherigen Profils geschlossen.
- **Profil-Wechsler** unten links in der Sidebar: Profil per Klick wechseln, **PIN-Abfrage** bei geschützten Profilen, Schnell-Hinzufügen.
- **Profilverwaltung** unter Einstellungen → Profile: anlegen (max. 5), umbenennen, löschen, **PIN setzen/ändern/entfernen** (SHA-256-Hash).

### Geändert
- **Favoriten** sind kein Anbieter-Flag mehr, sondern ein eigener, profilbezogener Datensatz.
- **Statistik** ist damit automatisch pro Profil.
- Mindestversion `@tauri-apps/api` auf 2.9.0 angehoben (für `dataDirectory`).

### Hinweise
- Streamzeit/Logins sind jetzt je Profil getrennt; die Anbieter-Liste (Katalog) und das App-Design bleiben global.
- Echte Marken-Logos, Karteneditor und CR-Kalender stehen weiterhin auf der Roadmap.

---

## [0.3.0] – 2026-05-29

Streamzeit-Tracking & Achievements.

### Hinzugefügt
- **Streamzeit-Tracking.** Solange ein Anbieter-Fenster offen ist, wird die Zeit gemessen – pro Anbieter und insgesamt. Ein 15-Sekunden-Heartbeat schreibt laufend fort (crash-sicher bis ~15 s), beim Schließen wird die letzte Teilzeit verbucht. Alles persistent gespeichert.
- **Achievements** schalten automatisch frei: Erstes Öffnen, 5 verschiedene Anbieter, 3/10 Favoriten, 5/20 Watchlist-Titel sowie 1/10/100 Stunden Streamzeit. Gesperrte Achievements zeigen einen **Fortschrittsbalken**.
- **Freischalt-Benachrichtigung** (einmalig je Achievement, abschaltbar unter Einstellungen → Benachrichtigungen).
- **Statistik-Seite überarbeitet**: echte Gesamtzeit, Anzahl gestarteter Streams, genutzte Anbieter sowie eine **Top-Liste der meistgenutzten Anbieter** mit Balken.
- **„Schaut gerade"-Seite** zeigt jetzt einen **Live-Timer** der laufenden Session inkl. bereits gespeicherter Zeit des Anbieters.

### Hinweise
- Streamzeit wird global gezählt (noch nicht je Profil getrennt – kommt mit der Profil-WebView-Trennung in v0.4).
- Läuft beim Beenden der App noch ein Fenster, geht höchstens die letzte angefangene 15-Sekunden-Spanne verloren.

### Roadmap (unverändert offen)
- **v0.3.x / v0.4**: echte Marken-SVG-Logos, Karteneditor für eigene Anbieter, Profiltrennung der WebViews (eigener `userDataDir`), optionale PIN-Verschlüsselung, Hintergrundbild-Auswahl, Watchlist-Import/-Export, Uhr-Overlay, CR-Kalender mit echten Daten, VPN-Status, Plugin-System.

---

## [0.2.0] – 2026-05-29

Großes Funktions- und Design-Update.

### Hinzugefügt
- **Persistenz.** Einstellungen, Profile, Favoriten, „zuletzt geöffnet" und die Watchlist werden über `tauri-plugin-store` dauerhaft gespeichert (`omnihub.json`) und beim Start automatisch geladen.
- **TMDB-Anbindung** (Rust-Command + Frontend-Wrapper): Multi-Suche, Trending (News) und Upcoming. Der API-Key wird in **einer Zeile** in `src-tauri/src/tmdb.rs` eingetragen (Anleitung im README). Unterstützt v3-Key und v4-Token automatisch.
- **Eigene Titelleiste** (OS-Rahmen entfernt): App-Branding links, Minimieren/Maximieren/Schließen rechts und ein **?-Button**, der die **Tastenkürzel-Übersicht** öffnet (F1, Strg+K, Strg+`,`, Strg+D, Esc).
- **Maximierter Erststart** + automatisches Merken von Fensterposition/-größe über `tauri-plugin-window-state`.
- **Onboarding** beim ersten Start (Profilname, Akzentfarbe, sichtbare Anbieter) – später über die Einstellungen erneut startbar.
- **Einstellungen als Modal** (statt eigener Seite), Layout im Stil des Screenshots: Tab-Sidebar links, Inhalt rechts, mit Tab-Suche.
- **Watchlist-Seite** voll funktionsfähig (Hinzufügen aus der Suche/News/Upcoming, Entfernen, „erscheint heute"-Banner).
- **News-/Upcoming-Seiten** mit TMDB-Daten und wechselndem, weichgezeichnetem Backdrop-Hintergrund.
- **Statistik-Seite** mit Live-Kennzahlen (Anbieter, Favoriten, Watchlist) und 8 Achievement-Kacheln.
- **CR-Kalender-Seite** als Platzhalter angelegt.
- **Favoriten & „Zuletzt geöffnet"** auf der Übersicht inkl. Lesezeichen-Button auf jeder Karte.

### Geändert / Behoben
- **„Anbieter hat die Verbindung verweigert" behoben.** Anbieter öffnen jetzt in einem echten **`WebviewWindow`** statt in einem `<iframe>`. Damit greifen `X-Frame-Options`/CSP-Sperren nicht mehr, und das native Edge-WebView beherrscht DRM (Netflix, Disney+ …).
- **Design-Überholung** nach Screenshot-Vorlage: Teal-Akzent (`#30c5bb`), **DM Sans** (offline gebündelt), große Anbieterkarten mit Marken-Verlauf, Qualitäts-Badge (4K/1080p/HD) und Logo.
- **Release-Workflow** veröffentlicht jetzt standardmäßig einen **echten Release**. Nur wenn beim manuellen Start die Option `draft` angehakt wird, entsteht ein Entwurf.
- Versionsnummern überall auf 0.2.0 angehoben.

### Bewusst NICHT übernommen
- **Burning Series, Cine.to, Movie2k** wurden erneut **nicht** als Standard-Anbieter aufgenommen (illegale Streaming-Portale). Die Funktion „eigenen Anbieter hinzufügen" bleibt davon unberührt.

### Noch offen (Roadmap)
- **v0.3**: echte Marken-SVG-Logos statt Buchstaben-Logos, Streamzeit-Tracking (schaltet Achievements frei), Karteneditor (eigene Anbieter anlegen/bearbeiten), Hintergrundbild-Auswahl, Watchlist-Import/-Export, Uhr-Overlay, CR-Kalender mit echten Daten.
- **v0.4**: Multi-Profil-Trennung der WebViews (eigener `userDataDir` je Profil), optionale PIN-Verschlüsselung der Profildaten, VPN-Status, Plugin-System.

---

## [0.1.1] – 2026-05-28

### Behoben
- **CI-Build lief nicht ohne lokale Vorarbeit.** Umgestellt auf `npm install` ohne Cache – die Lock-Datei wird auf dem Runner erzeugt. Es muss lokal nichts installiert werden.

### Hinzugefügt
- **App-Icons fertig im Repo**. Der Build benötigt keinen lokalen `tauri icon`-Aufruf mehr.
- Workflow liest die **Versionsnummer automatisch aus `package.json`**.

### Geändert
- Versionsnummer auf 0.1.1 angehoben; `Swatinem/rust-cache` korrekt geschrieben.

---

## [0.1.0] – 2026-05-28

### Hinzugefügt (Grundgerüst)
- Projektgerüst **Tauri v2 + SvelteKit + Tailwind v4**.
- Sidebar-Navigation, Übersicht mit Anbieter-Raster, 24 legale Standard-Anbieter.
- Einstellungen (6 Tabs), Stores (Settings/Profile/Provider), Tauri-Backend mit Plugins.
- GitHub-Actions-Release-Workflow.

### Bewusst NICHT übernommen
- Burning Series, Cine.to, Movie2k (illegale Portale).
