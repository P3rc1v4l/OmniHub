// ═══ OmniHub v0.3.0 – Patches ═══

// ════════════════════════════════════════════════════════════════════
// OmniHub v0.2.0 – Patches
// ════════════════════════════════════════════════════════════════════

// ── 1. Fehlende Definitionen ─────────────────────────────────────────

// ACH_CATS war in OmniSight als separate Variable, hier nachdefinieren
if (typeof ACH_CATS === 'undefined') {
  var ACH_CATS = {
    stream:   { de: '⏱ Streamzeit',   en: 'Stream Time' },
    provider: { de: '📺 Anbieter',     en: 'Providers'   },
    special:  { de: '⭐ Besonderes',   en: 'Special'     },
    hidden:   { de: '🔒 Versteckt',    en: 'Hidden'      },
  };
}

// achName: holt lokalisierten Achievement-Namen
if (typeof achName === 'undefined') {
  window.achName = function(a) {
    const l = (typeof lang !== 'undefined') ? lang : 'de';
    return a.name[l] || a.name.de || a.id;
  };
}

// tot(): Alias für _tot() (war in OmniSight separat)
if (typeof tot === 'undefined') {
  window.tot = function(stats) {
    return typeof _tot === 'function' ? _tot(stats) : 0;
  };
}

// ── 2. Version-Chip korrekt setzen ───────────────────────────────────

(function fixVersionChip() {
  setTimeout(async () => {
    try {
      const version = await window.electronAPI.getAppVersion();
      window.__appVersion = version;
      const chip = document.getElementById('version-chip');
      if (chip) {
        chip.innerHTML = 'OMNI<span class="accent">HUB</span>';
        chip.title = 'OmniHub v' + version;
      }
      // Versionsanzeige in Settings
      document.querySelectorAll('[data-version], .settings-version').forEach(el => {
        el.textContent = 'v' + version;
      });
      // Statische v0.1.0 Texte ersetzen
      document.querySelectorAll('*').forEach(el => {
        if (el.children.length === 0 && el.textContent === 'v0.1.0') {
          el.textContent = 'v' + version;
        }
      });
    } catch (e) {
      console.warn('[OmniHub] Version-Chip:', e);
    }
  }, 500);
})();

// ── 3. Discord-Button in Einstellungen ───────────────────────────────

const DISCORD_URL = 'https://discord.gg/tnfgta33uj';

(function setupDiscordButton() {
  setTimeout(() => {
    // Alle discord-buttons verdrahten
    document.querySelectorAll('#btn-open-discord, [data-discord-btn]').forEach(btn => {
      if (btn._discordBound) return;
      btn._discordBound = true;
      btn.addEventListener('click', () => {
        window.electronAPI.openExternal(DISCORD_URL);
      });
    });

    // Feedback-Buttons
    document.querySelectorAll('#btn-open-feedback, [data-feedback-btn]').forEach(btn => {
      if (btn._feedbackBound) return;
      btn._feedbackBound = true;
      btn.addEventListener('click', () => {
        if (typeof openFeedbackModal === 'function') openFeedbackModal();
      });
    });

    // Discord-Link in Feedback-Modal updaten
    const fbDiscord = document.getElementById('fb-discord-btn');
    if (fbDiscord && !fbDiscord._discordBound) {
      fbDiscord._discordBound = true;
      fbDiscord.addEventListener('click', () => {
        window.electronAPI.openExternal(DISCORD_URL);
      });
    }
  }, 1000);
})();

// ── 4. Feedback-Modal: URL auf OmniHub Issues ────────────────────────

