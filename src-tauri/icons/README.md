# App-Icons

Diese Icons sind bereits **fertig erzeugt und im Repo enthalten** – der Build
funktioniert sofort, ohne dass du lokal etwas installieren oder ausführen musst:

- `32x32.png`, `128x128.png`, `128x128@2x.png` (256px)
- `icon.ico` (Windows, multi-resolution)
- `icon.icns` (macOS)
- `icon.png` (1024px Quell-Icon)

## Eigenes Icon verwenden (optional)

Du willst dein eigenes Logo? Dann ersetze einfach `icon.png` (quadratisch,
mind. 1024×1024) über die GitHub-Weboberfläche und committe es. Beim nächsten
Workflow-Lauf wird daraus automatisch alles erzeugt – ein extra Schritt in der
Action ruft `tauri icon` auf, falls du das aktivierst. Aktuell sind die
Platzhalter-Icons (ember Quadrat mit „O") aktiv.
