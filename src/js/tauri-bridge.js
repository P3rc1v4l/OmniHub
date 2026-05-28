// ═══════════════════════════════════════════════════════════════════
// OmniHub – Tauri API Bridge  v0.3.5
// WICHTIG: Nutzt window.__TAURI__ (withGlobalTauri:true)
//          KEINE ES-Imports → funktioniert OHNE Bundler!
//          Wird als NORMALES <script> geladen (nicht type="module")
// ═══════════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ── __TAURI__ Verfügbarkeit prüfen ─────────────────────────────────
  if (!window.__TAURI__) {
    console.error('[OmniHub] FEHLER: window.__TAURI__ nicht verfügbar! ' +
                  'withGlobalTauri muss in tauri.conf.json aktiv sein.');
    // Notfall-Stub damit init() nicht komplett crasht
    window.electronAPI = new Proxy({}, {
      get: () => () => Promise.reject(new Error('Tauri API nicht verfügbar'))
    });
    return;
  }

  const { invoke }                 = window.__TAURI__.core;
  const { emit, listen }           = window.__TAURI__.event;
  const { getCurrentWindow }       = window.__TAURI__.window;
  const win = getCurrentWindow();

  // Hilfsfunktion: Plugin-Command aufrufen
  const plugin = (name, cmd, args) => invoke(`plugin:${name}|${cmd}`, args || {});

  window.electronAPI = {

    // ── Settings ────────────────────────────────────────────────────
    getSettings:       ()          => invoke('get_settings'),
    setSettings:       (s)         => invoke('set_settings', { settings: s }),
    getTheme:          ()          => invoke('get_theme'),
    setTheme:          (t)         => invoke('set_theme', { theme: t }),
    setThemeSource:    (t)         => invoke('set_theme', { theme: t }),

    // ── Profile ─────────────────────────────────────────────────────
    getProfiles:       ()          => invoke('get_profiles'),
    setProfiles:       (p)         => invoke('set_profiles', { profiles: p }),
    getActiveProfile:  ()          => invoke('get_active_profile'),
    setActiveProfile:  (id)        => invoke('set_active_profile', { profileId: id }),
    hashPin:           (pin)       => invoke('hash_pin', { pin }),
    verifyPin:         (pin, hash) => invoke('verify_pin', { pin, hash }),

    // ── Streaming & Stats ───────────────────────────────────────────
    getStreamStats:    (pid)       => invoke('get_stream_stats', { profileId: pid }),
    setStreamStats:    (pid, s)    => invoke('set_stream_stats', { profileId: pid, stats: s }),
    getWatchedContent: (pid)       => invoke('get_watched_content', { profileId: pid }),
    setWatchedContent: (pid, c)    => invoke('set_watched_content', { profileId: pid, content: c }),
    recordWatchTime:   (id, secs, pid) =>
                         invoke('record_watch_time', { providerId: id, seconds: secs, profileId: pid }),

    // ── Achievements ────────────────────────────────────────────────
    getAchievements:    (pid)      => invoke('get_achievements', { profileId: pid }),
    setAchievements:    (pid, l)   => invoke('set_achievements', { profileId: pid, list: l }),
    getAchievementMeta: (pid)      => invoke('get_achievement_meta', { profileId: pid }),
    setAchievementMeta: (pid, m)   => invoke('set_achievement_meta', { profileId: pid, meta: m }),

    // ── Notifications (Store) ────────────────────────────────────────
    getNotifications:  (pid)       => invoke('get_notifications', { profileId: pid }),
    setNotifications:  (pid, n)    => invoke('set_notifications', { profileId: pid, notifs: n }),

    // ── Notifications (System – via Plugin-Invoke) ───────────────────
    showNotification: async (title, body) => {
      try {
        let granted = await plugin('notification', 'is_permission_granted');
        if (!granted) {
          const perm = await plugin('notification', 'request_permission');
          granted = perm === 'granted';
        }
        if (granted) {
          await plugin('notification', 'notify', { options: { title, body } });
        }
      } catch (e) { console.warn('[OmniHub] Notification:', e); }
    },

    // ── TMDB ─────────────────────────────────────────────────────────
    searchTmdb:            (q)     => invoke('search_tmdb', { query: q }),
    getTrending:           ()      => invoke('get_trending'),
    getNewReleases:        ()      => invoke('get_new_releases'),
    getUpcoming:           (page)  => invoke('get_upcoming', { page: page || 1 }),
    getStreamingProviders: (opts)  => invoke('get_streaming_providers', opts),
    getTmdbDetail:         (opts)  => invoke('get_tmdb_detail', opts),
    getWatchlistReleases:  (items) => invoke('get_watchlist_releases', { items }),

    // ── System ───────────────────────────────────────────────────────
    openExternal:    (url)         => invoke('open_external', { url }),
    getAppVersion:   ()            => invoke('get_app_version'),
    checkOnline:     ()            => invoke('check_online'),
    getSystemTheme:  ()            => invoke('get_system_theme'),
    pickImage:       ()            => invoke('pick_image'),

    // ── Window-Controls ──────────────────────────────────────────────
    minimize:  () => win.minimize(),
    maximize:  () => win.toggleMaximize(),
    close:     () => win.close(),

    setFullscreen: async (on) => {
      try { await win.setFullscreen(on); await emit('fullscreen-changed', on); }
      catch (e) { console.warn('[OmniHub] setFullscreen:', e); }
    },
    isFullscreen: async () => {
      try { return await win.isFullscreen(); } catch { return false; }
    },

    openSecondWindow: async (opts) => {
      try {
        const { WebviewWindow } = window.__TAURI__.webviewWindow;
        new WebviewWindow('secondary_' + Date.now(), {
          url: (opts && opts.url) || 'about:blank',
          title: (opts && opts.title) || 'OmniHub',
          width: 1280, height: 800, center: true, decorations: true,
        });
      } catch (e) { console.warn('[OmniHub] openSecondWindow:', e); }
    },

    // ── Session-Isolation (Rust-Backend) ─────────────────────────────
    getPartitionName:    (pid, prov)     => invoke('get_partition_name',    { profileId: pid, providerId: prov }),
    setSessionActive:    (pid, prov, on) => invoke('set_session_active',    { profileId: pid, providerId: prov, active: on }),
    getActiveSessions:   (pid)           => invoke('get_active_sessions',   { profileId: pid }),
    clearProviderSession:(pid, prov)     => invoke('clear_provider_session',{ profileId: pid, providerId: prov }),
    clearAllSessions:    (pid)           => invoke('clear_all_sessions',    { profileId: pid }),
    refreshSessionsNow:  ()              => Promise.resolve(),
    setupWebviewSession: ()              => Promise.resolve(),
    getAllSessions:      (pid)           => window.electronAPI.getActiveSessions(pid),
    clearProvidersSessions: (pid, ids)   => Promise.all((ids || []).map(id =>
                                              window.electronAPI.clearProviderSession(pid, id))),

    // ── Events ───────────────────────────────────────────────────────
    onUpdateAvailable:       (cb) => listen('update-available',         e => cb(e.payload)),
    onUpdateNotAvailable:    (cb) => listen('update-not-available',     () => cb()),
    onUpdateDownloaded:      (cb) => listen('update-downloaded',        () => cb()),
    onUpdateDownloadProgress:(cb) => listen('update-download-progress', e => cb(e.payload)),
    onUpdateError:           (cb) => listen('update-error',             e => cb(e.payload)),
    onSystemThemeChanged:    (cb) => listen('system-theme-changed',     e => cb(e.payload)),
    onSessionsUpdated:       (cb) => listen('sessions-updated',         e => cb(e.payload)),
    onFullscreenChange:      (cb) => listen('fullscreen-changed',       e => cb(e.payload)),
    onCrashLogFound:         (cb) => listen('crash-log-found',          e => cb(e.payload)),

    // ── Updater (via Plugin-Invoke) ──────────────────────────────────
    checkForUpdates: async () => {
      try {
        const update = await plugin('updater', 'check');
        if (update && update.available) await emit('update-available', { version: update.version });
        else await emit('update-not-available', null);
      } catch (e) { await emit('update-error', String(e)); }
    },
    downloadUpdate: async () => {
      // Voller Download/Install-Flow braucht Update-Handle → über Rust-Updater beim Start
      try { await plugin('updater', 'download_and_install'); await emit('update-downloaded', null); }
      catch (e) { await emit('update-error', String(e)); }
    },
    installUpdate: async () => {
      try { await win.close(); } catch { /* App-Neustart manuell */ }
    },

    // ── WideVine (Edge WebView eingebaut) ────────────────────────────
    getWidevineStatus: async () => ({
      installed: true, dllExists: true, sigExists: true, manifestExists: true,
      version: 'Edge WebView (eingebaut)', cdmDir: 'Edge WebView – kein Setup nötig', isBuiltIn: true,
    }),

    // ── Stubs ────────────────────────────────────────────────────────
    exportSettings:        async () => ({ ok: false }),
    importSettings:        async () => ({ ok: false }),
    openGoogleAuthBrowser: ()       => Promise.resolve(),
    clearCrashLog:         ()       => Promise.resolve(),
    getExtraAdDomains:     ()       => Promise.resolve([]),
    fetchAdblockList:      ()       => Promise.resolve({ ok: false, domains: [] }),
    applyExtraAdDomains:   ()       => Promise.resolve(),
  };

  console.log('[OmniHub] Tauri Bridge v0.3.5 geladen ✓ (window.__TAURI__)');
})();
