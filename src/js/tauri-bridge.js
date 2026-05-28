// ═══════════════════════════════════════════════════════════════════
// OmniHub – Tauri API Bridge  v0.3.0
// Session-Isolation + Splash-Done + alle v0.2.0 Methoden
// ═══════════════════════════════════════════════════════════════════

import { invoke }              from '@tauri-apps/api/core';
import { emit, listen }        from '@tauri-apps/api/event';
import { getCurrentWindow }    from '@tauri-apps/api/window';

const appWindow = getCurrentWindow();

window.electronAPI = {

  // ── Settings ──────────────────────────────────────────────────────
  getSettings:            ()          => invoke('get_settings'),
  setSettings:            (s)         => invoke('set_settings', { settings: s }),
  getTheme:               ()          => invoke('get_theme'),
  setTheme:               (t)         => invoke('set_theme', { theme: t }),
  setThemeSource:         (t)         => invoke('set_theme', { theme: t }),

  // ── Profile ───────────────────────────────────────────────────────
  getProfiles:            ()          => invoke('get_profiles'),
  setProfiles:            (p)         => invoke('set_profiles', { profiles: p }),
  getActiveProfile:       ()          => invoke('get_active_profile'),
  setActiveProfile:       (id)        => invoke('set_active_profile', { profileId: id }),
  hashPin:                (pin)       => invoke('hash_pin', { pin }),
  verifyPin:              (pin, hash) => invoke('verify_pin', { pin, hash }),

  // ── Streaming & Stats ─────────────────────────────────────────────
  getStreamStats:         (pid)       => invoke('get_stream_stats', { profileId: pid }),
  setStreamStats:         (pid, s)    => invoke('set_stream_stats', { profileId: pid, stats: s }),
  getWatchedContent:      (pid)       => invoke('get_watched_content', { profileId: pid }),
  setWatchedContent:      (pid, c)    => invoke('set_watched_content', { profileId: pid, content: c }),
  recordWatchTime:        (id, secs, pid) =>
                            invoke('record_watch_time', { providerId: id, seconds: secs, profileId: pid }),

  // ── Achievements ──────────────────────────────────────────────────
  getAchievements:        (pid)       => invoke('get_achievements', { profileId: pid }),
  setAchievements:        (pid, l)    => invoke('set_achievements', { profileId: pid, list: l }),
  getAchievementMeta:     (pid)       => invoke('get_achievement_meta', { profileId: pid }),
  setAchievementMeta:     (pid, m)    => invoke('set_achievement_meta', { profileId: pid, meta: m }),

  // ── Notifications ─────────────────────────────────────────────────
  getNotifications:       (pid)       => invoke('get_notifications', { profileId: pid }),
  setNotifications:       (pid, n)    => invoke('set_notifications', { profileId: pid, notifs: n }),
  showNotification: async (title, body) => {
    try {
      const { isPermissionGranted, requestPermission, sendNotification } =
        await import('@tauri-apps/plugin-notification');
      let ok = await isPermissionGranted();
      if (!ok) { const p = await requestPermission(); ok = p === 'granted'; }
      if (ok) sendNotification({ title, body });
    } catch { /* optional */ }
  },

  // ── TMDB ──────────────────────────────────────────────────────────
  searchTmdb:             (q)         => invoke('search_tmdb', { query: q }),
  getTrending:            ()          => invoke('get_trending'),
  getNewReleases:         ()          => invoke('get_new_releases'),
  getUpcoming:            (page)      => invoke('get_upcoming', { page: page || 1 }),
  getStreamingProviders:  (opts)      => invoke('get_streaming_providers', opts),
  getTmdbDetail:          (opts)      => invoke('get_tmdb_detail', opts),
  getWatchlistReleases:   (items)     => invoke('get_watchlist_releases', { items }),

  // ── System ────────────────────────────────────────────────────────
  openExternal:           (url)       => invoke('open_external', { url }),
  getAppVersion:          ()          => invoke('get_app_version'),
  checkOnline:            ()          => invoke('check_online'),
  getSystemTheme:         ()          => invoke('get_system_theme'),
  pickImage:              ()          => invoke('pick_image'),

  // ── Window ────────────────────────────────────────────────────────
  minimize:               ()          => appWindow.minimize(),
  maximize:               ()          => appWindow.toggleMaximize(),
  close:                  ()          => appWindow.close(),

  setFullscreen: async (on) => {
    try { await appWindow.setFullscreen(on); await emit('fullscreen-changed', on); }
    catch (e) { console.warn('[OmniHub] setFullscreen:', e); }
  },
  isFullscreen: async () => {
    try { return await appWindow.isFullscreen(); } catch { return false; }
  },

  openSecondWindow: async (opts) => {
    try {
      const { WebviewWindow } = await import('@tauri-apps/api/webviewWindow');
      new WebviewWindow('secondary_' + Date.now(), {
        url: opts.url || 'about:blank',
        title: opts.title || 'OmniHub',
        width: 1280, height: 800, center: true, decorations: true,
      });
    } catch (e) { console.warn('[OmniHub] openSecondWindow:', e); }
  },

  // ── Splash ────────────────────────────────────────────────────────
  splashDone: () => invoke('splash_done'),

  // ── Session-Isolation (v0.3.0 – echter Rust-Backend) ─────────────
  getPartitionName:   (pid, provId)      => invoke('get_partition_name',    { profileId: pid, providerId: provId }),
  setSessionActive:   (pid, provId, on)  => invoke('set_session_active',    { profileId: pid, providerId: provId, active: on }),
  getActiveSessions:  (pid)              => invoke('get_active_sessions',   { profileId: pid }),
  clearProviderSession:(pid, provId)     => invoke('clear_provider_session', { profileId: pid, providerId: provId }),
  clearAllSessions:   (pid)              => invoke('clear_all_sessions',    { profileId: pid }),
  // Stubs für Kompatibilität
  refreshSessionsNow:     (pid)          => Promise.resolve(),
  setupWebviewSession:    (partition)    => Promise.resolve(),
  getAllSessions:          (pid)         => window.electronAPI.getActiveSessions(pid),
  clearProvidersSessions: (pid, ids)    => Promise.all((ids||[]).map(id =>
                                            window.electronAPI.clearProviderSession(pid, id))),

  // ── Events ────────────────────────────────────────────────────────
  onUpdateAvailable:      (cb) => listen('update-available',           e => cb(e.payload)),
  onUpdateNotAvailable:   (cb) => listen('update-not-available',       () => cb()),
  onUpdateDownloaded:     (cb) => listen('update-downloaded',          () => cb()),
  onUpdateDownloadProgress:(cb)=> listen('update-download-progress',   e => cb(e.payload)),
  onUpdateError:          (cb) => listen('update-error',               e => cb(e.payload)),
  onSystemThemeChanged:   (cb) => listen('system-theme-changed',       e => cb(e.payload)),
  onSessionsUpdated:      (cb) => listen('sessions-updated',           e => cb(e.payload)),
  onFullscreenChange:     (cb) => listen('fullscreen-changed',         e => cb(e.payload)),
  onCrashLogFound:        (cb) => listen('crash-log-found',            e => cb(e.payload)),

  // ── Updater ───────────────────────────────────────────────────────
  checkForUpdates: async () => {
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update) await emit('update-available', { version: update.version });
      else await emit('update-not-available', null);
    } catch (e) { await emit('update-error', String(e)); }
  },

  downloadUpdate: async () => {
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (!update) return;
      let downloaded = 0, total = 0;
      await update.downloadAndInstall(ev => {
        if (ev.event === 'Started')   { total = ev.data?.contentLength || 0; }
        if (ev.event === 'Progress')  { downloaded += ev.data?.chunkLength || 0; if (total > 0) emit('update-download-progress', Math.round(downloaded/total*100)); }
        if (ev.event === 'Finished')  { emit('update-downloaded', null); }
      });
    } catch (e) { await emit('update-error', String(e)); }
  },

  installUpdate: async () => {
    try { const { relaunch } = await import('@tauri-apps/plugin-process'); await relaunch(); }
    catch { /* silent */ }
  },

  // ── WideVine (Edge WebView eingebaut) ─────────────────────────────
  getWidevineStatus: async () => ({
    installed: true, dllExists: true, sigExists: true, manifestExists: true,
    version: 'Edge WebView (eingebaut)', cdmDir: 'Edge WebView – kein Setup nötig', isBuiltIn: true,
  }),

  // ── Stubs ─────────────────────────────────────────────────────────
  exportSettings:         async () => ({ ok: false }),
  importSettings:         async () => ({ ok: false }),
  openGoogleAuthBrowser:  ()     => Promise.resolve(),
  clearCrashLog:          ()     => Promise.resolve(),
  getExtraAdDomains:      ()     => Promise.resolve([]),
  fetchAdblockList:       ()     => Promise.resolve({ ok: false, domains: [] }),
  applyExtraAdDomains:    ()     => Promise.resolve(),
};

console.log('[OmniHub] Tauri Bridge v0.3.0 geladen ✓');
