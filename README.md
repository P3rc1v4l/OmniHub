# OmniHub

Zentraler **Streaming-Hub** als Windows-Desktop-App. Bündelt deine legalen
Streaming-Dienste in einem Fenster – mit Profilen, Watchlist, Statistiken und
TMDB-Metadaten.

**Tech-Stack:** Tauri v2 (Rust) · SvelteKit (Svelte 5) · Tailwind CSS v4

---

## Release bauen – komplett in GitHub, ohne lokale Installation

Du brauchst auf deinem PC **nichts** außer der fertigen `.exe`. Der gesamte Build
läuft auf GitHubs Servern:

1. Code liegt in GitHub (Bearbeiten geht direkt über die Weboberfläche).
2. **Actions-Tab → „Release" → *Run workflow*** klicken
   *(oder einen Tag pushen, z.B. `v0.1.1`).*
3. GitHub baut die App und legt einen **Release-Entwurf** an.
4. Im **Releases-Tab** den Entwurf öffnen → **„Publish release"** → fertig.
5. Du und deine Nutzer ladet die `.exe`/den Installer aus dem Release herunter.

> Hinweis: Der Release wird als *Entwurf* erstellt (`releaseDraft: true`), damit
> du ihn vor der Veröffentlichung prüfen kannst. Möchtest du, dass er sofort
> öffentlich ist, setze in `.github/workflows/release.yml` `releaseDraft: false`.

---

## Optional: lokale Entwicklung

Nur falls du selbst am Code entwickeln willst (für Nutzer **nicht** nötig):

| Tool | Version |
|---|---|
| Node.js | ≥ 20 |
| Rust (rustup) | stable |
| Edge WebView2 | unter Windows meist vorinstalliert |

```bash
npm install
npm run tauri:dev      # App-Fenster mit Hot-Reload
```

## Links

- GitHub: https://github.com/P3rc1v4l/OmniHub
- Discord: https://discord.gg/tnfgta33uj
