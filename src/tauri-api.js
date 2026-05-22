/**
 * OmniHub – Tauri IPC Bridge
 * Nutzt gebundelte @tauri-apps/api (TauriAPI = core, TauriEvent = event)
 */
(function () {
  'use strict';
  const inv = (cmd, args) => TauriAPI.invoke(cmd, args || {});
  const lst = (ev, cb)   => TauriEvent.listen(ev, e => cb(e.payload !== undefined ? e.payload : e));

  window.electronAPI = {
    // Fenster
    minimize:              ()    => inv('window_minimize'),
    maximize:              ()    => inv('window_maximize'),
    close:                 ()    => inv('window_close'),
    setFullscreen:         (f)   => inv('window_set_fullscreen', { fullscreen: f }),
    isFullscreen:          ()    => inv('window_is_fullscreen'),
    onFullscreenChange:    (cb)  => lst('fullscreen-change', cb),
    onSplashDone:          (cb)  => lst('splash-done', cb),
    // Updates
    onUpdateAvailable:     (cb)  => lst('update-available', cb),
    onUpdateNotAvailable:  (cb)  => lst('update-not-available', cb),
    onUpdateDownloaded:    (cb)  => lst('update-downloaded', cb),
    onUpdateError:         (cb)  => lst('update-error', cb),
    installUpdate:         ()    => inv('install_update'),
    checkForUpdates:       ()    => inv('check_for_updates'),
    // Store
    getTheme:              ()    => inv('get_theme'),
    setTheme:              (v)   => inv('set_theme', { value: v }),
    getSettings:           ()    => inv('get_settings'),
    setSettings:           (v)   => inv('set_settings', { value: v }),
    // Profile
    getProfiles:           ()    => inv('get_profiles'),
    setProfiles:           (v)   => inv('set_profiles', { value: v }),
    getActiveProfile:      ()    => inv('get_active_profile'),
    setActiveProfile:      (id)  => inv('set_active_profile', { id }),
    // Sessions
    getAllSessions:         (pid) => inv('get_all_sessions', { profileId: pid || 'default' }),
    onSessionsUpdated:     (cb)  => lst('sessions-updated', cb),
    onSessionsCleared:     (cb)  => lst('sessions-cleared', cb),
    refreshSessionsNow:    (pid) => inv('get_all_sessions', { profileId: pid || 'default' }),
    clearAllSessions:      (pid) => inv('clear_all_sessions', { profileId: pid || 'default' }),
    clearProviderSession:  (pid, prov) => inv('set_session_state', { profileId: pid, providerId: prov, loggedIn: false }),
    setSessionState:       (pid, prov, val) => inv('set_session_state', { profileId: pid, providerId: prov, loggedIn: val }),
    setupWebviewSession:   ()    => Promise.resolve(),
    getPartition:          (prov, pid) => Promise.resolve(`${pid}_${prov}`),
    // Google Auth
    onGoogleAuthDone:      (cb)  => lst('google-auth-done', cb),
    openGoogleAuthBrowser: ()    => { window.electronAPI.openExternal('https://accounts.google.com/signin?service=youtube'); return Promise.resolve(true); },
    // Stats
    recordWatchTime:       (prov, secs, pid) => inv('record_watch_time', { providerId: prov, seconds: secs, profileId: pid }),
    getStreamStats:        (pid) => inv('get_stream_stats', { profileId: pid || 'default' }),
    // VPN
    checkVpn:              ()    => inv('check_vpn'),
    // TMDB
    getTrending:           ()    => inv('get_trending'),
    getNewReleases:        ()    => inv('get_new_releases'),
    getUpcoming:           (m)   => inv('get_upcoming', { months: m || 1 }),
    getTmdbDetail:         (p)   => inv('get_tmdb_detail', { payload: p }),
    searchTmdb:            (p)   => inv('search_tmdb', { payload: p }),
    getStreamingProviders: (p)   => inv('get_streaming_providers', { payload: p }),
    findByImdb:            (id)  => inv('find_by_imdb', { imdbId: id }),
    // AdBlock
    fetchAdblockList:      (url) => inv('fetch_adblock_list', { url }),
    applyExtraAdDomains:   (d)   => inv('apply_extra_ad_domains', { domains: d }),
    getExtraAdDomains:     ()    => inv('get_extra_ad_domains'),
    // Netzwerk
    checkUrl:              (url) => inv('check_url', { url }),
    checkOnline:           ()    => inv('check_online'),
    // Sonstiges
    openExternal:          (url) => inv('open_external', { url }),
    openSecondWindow:      (p)   => inv('open_second_window', { payload: p }),
    showNotification:      (t,b) => inv('show_notification', { title: t, body: b }),
    pickImage:             (d)   => inv('pick_image', { dest: d }),
    getWidevineStatus:     ()    => Promise.resolve({ installed: false }),
  };

  // Titlebar-Dragging
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('titlebar')?.addEventListener('mousedown', e => {
      if (e.button === 0 && !e.target.closest('button,input,select,a')) {
        inv('window_start_dragging').catch(() => {});
      }
    });
  });
})();
