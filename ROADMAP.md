# OmniHub – Roadmap

Diese Datei hält den geplanten Funktionsumfang fest und wird **bei jeder Version aktualisiert**.
Stand: v0.13.0

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

## v0.8.0
- ✅ (4) Karten gleich groß + volle Fensterbreite
- ✅ (6) Partikel-Hintergrund immer sichtbar (inkl. Sidebar)
- ✅ (16) Uhr sichtbar, 100% Transparenz = aus, im Uhr-Tab verschiebbar
- ✅ (10) Benachrichtigungscenter öffnet sich (Verlauf)
- ✅ (8) Neuigkeiten/Upcoming: Zeitlimit gegen ewiges „Lädt…"
- ✅ (7) Karten per Drag&Drop sortieren, alphabetisch als Standard, pro Profil gespeichert
- ✅ (11) Hintergrundbild wählbar (mit Deckkraft)
- ✅ (12) Design-zurücksetzen-Button
- ✅ (14) Partikel: mehrere Formen, Größe, Geschwindigkeit 0–1
- ✅ (5-Sicherheit) „Anbieter öffnen als" Eingebettet/Eigenes Fenster
- ✅ (17) Hinweis „Einstellungen gespeichert" beim Schließen
- ✅ (13) Erklärungen Karten-Schatten/Animationen + bessere Animationen

---

## v0.8.1 (Bugfixes)
- ✅ (5) Update-Prüfung: createUpdaterArtifacts aktiviert (latest.json wird erzeugt)
- ✅ (1/2) Profil bleibt beim Start & Seitenwechsel erhalten (zuverlässiger Sofort-Cache + abgesicherter Start)
- ✅ (3-Klick) Klick auf Karte öffnet wieder; Sortieren nur noch über Greif-Punkt
- ⏳ (3-Einbettung) Eingebetteter Stream zeigt evtl. nichts -> „Eigenes Fenster" testen / Konsole

---

## v0.9.0
- ✅ (4) Karten-Editor: Name/Untertitel/URL/Farbe/2.Farbe/Qualität/Logo bearbeiten (auch Standard-Anbieter), mit Live-Vorschau + „Auf Standard zurücksetzen"
- ✅ Eigene Logo-Bilder auf Karten; Bearbeitungen an Standard-Anbietern bleiben gespeichert

---

## v0.10.0
- ✅ (15) Profileditor: Haupt-Profil selbst wählbar (nicht löschbar), separater Admin-Code, „PIN vergessen?" per Admin-Code
- ✅ (1) Stream-Standard auf „Eigenes Fenster" (zuverlässig); „Eingebettet" bleibt optional
- ✅ (2) Desktop-Icons frisch aus Logo erzeugt; Android-/iOS-Reste entfernt

---

## v0.10.1 (Bugfixes)
- ✅ (2/8) F12-Konsole im Release aktiviert (devtools-Feature)
- ✅ (4) Admin-Code ändern erfordert alten Admin-Code
- ✅ (6) Haupt-Profil-Wechsel nur per Admin-Code
- ✅ (5) „Profil hinzufügen" verschwindet bei 5 Profilen
- ✅ (7) Uhr Digital/Analog-Umschalter funktioniert

---

## v0.11.0
- ✅ (18) Plugin-/Modul-System: Plugins-Tab funktional (Weiterschauen-Toggle, Sleep-Timer)
- ✅ (3) Eingebettete Streams laufen (durch Partikel-Absturz-Fix in v0.10.2)
- ℹ️ Echte Browser-Erweiterungen (AdBlock/Buster) nicht möglich (System-WebView); Captcha-Solver bewusst nicht

---

## v0.12.0
- ✅ Discord-Status (Rich Presence) als Plugin-Modul (Rust-Backend, lokal nicht testbar)

---

## v0.13.0
- ✅ (9) Crunchyroll-Kalender: 7-Tage-Anime-Plan via AniList, Crunchyroll markiert/verlinkt, Filter „Nur Crunchyroll"

---

## Als Nächstes geplant (Reihenfolge laut Wunsch)
- ⏳ (5) Streams starten nicht: Stream-Modus „Eigenes Fenster" als Notlösung; Ursache der Einbettung mit Konsolen-Ausgabe klären
- ⏳ (19) „Mehr"-Menü-Redesign + VPN / Watchlist-Import-Export / WideVine-Status (Machbarkeit – siehe Antwort)