// openFeedbackModal überschreiben: Issue-URL auf OmniHub
const _origFeedback = typeof openFeedbackModal === 'function' ? openFeedbackModal : null;
window.openFeedbackModal = function() {
  if (_origFeedback) {
    _origFeedback();
    // Nach dem Rendern: Submit-Button URL updaten
    setTimeout(() => {
      const submitBtn = document.getElementById('fb-submit-btn');
      if (submitBtn && !submitBtn._hubFixed) {
        submitBtn._hubFixed = true;
        const orig = submitBtn.onclick || null;
        submitBtn.addEventListener('click', () => {
          const category = document.getElementById('fb-category')?.value || 'other';
          const title    = document.getElementById('fb-title')?.value?.trim();
          const text     = document.getElementById('fb-text')?.value?.trim();
          const version  = window.__appVersion || '0.2.0';
          if (!title || !text) return; // Validation läuft bereits im Original
          const body = encodeURIComponent(
            `**Kategorie:** ${category}\n**Version:** v${version}\n**OS:** Windows\n\n**Beschreibung:**\n${text}`
          );
          const titleEnc = encodeURIComponent(`[Feedback] ${title}`);
          const url = `https://github.com/P3rc1v4l/OmniHub/issues/new?title=${titleEnc}&body=${body}&labels=feedback`;
          window.electronAPI.openExternal(url);
        }, { once: true });
      }

      // Discord-Button
      const discordBtn = document.getElementById('fb-discord-btn');
      if (discordBtn && !discordBtn._discordBound) {
        discordBtn._discordBound = true;
        discordBtn.addEventListener('click', () => {
          window.electronAPI.openExternal(DISCORD_URL);
        });
      }
    }, 100);
  }
};

// ── 5. Settings "Mehr"-Tab: Discord-Karte einfügen ──────────────────

(function injectDiscordCard() {
  setTimeout(() => {
    const advTab = document.getElementById('smt-advanced');
    if (!advTab || advTab.querySelector('#discord-card')) return;

    const grid = advTab.querySelector('.smt-grid');
    if (!grid) return;

    // Discord-Karte ganz oben einfügen
    const card = document.createElement('div');
    card.id = 'discord-card';
    card.className = 'smt-card smt-full';
    card.style.cssText = 'background:linear-gradient(135deg,rgba(88,101,242,.15),rgba(88,101,242,.05));border-color:rgba(88,101,242,.3)';
    card.innerHTML = `
      <div class="smt-card-label" style="display:flex;align-items:center;gap:8px">
        <svg width="18" height="14" viewBox="0 0 71 55" fill="#5865F2">
          <path d="M60.1 4.9A58.6 58.6 0 0 0 45.7.7a41 41 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.3 0A38.5 38.5 0 0 0 25.8.7 58.4 58.4 0 0 0 11.3 5C1.6 19.3-1 33.2.3 46.9A58.8 58.8 0 0 0 18.1 55c1.4-2 2.7-4 3.8-6.2-2-.8-4-1.7-5.8-2.8l1.4-1.1A41.8 41.8 0 0 0 35.5 49a41.8 41.8 0 0 0 18-4.1l1.4 1.1a38 38 0 0 1-5.8 2.9c1.1 2.1 2.4 4.2 3.8 6.1A58.7 58.7 0 0 0 70.7 47C72.2 31 68.1 17.2 60.1 4.9ZM23.8 38.4c-3.5 0-6.4-3.3-6.4-7.3s2.8-7.3 6.4-7.3 6.5 3.3 6.4 7.3c0 4-2.9 7.3-6.4 7.3Zm23.4 0c-3.5 0-6.4-3.3-6.4-7.3s2.8-7.3 6.4-7.3 6.5 3.3 6.4 7.3c0 4-2.9 7.3-6.4 7.3Z"/>
        </svg>
        Discord – Feedback & Support
      </div>
      <p style="font-size:12px;color:var(--tx2);margin:6px 0 10px;line-height:1.5">
        Tritt unserem Discord-Server bei für Feedback, Feature-Requests und Support-Anfragen.
      </p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button id="btn-open-discord" class="pick-btn"
          style="background:rgba(88,101,242,.15);border-color:rgba(88,101,242,.4);color:#5865F2;font-weight:700;display:flex;align-items:center;gap:6px">
          <svg width="14" height="11" viewBox="0 0 71 55" fill="currentColor">
            <path d="M60.1 4.9A58.6 58.6 0 0 0 45.7.7a41 41 0 0 0-1.8 3.7 54.2 54.2 0 0 0-16.3 0A38.5 38.5 0 0 0 25.8.7 58.4 58.4 0 0 0 11.3 5C1.6 19.3-1 33.2.3 46.9A58.8 58.8 0 0 0 18.1 55c1.4-2 2.7-4 3.8-6.2-2-.8-4-1.7-5.8-2.8l1.4-1.1A41.8 41.8 0 0 0 35.5 49a41.8 41.8 0 0 0 18-4.1l1.4 1.1a38 38 0 0 1-5.8 2.9c1.1 2.1 2.4 4.2 3.8 6.1A58.7 58.7 0 0 0 70.7 47C72.2 31 68.1 17.2 60.1 4.9ZM23.8 38.4c-3.5 0-6.4-3.3-6.4-7.3s2.8-7.3 6.4-7.3 6.5 3.3 6.4 7.3c0 4-2.9 7.3-6.4 7.3Zm23.4 0c-3.5 0-6.4-3.3-6.4-7.3s2.8-7.3 6.4-7.3 6.5 3.3 6.4 7.3c0 4-2.9 7.3-6.4 7.3Z"/>
          </svg>
          Discord beitreten
        </button>
        <button id="btn-open-feedback" class="pick-btn"
          style="display:flex;align-items:center;gap:6px">
          💬 Feedback senden
        </button>
      </div>`;

    // Als erste Karte einfügen
    grid.insertBefore(card, grid.firstChild);

    // Direkt verdrahten
    document.getElementById('btn-open-discord')?.addEventListener('click', () => {
      window.electronAPI.openExternal(DISCORD_URL);
    });
    document.getElementById('btn-open-feedback')?.addEventListener('click', () => {
      if (typeof openFeedbackModal === 'function') openFeedbackModal();
    });
  }, 800);
})();

