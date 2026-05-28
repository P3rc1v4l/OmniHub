// ═══ OmniHub v0.3.0 – Haupt-Einstiegspunkt ═══
// Lädt alle Module in der richtigen Reihenfolge.
// Ruft nach dem App-Init splash_done() auf Rust auf.

(async function loadApp() {
  // Splash: Ladefortschritt signalisieren
  function splashStatus(msg) {
    const el = document.getElementById('status');
    if (el) el.textContent = msg;
  }

  // Warte bis Tauri-Bridge verfügbar ist
  let retries = 0;
  while (!window.electronAPI && retries++ < 30) {
    await new Promise(r => setTimeout(r, 100));
  }

  // Module laden via dynamische Script-Tags (kein Bundler benötigt)
  const modules = [
    'js/core/i18n.js',
    'js/core/providers.js',
    'js/core/achievements.js',
    'js/ui/notifications.js',
    'js/ui/search.js',
    'js/features/widevine.js',
    'js/features/feedback.js',
    'js/app.js',
    'js/fixes.js',
    'js/patches.js',
  ];

  for (const src of modules) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = e => {
        console.error(`[OmniHub] Fehler beim Laden: ${src}`, e);
        resolve(); // weiter trotz Fehler
      };
      document.head.appendChild(s);
    });
  }

  // App starten
  if (typeof init === 'function') {
    try {
      await init();
    } catch (e) {
      console.error('[OmniHub] init() Fehler:', e);
    }
  }

  // Splash beenden → Tauri lädt index.html in dasselbe Fenster
  // (wird aufgerufen wenn wir DIREKT auf index.html sind, nicht auf splash.html)
  // splash_done wird vom index.html nach init() aufgerufen
})();
