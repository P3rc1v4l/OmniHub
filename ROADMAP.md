# OmniHub – Roadmap

Diese Datei hält den geplanten Funktionsumfang fest und wird **bei jeder Version aktualisiert**.
Stand: v0.7.0

Legende: ✅ erledigt · 🟡 teilweise · ⏳ geplant · 💡 in Klärung (Machbarkeit)

---

## Erledigt (frühere Versionen)
- ✅ Persistenz (Einstellungen, Profile, Favoriten, Watchlist, Streamzeit)
- ✅ TMDB-Anbindung (Suche / Trending / Upcoming) – Key-Eintrag nötig
- ✅ Eigene Titelleiste + Tastenkürzel (?-Button / F1)
- ✅ Maximierter Start + Fenster-Memory
- ✅ Anbieter öffnen in echtem WebviewWindow (löste „Verbindung verweigert")
- ✅ Onboarding, Einstellungen als Modal
- ✅ Streamzeit-Tracking + Achievements (Basis)
- ✅ Profiltrennung: Favoriten/Watchlist/Streamzeit + getrennte Logins (dataDirectory)
- ✅ Profil-Wechsler mit PIN + Profilverwaltung (anlegen/umbenennen/löschen/PIN)
- ✅ Eigenes Logo als App-/Desktop-Symbol; Installer mit Lizenz-Zustimmung
- ✅ Dependabot (npm/Cargo/Actions)

---

## v0.5.0 (diese Version)
- ✅ (11) Favoriten verschwinden aus „Alle Anbieter", bis sie wieder entfernt werden
- ✅ (12a) Achievement-/Push-Meldungen **nur in der App** (keine Windows-Benachrichtigungen)
- ✅ (12b) **50 Achievements**
- ✅ (10a) Übersicht: Umschalter Raster-/Listenansicht funktioniert
- ✅ (10b) Übersicht: „+ Anbieter" öffnet einen Editor zum Anlegen eigener Anbieter
- ✅ (16) Uhr-Overlay wird angezeigt (digital/analog, Farbe/Größe/Transparenz)
- ✅ (13a) Alle Checkboxen als schönere Schalter
- ✅ (13b) Glassmorphismus + „weitere Optik-Optionen" (Schatten/Hover-Zoom/Animationen) wirken
- ✅ (13c) Partikel-Hintergrund wird gerendert, mit detaillierten Optionen
- ✅ (13d) Mehr Schriftarten zur Auswahl (gilt für die ganze App)
- ✅ (15a) PIN-Änderung fragt zuerst den alten PIN ab

## v0.6.0
- ✅ (8) Anbieter werden im Hauptfenster eingebettet (kein zweites Fenster mehr); Fenster-Fallback vorhanden
- ✅ TMDB-Key eingetragen – Suche/Neuigkeiten/Upcoming liefern Daten

## v0.7.0
- ✅ (Update-Funktion) Echter In-App-Updater: Prüfung beim Start + auf Knopfdruck, Banner zum Herunterladen/Installieren (signiert über GitHub-Releases)

---

## Als Nächstes geplant (Reihenfolge laut Wunsch)
- ⏳ (5) Suche nach Filmen/Serien/Anime: Klick öffnet Titel-Info (Inhaltsangabe, Trailer) + Liste der Anbieter, bei denen der Titel läuft (mit Verlinkung)
- ⏳ (6) Original-Logos der Anbieter auf den Karten (später im Karteneditor anpassbar)
- ⏳ (4) Erklärung „echte Marken-Logos (lokale SVGs)" – siehe Antwort; Umsetzung folgt mit (6)
- ⏳ (13e) Hintergrundbild in den Design-Einstellungen wählbar
- ⏳ (15b) Vollständiger Profileditor; Haupt-Profil kann mit „PIN + admin" vergessene PINs zurücksetzen
- ⏳ (13f) **Komplette Übersetzung DE/EN** der gesamten Oberfläche + Anbieter in der jeweiligen Sprache öffnen

## In Klärung (Machbarkeit / Aufwand)
- 💡 (9) „CR Kalender" nur bei Crunchyroll-Login sichtbar + echte Kalenderdaten (Login-Erkennung + Datenquelle nötig)
- 💡 (14) Einstellungen → „Account": angemeldete Anbieter live (1×/Min.) inkl. Anmeldezeit + Logout-Buttons + „überall abmelden" (Cookie-Zugriff je Profil – Machbarkeit wird geprüft)

---

## Daueraufgaben
- Bei jeder Version: `tauri.conf.json` gegen das Tauri-Schema prüfen, Frontend testweise bauen, Repo auf überflüssige Dateien prüfen, diese Roadmap aktualisieren.