// ── 6. buildCategoryFilterBar bei init aufrufen ──────────────────────

const _origInit = typeof init === 'function' ? init : null;
if (_origInit) {
  window.init = async function() {
    await _origInit();
    // Nach init: Kategorie-Filter aufbauen
    if (typeof buildCategoryFilterBar === 'function') {
      buildCategoryFilterBar();
    }
  };
}

// ── 7. Onboarding: Provider-Grid füllen ─────────────────────────────

const _origShowOnboarding = typeof showOnboarding === 'function' ? showOnboarding : null;
if (_origShowOnboarding) {
  window.showOnboarding = function(force) {
    _origShowOnboarding(force);
    setTimeout(() => {
      const grid = document.getElementById('ob-provider-grid');
      if (!grid || grid.children.length > 0) return;
      Object.entries(PROVIDERS_BASE).forEach(([id, p]) => {
        const isSelected = !(settings.deletedProviders||[]).includes(id);
        const item = document.createElement('label');
        item.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bgc);border:1px solid var(--bor);border-radius:var(--r-sm);cursor:pointer;transition:all .15s';
        item.innerHTML = `
          <input type="checkbox" class="ob-prov-check" data-id="${id}" ${isSelected ? 'checked' : ''}
            style="accent-color:var(--acc);width:14px;height:14px;flex-shrink:0"/>
          <img src="${getFavicon(id, p)}" style="width:20px;height:20px;border-radius:4px;object-fit:contain"
            onerror="this.style.display='none'"/>
          <span style="font-size:12px;font-weight:600;color:var(--tx);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.name}</span>`;
        item.addEventListener('mouseenter', () => { item.style.borderColor = 'var(--acc)'; });
        item.addEventListener('mouseleave', () => { item.style.borderColor = ''; });
        grid.appendChild(item);
      });
    }, 200);
  };
}

// ── 8. Notifications: eigene Tab-Einstellungen verdrahten ────────────

