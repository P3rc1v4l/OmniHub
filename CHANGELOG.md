# Changelog

Alle nennenswerten Änderungen an OmniHub werden hier dokumentiert.
Format orientiert sich an [Keep a Changelog](https://keepachangelog.com/de/),
Versionierung nach [SemVer](https://semver.org/lang/de/).

## [0.12.2] – 2026-05-29

### Geändert
- **Eingebaute OmniHub-Discord-Kennung hinterlegt.** Der Discord-Status funktioniert jetzt mit einem **einzigen Schalter** – keine Eingabe nötig. (Eine eigene Application-ID unter „Erweitert" hat weiterhin Vorrang.)

---

## [0.12.1] – 2026-05-29

### Geändert
- **Discord-Status ohne Code-Eingabe vorbereitet:** Es gibt jetzt einen Platz für eine **eingebaute OmniHub-Discord-Kennung**. Sobald diese hinterlegt ist, müssen Nutzer im Discord-Modul **nichts mehr eintragen** – einfach einschalten. Die eigene Application-ID ist nur noch eine **optionale „Erweitert"-Einstellung**. Klarstellung in der App: Es ist **kein Discord-Login** nötig, es nutzt die laufende Discord-App.

---

## [0.12.0] – 2026-05-29

### Hinzugefügt
- **Discord-Status (Rich Presence) als Plugin-Modul:** Im „Plugins"-Tab aktivierbar. Bei aktivem Stream zeigt Discord „Schaut <Anbieter>", sonst „Durchstöbert OmniHub". Voraussetzung: laufende Discord-App + eigene **Discord-Application-ID** (Client-ID), die im Plugins-Tab eingetragen wird.
  - Rust-Backend via Crate `discord-rich-presence` 1.1.0 mit Commands `discord_connect/set_activity/clear/disconnect` (lokale Discord-IPC).
  - Frontend-Modul aktualisiert die Anzeige automatisch beim Wechsel des Streams.

> Hinweis: Der Rust-Teil konnte lokal nicht kompiliert werden – bitte über GitHub Actions bauen. Bei Build-Fehlern Meldung schicken, dann nachbessern.

---

## [0.11.0] – 2026-05-29

### Hinzugefügt
- **Plugin-/Modul-System (Punkt 18):** Der „Plugins"-Tab ist jetzt funktional – eingebaute Zusatzfunktionen lassen sich an-/ausschalten:
  - **Weiterschauen:** blendet die „Zuletzt geöffnet"-Reihe auf der Startseite ein/aus.
  - **Sleep-Timer:** zeigt nach 15/30/60/90/120 Min einen Hinweis und schließt optional den laufenden Stream.

### Hinweis (ehrlich)
- **Echte Browser-Erweiterungen** (AdBlock, Buster usw.) lassen sich technisch **nicht** installieren: OmniHub nutzt die System-WebView (Edge/WebView2), nicht Chrome – Tauri bietet dafür keine Schnittstelle. **Captcha-Solver** werden bewusst nicht angeboten. Der Plugins-Tab weist darauf hin.
- Weitere Module wie **Discord-Status** sind möglich, brauchen aber eine zusätzliche (Rust-)Integration – auf Wunsch als Nächstes.

---

## [0.10.2] – 2026-05-29

### Behoben (wichtig)
- **Absturz beim Start behoben** (`Cannot read properties of undefined (reading 'getContext')`): Die Partikel-Komponente hat beim Start auf das Canvas zugegriffen, obwohl es (bei Partikel-Standard „aus") noch nicht existierte. Das löste einen „Uncaught"-Fehler aus, der den App-Aufbau stören konnte. Die Partikel-Logik läuft jetzt erst, **wenn das Canvas wirklich da ist**, und startet/stoppt sauber beim Ein-/Ausschalten. Dieser Fehler war ein heißer Kandidat dafür, dass auch **eingebettete Streams** und andere Abläufe gehakt haben.

---

## [0.10.1] – 2026-05-29

### Behoben / Geändert
- **(2/8) F12-Konsole aktiviert:** Die DevTools sind jetzt auch im fertigen Build verfügbar (Cargo-Feature `devtools`). Nach dem Neubau öffnest du sie mit **F12** oder **Rechtsklick → „Untersuchen"**.
- **(4) Admin-Code-Schutz:** Zum **Ändern/Entfernen** des Admin-Codes muss jetzt zuerst der **alte Admin-Code** eingegeben werden.
- **(6) Haupt-Profil nur per Admin-Code:** Das Haupt-Profil lässt sich nur noch nach Eingabe des Admin-Codes wechseln (sofern einer gesetzt ist).
- **(5) „Profil hinzufügen"** verschwindet jetzt komplett, sobald 5 Profile existieren (statt nur ausgegraut).
- **(7) Uhr Digital/Analog** wechselt jetzt zuverlässig (Umschalter schreibt den Wert nun korrekt zurück).

### Auf der Roadmap
- **(3)** Eingebettete Anbieter öffnen nicht – wird mit der nun verfügbaren F12-Konsole gezielt analysiert.

---

## [0.10.0] – 2026-05-29

### Hinzugefügt
- **Profileditor (Punkt 15):** Im Tab *Profile* lassen sich Profile anlegen, umbenennen, löschen und mit PIN schützen – und neu:
  - **Haupt-Profil selbst wählbar** (★). Es ist **nicht löschbar** und dient als „Anker".
  - **Separater Admin-Code** (frei wählbar, unabhängig von den Profil-PINs).
  - **„PIN vergessen?"** – einen vergessenen Profil-PIN über den Admin-Code zurücksetzen.

### Geändert / Behoben
- **(1) Eingebettete Anbieter:** Da das Einbetten auf einer experimentellen Tauri-Funktion beruht, die sich nicht zuverlässig prüfen lässt, ist **„Eigenes Fenster" jetzt Standard** (funktioniert verlässlich). „Eingebettet" bleibt als Option wählbar.
- **(2) Desktop-Icon:** Der komplette Icon-Satz (inkl. `icon.ico` in allen Größen) wurde **frisch aus dem App-Logo** erzeugt; nicht benötigte Android-/iOS-Icon-Ordner wurden entfernt.

> Hinweis zum Icon: Falls auf dem Desktop weiterhin ein altes Icon erscheint, liegt das am **Windows-Icon-Cache** einer früheren Installation (siehe Antwort, wie man das löst).

---

## [0.9.1] – 2026-05-29

### Behoben
- **Build/Signatur-Fehler** („failed to decode secret key … Missing comment in secret key"): Der Updater-Schlüssel hatte ein **Passwort**, und ein falsch gesetztes/leeres Passwort-Secret ließ die Signatur fehlschlagen. Es wurde ein **neues, passwortloses Schlüsselpaar** erzeugt (Signatur wurde lokal erfolgreich getestet). Der öffentliche Schlüssel in der App ist aktualisiert; das Passwort-Secret wird nicht mehr benötigt.

> Wichtig: Da bisher noch **kein** signierter Release veröffentlicht wurde, ist der Schlüsseltausch unkritisch – es gibt keine alten, anders signierten Installationen.

---

## [0.9.0] – 2026-05-29

### Hinzugefügt
- **Karten-Editor (Punkt 4):** Über das Stift-Symbol auf jeder Anbieterkarte lässt sich jetzt alles bearbeiten – **Name, Untertitel, URL, Farbe, 2. Farbe (Verlauf), Qualität und ein eigenes Logo-Bild**. Funktioniert für eigene **und** für Standard-Anbieter; Standard-Karten lassen sich per Knopf wieder „Auf Standard zurücksetzen". Mit Live-Vorschau des Logos.
- **Eigene Logo-Bilder:** Karten können jetzt ein hochgeladenes Bild als rundes Logo zeigen (sonst weiterhin das farbige Buchstaben-Logo).

### Geändert
- Bearbeitungen an **Standard-Anbietern bleiben erhalten** (werden gespeichert und beim Start wiederhergestellt; neue Felder künftiger Versionen werden weiterhin ergänzt).

---

## [0.8.1] – 2026-05-29

### Behoben
- **Update-Prüfung („Could not fetch a valid release JSON"):** In der Konfiguration fehlte `createUpdaterArtifacts`. Dadurch hat der Build nie eine `latest.json` erzeugt, die die App abfragen kann. Jetzt aktiviert – der nächste signierte Build legt `latest.json` an, und die Update-Suche funktioniert.
- **Profil bleibt erhalten (Start & Seitenwechsel):** Das aktive Profil und die Profilliste werden jetzt zusätzlich in einem zuverlässigen Sofort-Cache gespeichert und beim Start sicher wiederhergestellt. Der Start ist außerdem so abgesichert, dass ein Fehler in einem Schritt (z.B. Update-Prüfung) den Rest nicht mehr abbricht.
- **Klick auf Anbieterkarte öffnet wieder:** Das Drag&Drop aus v0.8.0 hatte den Klick „verschluckt". Jetzt gibt es einen kleinen **Greif-Punkt** (⠿, oben links bzw. links in der Liste) – nur der zieht zum Sortieren, der Rest der Karte öffnet wieder normal den Anbieter.

### Hinweis
Ob der eingebettete Stream danach erscheint, hängt weiterhin von der WebView-Einbettung ab (siehe Antwort: bitte „Eigenes Fenster" testen / Konsole prüfen).

---

## [0.8.0] – 2026-05-29

### Behoben
- **Anbieterkarten gleich groß:** „Alle Anbieter" sind jetzt genauso groß wie die Favoriten und füllen die volle Fensterbreite (kein Leerraum rechts mehr).
- **Partikel-Hintergrund** wird jetzt immer angezeigt (sobald aktiviert) – auf allen Seiten und auch hinter der Sidebar/Titelleiste. Die Größe wird zuverlässig anhand der Fenstergröße gesetzt.
- **Uhr:** wird wieder angezeigt; bei 100&nbsp;% Transparenz wird sie bewusst ausgeblendet. Im Uhr-Tab erscheint sie ganz vorne und ist per Maus verschiebbar.
- **Benachrichtigungscenter:** Klick auf die 🔔 öffnet jetzt ein Panel mit dem Verlauf der letzten Hinweise (mit „Leeren").
- **Neuigkeiten/Upcoming:** TMDB-Anfragen haben jetzt ein Zeitlimit (15&nbsp;s) – die Seite bleibt nicht mehr ewig auf „Lädt…" hängen, sondern zeigt im Fehlerfall einen Hinweis.

### Hinzugefügt
- **Karten per Drag & Drop sortieren:** Standard ist alphabetisch; eigene Reihenfolge wird automatisch pro Profil gespeichert. Button „A↓Z" stellt wieder alphabetisch her.
- **Hintergrundbild** in den Design-Einstellungen wählbar (inkl. Deckkraft-Regler und „Entfernen").
- **Design zurücksetzen**-Button (setzt alle Design-Optionen auf Standard).
- **Partikel-Optionen erweitert:** mehrere Formen gleichzeitig (Kreis/Quadrat/Dreieck/Stern), Größe einstellbar, Geschwindigkeit jetzt 0–1 in 0,1-Schritten.
- **Anbieter öffnen als** „Eingebettet" oder „Eigenes Fenster" (Sicherheits-Schalter, falls die Einbettung auf einem Gerät nicht klappt).
- **Einstellungen-Hinweis:** Beim Schließen der Einstellungen erscheint unten rechts „Einstellungen gespeichert".
- Erklärungen zu „Karten-Schatten" und „Animationen" direkt im Design-Tab; Animationen wirken jetzt deutlicher.

### Noch offen (kommt als Nächstes)
- Profileditor inkl. selbst wählbarem Haupt-Profil und separatem Admin-Code zum PIN-Zurücksetzen.
- Streams, die nach Klick nichts zeigen: bitte Stream-Modus testweise auf „Eigenes Fenster" stellen und Rückmeldung geben (Details in der Antwort).
- Crunchyroll-Kalender, Plugin-System, VPN/WideVine-Status.

---

## [0.7.0] – 2026-05-29

### Hinzugefügt
- **Echter In-App-Updater.** Beim Start (still) und auf Knopfdruck (Einstellungen → Mehr → „Nach Updates suchen") prüft die App gegen die GitHub-Releases. Gibt es eine neuere, signierte Version, erscheint oben ein **Banner** mit „Herunterladen & installieren" inkl. Fortschrittsbalken; danach startet die App automatisch neu.
- Signierte Updates über das Tauri-Updater-Plugin (Schlüsselpaar erzeugt, öffentlicher Schlüssel in der Konfiguration).

### Technisch
- Plugins `tauri-plugin-updater` und `tauri-plugin-process` ergänzt (Rust + JS) und Berechtigungen `updater:default` / `process:default` hinzugefügt.
- Release-Workflow signiert die Update-Artefakte und erzeugt `latest.json` (über GitHub-Secrets `TAURI_SIGNING_PRIVATE_KEY` / `…_PASSWORD`).

### Wichtig
- Die Secrets müssen **vor** dem Build von v0.7.0 in GitHub hinterlegt sein, sonst schlägt der Build fehl.
- Ein bereits installiertes v0.6.0 kann sich nicht selbst aktualisieren (hat noch keinen Updater). v0.7.0 einmalig manuell installieren – ab dann laufen Updates automatisch.

---

## [0.6.0] – 2026-05-29

### Hinzugefügt
- **Anbieter werden jetzt IM Hauptfenster angezeigt** (Punkt 8), als echtes eingebettetes Webview statt als zweites Fenster. Kein iframe – die „Verbindung verweigert"-Sperre greift also weiterhin nicht, und Logins bleiben pro Profil getrennt und erhalten.
- Stream-Ansicht mit Kopfleiste (Anbieter, Live-Streamzeit, „Schließen"); beim Verlassen der Seite wird das Webview ausgeblendet und beim Zurückkehren sofort wieder eingeblendet.
- **TMDB-Key eingetragen** – Suche, Neuigkeiten und Upcoming liefern jetzt Daten.
- Defensiver Fallback: Sollte das Einbetten auf einem System nicht funktionieren, öffnet sich automatisch wieder ein separates Fenster (App bleibt nutzbar).

### Technisch
- `unstable`-Feature des Tauri-Crates aktiviert (für eingebettete Webviews) und passende Webview-Berechtigungen ergänzt.

### Hinweis
- Das Einbetten ist eine native Windows/WebView2-Funktion und konnte hier nicht auf echtem Windows getestet werden; falls es klemmt, greift automatisch der Fenster-Fallback.

---

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