(function setupNotifToggles() {
  setTimeout(() => {
    const ids = [
      'notif-stream-break',
      'notif-sound',
      'notif-updates',
      'notif-achievements',
      'notif-watchlist',
    ];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el || el._notifBound) return;
      el._notifBound = true;
      const key = id.replace('notif-', '');
      el.checked = settings.notificationsConfig?.[key] !== false;
      el.addEventListener('change', () => {
        settings.notificationsConfig = settings.notificationsConfig || {};
        settings.notificationsConfig[key] = el.checked;
        autoSave();
      });
    });
  }, 900);
})();

// ── 9. VPN-Check Funktionalität ──────────────────────────────────────

(function setupVpnCheck() {
  setTimeout(() => {
    const btn = document.getElementById('btn-check-vpn');
    if (!btn || btn._vpnBound) return;
    btn._vpnBound = true;
    btn.addEventListener('click', async () => {
      const status = document.getElementById('vpn-status');
      if (status) { status.textContent = '🔍 Prüfe…'; status.style.color = 'var(--tx2)'; }
      try {
        const online = await window.electronAPI.checkOnline();
        if (!online) {
          if (status) { status.textContent = '⚠ Keine Internetverbindung'; status.style.color = 'var(--danger)'; }
          return;
        }
        const resp = await fetch('https://ipapi.co/json/');
        const data = await resp.json();
        if (status) {
          status.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
              <span style="color:var(--acc)">✓ IP-Info geladen</span>
              <span style="color:var(--tx2);font-size:11px">IP: ${data.ip} · Land: ${data.country_name || '?'} · ISP: ${data.org || '?'}</span>
            </div>`;
        }
      } catch (e) {
        if (status) { status.textContent = 'Fehler beim VPN-Check'; status.style.color = 'var(--danger)'; }
      }
    });

    // Gespeicherte VPN-Einträge anzeigen
    const renderVpnList = () => {
      const list = document.getElementById('vpn-list');
      if (!list) return;
      const vpns = settings.vpnList || [];
      list.innerHTML = vpns.length ? vpns.map((v, i) => `
        <div style="display:flex;align-items:center;gap:8px;padding:5px 8px;background:var(--bgc);border:1px solid var(--bor);border-radius:var(--r-sm);margin-bottom:4px">
          <span style="font-size:12px;font-weight:600;color:var(--tx);flex:1">${v.name}</span>
          <span style="font-size:11px;color:var(--tx2)">${v.host}</span>
          <button onclick="settings.vpnList.splice(${i},1);autoSave();renderVpnList?.()" 
            style="background:transparent;border:none;color:var(--danger);cursor:pointer;font-size:14px">✕</button>
        </div>`).join('') : '<div style="font-size:12px;color:var(--tx3)">Keine VPN-Einträge</div>';
    };
    window.renderVpnList = renderVpnList;

    const saveBtn = document.getElementById('btn-vpn-save');
    if (saveBtn && !saveBtn._vpnSaveBound) {
      saveBtn._vpnSaveBound = true;
      saveBtn.addEventListener('click', () => {
        const name = document.getElementById('vpn-name-input')?.value?.trim();
        const host = document.getElementById('vpn-host-input')?.value?.trim();
        if (!name || !host) { showToastMsg('Name und Host erforderlich'); return; }
        settings.vpnList = settings.vpnList || [];
        settings.vpnList.push({ name, host });
        autoSave();
        renderVpnList();
        if (document.getElementById('vpn-name-input')) document.getElementById('vpn-name-input').value = '';
        if (document.getElementById('vpn-host-input')) document.getElementById('vpn-host-input').value = '';
        showToastMsg('VPN gespeichert');
      });
    }
    renderVpnList();
  }, 1000);
})();

// ── 10. recordWatchTime korrekt aufrufen ─────────────────────────────

// startWatchTimer überschreiben um recordWatchTime zu nutzen
window.startWatchTimer = function(id) {
  if (typeof stopWatchTimer === 'function') stopWatchTimer();
  window.watchTimeTimer = setInterval(async () => {
    try {
      await window.electronAPI.recordWatchTime(id, 60, activeProfileId);
    } catch { /* silent */ }
    if (typeof checkAchievements === 'function') checkAchievements(null);
  }, 60000);
};

console.log('[OmniHub v0.2.0] Patches geladen ✓');

// ════════════════════════════════════════════════════════════════════
// v0.3.0 Patches – Session-Isolation + Splash
// ════════════════════════════════════════════════════════════════════

// ── 1. getProfilePartition: Rust-Command statt String-Concat ─────────

window.getProfilePartition = function(providerId) {
  // Synchron: gibt berechneten Partition-String zurück (kein async nötig)
  const pid = (typeof activeProfileId !== 'undefined') ? activeProfileId : 'default';
  return `persist:${pid}_${providerId}`;
};

// ── 2. Session-Tracking: Provider einloggen/ausloggen tracken ────────

// Wenn ein Provider geöffnet wird, Session als aktiv markieren
const _origOpenProvider = typeof openProvider === 'function' ? openProvider : null;
if (_origOpenProvider) {
  window.openProvider = function(id) {
    _origOpenProvider.call(this, id);
    // Session als aktiv markieren (fire-and-forget)
    const pid = (typeof activeProfileId !== 'undefined') ? activeProfileId : 'default';
    window.electronAPI.setSessionActive(pid, id, true).catch(() => {});
  };
}

// Beim Abmelden Session als inaktiv markieren
const _origStopStream = typeof stopStream === 'function' ? stopStream : null;
if (_origStopStream) {
  window.stopStream = function() {
    if (typeof currentProvider !== 'undefined' && currentProvider) {
      const pid = (typeof activeProfileId !== 'undefined') ? activeProfileId : 'default';
      window.electronAPI.setSessionActive(pid, currentProvider, false).catch(() => {});
    }
    _origStopStream.call(this);
  };
}

// startSessionAutoRefresh: nutzt jetzt echten Rust-Befehl
window.startSessionAutoRefresh = function() {
  clearInterval(window._sessionRefreshTimer);
  window._sessionRefreshTimer = setInterval(async () => {
    const pid = (typeof activeProfileId !== 'undefined') ? activeProfileId : 'default';
    try {
      const sessions = await window.electronAPI.getActiveSessions(pid);
      if (typeof window.electronAPI.onSessionsUpdated !== 'function') return;
      // Sessions-Updated Event simulieren für Card-Dots
      const event = new CustomEvent('_omnihub_sessions', { detail: sessions });
      document.dispatchEvent(event);
    } catch { /* silent */ }
  }, 30000); // alle 30s
};

// Session-Dots aktualisieren
document.addEventListener('_omnihub_sessions', e => {
  const sessions = e.detail || {};
  document.querySelectorAll('.provider-card').forEach(card => {
    const id = card.dataset.id;
    if (!id) return;
    let dot = card.querySelector('.card-session-dot');
    if (sessions[id]) {
      if (!dot) {
        dot = document.createElement('div');
        dot.className = 'card-session-dot';
        card.appendChild(dot);
      }
    } else {
      dot?.remove();
    }
  });
});

// ── 3. Version v0.3.0 ────────────────────────────────────────────────

(function setVersion030() {
  setTimeout(async () => {
    try {
      const v = await window.electronAPI.getAppVersion();
      window.__appVersion = v;
      document.querySelectorAll('.settings-version, [data-version]').forEach(el => {
        el.textContent = 'v' + v;
      });
      const chip = document.getElementById('version-chip');
      if (chip) {
        chip.innerHTML = 'OMNI<span class="accent">HUB</span>';
        chip.title = 'OmniHub v' + v;
      }
    } catch {}
  }, 400);
})();

// ── 4. bundle.js ist nicht mehr geladen (Einzelmodule) ───────────────
// Kein cleanup nötig – bundle.js existiert noch als Fallback
// aber wird nicht mehr per <script> geladen.

console.log('[OmniHub v0.3.0] Session-Isolation + Splash-Patches geladen ✓');
