// ═══ OmniHub v0.3.0 – fixes.js ═══
// Aus bundle.js extrahiert

// OmniHub – fixes.js
// Enthält nur aktive, nicht-redundante Patches
// Alte v3.1.x Patches wurden in die Modul-Dateien überführt

// ════════════════════════════════════════════════════════════════════
// TEIL 1: GRUNDLEGENDE FEHLENDE FUNKTIONEN (müssen früh definiert sein)
// ════════════════════════════════════════════════════════════════════

function getProviderCategory(id) {
  if (typeof settings !== 'undefined' && settings.providerCategories?.[id])
    return settings.providerCategories[id];
  return PROVIDER_CAT_MAP[id] || 'video';
}

function updateCategoryFilter(active) {
  document.querySelectorAll('.cat-filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.cat === active));
}

// ════════════════════════════════════════════════════════════════════
// TEIL 2: SUCHE – sauber, ohne Selbstrekursion
// ════════════════════════════════════════════════════════════════════

function setupSearch() {
  const input    = document.getElementById('search-input');
  const dd       = document.getElementById('search-dropdown');
  const clearBtn = document.getElementById('search-clear');
  if (!input || !dd) return;

  input.placeholder = (typeof t === 'function' ? t('searchPlaceholder') : null)
    || 'Anbieter, Film, Serie, YouTube-URL…';

  let _timer = null;
  let _abort = null;

  function closeSearch() { dd.style.display = 'none'; }

  function doSearch(q) {
    if (!q || !q.trim()) {
      if (typeof searchHistory !== 'undefined' && searchHistory.length)
        renderSearchHistory(dd);
      else closeSearch();
      return;
    }
    if (_abort) { try { _abort.abort(); } catch {} }
    _abort = new AbortController();
    clearTimeout(_timer);
    _timer = setTimeout(() => runTmdbSearch(q.trim(), 1, _abort.signal), 280);
  }

  // Sauber: Input neu klonen
  const fresh = input.cloneNode(true);
  input.parentNode.replaceChild(fresh, input);

  if (clearBtn) clearBtn.style.display = 'none';

  fresh.addEventListener('input', () => {
    const q = fresh.value;
    if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';
    doSearch(q);
  });
  fresh.addEventListener('focus', () => {
    const q = fresh.value.trim();
    if (q) doSearch(q);
    else if (typeof searchHistory !== 'undefined' && searchHistory.length)
      renderSearchHistory(dd);
  });
  fresh.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSearch(); fresh.blur(); }
    if (e.key === 'Enter' && fresh.value.trim())
      if (typeof addToSearchHistory === 'function') addToSearchHistory(fresh.value.trim());
  });

  if (clearBtn) {
    const newClear = clearBtn.cloneNode(true);
    clearBtn.parentNode.replaceChild(newClear, clearBtn);
    newClear.addEventListener('click', () => {
      fresh.value = '';
      newClear.style.display = 'none';
      dd.innerHTML = '';
      closeSearch();
      if (_abort) try { _abort.abort(); } catch {}
      clearTimeout(_timer);
      fresh.focus();
    });
  }

  // Außen-Klick schließt – capture phase
  document.addEventListener('mousedown', e => {
    const wrap = fresh.closest('.search-bar') ||
                 fresh.closest('.home-actions') ||
                 fresh.parentElement;
    if (wrap && !wrap.contains(e.target) && !dd.contains(e.target))
      closeSearch();
  }, true);

  document.querySelectorAll('[data-view]').forEach(btn =>
    btn.addEventListener('click', closeSearch));
}

// ════════════════════════════════════════════════════════════════════
// TEIL 3: PROFIL-EDITOR – vollständig implementiert
// ════════════════════════════════════════════════════════════════════

function setupProfileEditor() {
  const overlay = document.getElementById('profile-editor-overlay');
  if (!overlay || overlay._setupDone) return;
  overlay._setupDone = true;

  // Außen-Klick schließt
  overlay.addEventListener('mousedown', e => {
    if (e.target === overlay) overlay.style.display = 'none';
  });

  // SPEICHERN
  document.getElementById('ped-save')?.addEventListener('click', async () => {
    const pedId = window._pedId;
    const name  = (document.getElementById('ped-name')?.value || '').trim() || 'User';
    let pinSave = undefined;

    if (window._pedPin !== undefined) {
      if (!window._pedPin) {
        pinSave = null;
      } else if (/^\d{4,8}$/.test(String(window._pedPin))) {
        try { pinSave = await window.electronAPI.hashPin(String(window._pedPin)); }
        catch  { pinSave = window._pedPin; }
      } else {
        pinSave = window._pedPin;
      }
    }

    if (pedId) {
      const idx = profiles.findIndex(p => p.id === pedId);
      if (idx >= 0) {
        profiles[idx].name = name;
        if (window._pedAvatar !== undefined) profiles[idx].avatar = window._pedAvatar;
        if (pinSave !== undefined) profiles[idx].pin = pinSave;
      }
    } else {
      profiles.push({
        id: 'profile_' + Date.now(), name,
        avatar: window._pedAvatar || null,
        pin: pinSave || null,
        favorites: [], watchlist: [], searchHistory: [], viewHistory: [],
      });
    }

    window.electronAPI.setProfiles(profiles);
    overlay.style.display = 'none';
    buildSidebarProfile();
    showSaveToast();
    window._pedId = null; window._pedPin = undefined; window._pedAvatar = undefined;
  });

  // ABBRECHEN
  document.getElementById('ped-cancel')?.addEventListener('click', () => {
    overlay.style.display = 'none';
  });

  // LÖSCHEN
  document.getElementById('ped-delete')?.addEventListener('click', async () => {
    const pedId = window._pedId;
    if (!pedId || profiles.length <= 1) {
      showToastMsg('Mindestens 1 Profil erforderlich'); return;
    }
    const profile = profiles.find(p => p.id === pedId);
    if (!profile) return;

    if (profile.pin) {
      const entered = prompt('PIN für "' + profile.name + '" eingeben:');
      if (entered === null) return;
      let valid = false;
      try { valid = await window.electronAPI.verifyPin(String(entered), profile.pin); }
      catch { valid = String(entered) === String(profile.pin); }
      if (!valid) { showToastMsg('Falscher PIN'); return; }
    }

    if (!confirm('Profil "' + profile.name + '" wirklich löschen?')) return;

    profiles = profiles.filter(p => p.id !== pedId);
    window.electronAPI.setProfiles(profiles);
    overlay.style.display = 'none';
    window._pedId = null;

    if (activeProfileId === pedId) switchProfile(profiles[0].id);
    else buildSidebarProfile();
    showToastMsg('Profil gelöscht');
  });

  // AVATAR
  document.getElementById('ped-pick-avatar')?.addEventListener('click', async () => {
    const r = await window.electronAPI.pickImage('avatar').catch(() => null);
    if (!r) return;
    const url = r.base64 || r.filePath || r;
    window._pedAvatar = url;
    const prev = document.getElementById('ped-avatar-preview');
    if (prev) prev.innerHTML = '<img src="' + url + '" style="width:56px;height:56px;border-radius:50%;object-fit:cover"/>';
  });

  // PIN
  document.getElementById('ped-set-pin')?.addEventListener('click', async () => {
    const pedId   = window._pedId;
    const profile = pedId ? profiles.find(p => p.id === pedId) : null;

    if (profile?.pin) {
      const old = prompt('Aktuellen PIN eingeben:');
      if (old === null) return;
      let valid = false;
      try { valid = await window.electronAPI.verifyPin(String(old), profile.pin); }
      catch { valid = String(old) === String(profile.pin); }
      if (!valid) { showToastMsg('Falscher PIN'); return; }
    }

    const newPin = prompt('Neuen PIN eingeben (4-8 Ziffern, leer = entfernen):');
    if (newPin === null) return;
    if (newPin === '') {
      window._pedPin = '';
      const ps = document.getElementById('ped-pin-status');
      if (ps) ps.textContent = '🔓 PIN wird entfernt';
      showToastMsg('PIN wird beim Speichern entfernt');
      return;
    }
    if (!/^\d{4,8}$/.test(newPin)) { showToastMsg('PIN: 4-8 Ziffern'); return; }
    window._pedPin = newPin;
    const ps = document.getElementById('ped-pin-status');
    if (ps) ps.textContent = '🔒 Neuer PIN (noch nicht gespeichert)';
    showToastMsg('PIN gesetzt – Speichern nicht vergessen!');
  });

  // Neues Profil
  document.getElementById('btn-new-profile')?.addEventListener('click', () =>
    openProfileEditor(null));
}

function openProfileEditor(id) {
  const p = id ? profiles.find(pr => pr.id === id) : null;
  window._pedId     = id || null;
  window._pedAvatar = undefined;
  window._pedPin    = undefined;

  const titleEl = document.getElementById('ped-title');
  const nameEl  = document.getElementById('ped-name');
  const prevEl  = document.getElementById('ped-avatar-preview');
  const pinEl   = document.getElementById('ped-pin-status');
  const delBtn  = document.getElementById('ped-delete');

  if (titleEl) titleEl.textContent = p ? 'Profil bearbeiten' : 'Neues Profil';
  if (nameEl)  nameEl.value = p?.name || '';
  if (prevEl)  prevEl.innerHTML = p?.avatar
    ? '<img src="' + p.avatar + '" style="width:56px;height:56px;border-radius:50%;object-fit:cover"/>'
    : '<div style="width:56px;height:56px;border-radius:50%;background:var(--bgch);display:flex;align-items:center;justify-content:center;font-size:28px">👤</div>';
  if (pinEl)   pinEl.textContent = p?.pin ? '🔒 PIN aktiv' : '🔓 Kein PIN';
  if (delBtn)  delBtn.style.display = (p && profiles.length > 1) ? 'flex' : 'none';

  document.getElementById('profile-editor-overlay').style.display = 'flex';
}

function buildSidebarProfile() {
  const p = profiles.find(pr => pr.id === activeProfileId) || { name: 'User' };
  const nameEl = document.getElementById('sidebar-profile-name');
  if (nameEl) nameEl.textContent = p.name || 'User';
  const avEl = document.getElementById('sidebar-profile-avatar');
  if (avEl) avEl.innerHTML = p.avatar
    ? '<img src="' + p.avatar + '" style="width:100%;height:100%;border-radius:50%;object-fit:cover"/>'
    : '👤';

  // Profil-Liste aufbauen
  const list = document.getElementById('sidebar-profile-list');
  if (!list) return;
  list.innerHTML = '';

  profiles.forEach(prof => {
    const item = document.createElement('div');
    item.className = 'sidebar-profile-item' + (prof.id === activeProfileId ? ' active' : '');
    item.style.cssText = 'display:flex;align-items:center;gap:8px;padding:5px 8px;' +
      'border-radius:var(--r-sm);cursor:pointer;transition:background .15s;margin-bottom:2px;' +
      (prof.id === activeProfileId ? 'background:var(--accg);color:var(--acc)' : 'color:var(--tx2)');

    item.innerHTML =
      '<div style="width:22px;height:22px;border-radius:50%;overflow:hidden;flex-shrink:0;' +
      'background:' + (prof.id === activeProfileId ? 'var(--acc)' : 'var(--bgch)') + ';' +
      'display:flex;align-items:center;justify-content:center;font-size:12px">' +
      (prof.avatar ? '<img src="' + prof.avatar + '" style="width:100%;height:100%;object-fit:cover"/>' : '👤') + '</div>' +
      '<span style="font-size:12px;font-weight:' + (prof.id === activeProfileId ? '700' : '400') + ';' +
      'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(prof.name) + '</span>' +
      '<button class="profile-edit-trigger" data-profile-id="' + prof.id + '" ' +
      'style="background:transparent;border:none;color:var(--tx3);cursor:pointer;font-size:11px;' +
      'padding:2px 4px;opacity:0;transition:opacity .15s" title="Bearbeiten">✏</button>';

    item.addEventListener('mouseenter', () => {
      item.querySelector('.profile-edit-trigger').style.opacity = '1';
      if (prof.id !== activeProfileId) item.style.background = 'var(--bgc)';
    });
    item.addEventListener('mouseleave', () => {
      item.querySelector('.profile-edit-trigger').style.opacity = '0';
      if (prof.id !== activeProfileId) item.style.background = 'transparent';
    });
    item.addEventListener('click', e => {
      if (e.target.closest('.profile-edit-trigger')) {
        e.stopPropagation();
        openProfileEditor(e.target.closest('.profile-edit-trigger').dataset.profileId);
        return;
      }
      if (prof.id === activeProfileId) return;
      if (prof.pin) {
        const entered = prompt('PIN für "' + prof.name + '":');
        if (entered === null) return;
        window.electronAPI.verifyPin(String(entered), prof.pin)
          .then(valid => valid ? switchProfile(prof.id) : showToastMsg('Falscher PIN'))
          .catch(() => String(entered) === String(prof.pin) ? switchProfile(prof.id) : showToastMsg('Falscher PIN'));
      } else {
        switchProfile(prof.id);
      }
    });
    list.appendChild(item);
  });
}

// ════════════════════════════════════════════════════════════════════
// TEIL 4: STATISTIKEN
// ════════════════════════════════════════════════════════════════════

async function buildStatsView() {
  const content = document.getElementById('stats-content');
  if (!content) return;
  content.innerHTML = '<div style="text-align:center;padding:30px;color:var(--tx2)">Lädt…</div>';

  const stats   = await window.electronAPI.getStreamStats(activeProfileId).catch(() => ({}));
  const watched = await window.electronAPI.getWatchedContent(activeProfileId).catch(() => []);
  content.innerHTML = '';

  const entries = Object.entries(stats)
    .map(([id, v]) => ({ id, secs: v?.total || 0, byDay: v?.byDay || Array(7).fill(0) }))
    .filter(e => e.secs > 0).sort((a, b) => b.secs - a.secs);

  const totalSecs = entries.reduce((a, e) => a + e.secs, 0);
  const totalH    = (totalSecs / 3600).toFixed(1);
  const adCount   = parseInt(localStorage.getItem('adBlock_' + activeProfileId) || '0');
  const topProv   = entries[0];
  const topName   = topProv
    ? ((settings.cardCustomNames || {})[topProv.id] || PROVIDERS()[topProv.id]?.name || topProv.id)
    : '–';
  const daysLabel = (I18N[lang] || I18N.de).days || ['So','Mo','Di','Mi','Do','Fr','Sa'];

  // Kacheln
  const kachelWrap = document.createElement('div');
  kachelWrap.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px';
  [
    { icon:'⏱', label:'Streamzeit',      value: totalH + 'h',               color:'var(--acc)' },
    { icon:'📺', label:'Anbieter genutzt', value: String(entries.length),      color:'#66bb6a' },
    { icon:'🎬', label:'Angeschaut',       value: String(watched.length),       color:'#ffa726' },
    { icon:'🛡', label:'Werbung geblockt', value: adCount.toLocaleString('de'), color:'#ab47bc',
      sub: topProv ? 'Meist bei ' + topName : '' },
  ].forEach(k => {
    const el = document.createElement('div');
    el.style.cssText = 'background:var(--bgc);border:1px solid var(--bor);border-radius:var(--r);padding:14px;text-align:center';
    el.innerHTML = '<div style="font-size:20px;margin-bottom:4px">' + k.icon + '</div>' +
      '<div style="font-family:var(--font-d);font-size:22px;font-weight:800;color:' + k.color + '">' + k.value + '</div>' +
      '<div style="font-size:11px;color:var(--tx2);margin-top:3px">' + k.label + '</div>' +
      (k.sub ? '<div style="font-size:9px;color:var(--tx3);margin-top:2px">' + esc(k.sub) + '</div>' : '');
    kachelWrap.appendChild(el);
  });
  content.appendChild(kachelWrap);

  if (!entries.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;padding:40px;color:var(--tx2)';
    empty.textContent = 'Noch keine Daten. Starte einen Stream!';
    content.appendChild(empty);
    buildAchievementsSection(stats); return;
  }

  // Anbieter-Balken
  const barSec = document.createElement('div');
  barSec.style.cssText = 'background:var(--bgc);border:1px solid var(--bor);border-radius:var(--r);padding:16px;margin-bottom:14px';
  barSec.innerHTML = '<h3 style="font-family:var(--font-d);font-size:14px;font-weight:700;color:var(--tx);margin-bottom:12px">📊 Meistgenutzte Anbieter</h3>';
  entries.slice(0, 8).forEach(({ id, secs }, i) => {
    const p = PROVIDERS()[id]; if (!p) return;
    const h = (secs / 3600).toFixed(1);
    const pct = Math.round((secs / (entries[0].secs || 1)) * 100);
    const name = (settings.cardCustomNames || {})[id] || p.name;
    const row = document.createElement('div');
    row.style.cssText = 'margin-bottom:10px';
    row.innerHTML = '<div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:12px">' +
      '<span style="display:flex;align-items:center;gap:5px;color:var(--tx)">' +
      '<img src="' + getFavicon(id,p) + '" style="width:14px;height:14px;border-radius:2px;object-fit:contain" onerror="this.style.display=\'none\'"/>' +
      esc(name) + '</span><span style="color:var(--tx2)">' + h + 'h</span></div>' +
      '<div style="height:6px;background:var(--bgch);border-radius:999px;overflow:hidden">' +
      '<div style="width:0;height:100%;border-radius:999px;background:' + (p.color || 'var(--acc)') +
      ';transition:width 1s ease ' + (i * 0.08) + 's" data-w="' + pct + '"></div></div>';
    barSec.appendChild(row);
  });
  content.appendChild(barSec);
  setTimeout(() => content.querySelectorAll('[data-w]').forEach(el => el.style.width = el.dataset.w + '%'), 60);

  // Wochentage
  const dayTotals = Array(7).fill(0);
  entries.forEach(({ byDay }) => { if (byDay) byDay.forEach((s, i) => dayTotals[i] += s); });
  const maxDay = Math.max(...dayTotals, 1);
  const daySec = document.createElement('div');
  daySec.style.cssText = 'background:var(--bgc);border:1px solid var(--bor);border-radius:var(--r);padding:16px;margin-bottom:14px';
  daySec.innerHTML = '<h3 style="font-family:var(--font-d);font-size:14px;font-weight:700;color:var(--tx);margin-bottom:12px">📅 Wochentage</h3>';
  const barCont = document.createElement('div');
  barCont.style.cssText = 'display:flex;align-items:flex-end;gap:8px;height:80px';
  daysLabel.forEach((d, i) => {
    const pct = Math.round((dayTotals[i] / maxDay) * 100);
    const isMax = dayTotals[i] === Math.max(...dayTotals) && dayTotals[i] > 0;
    const col = document.createElement('div');
    col.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;height:100%';
    col.innerHTML = '<div style="font-size:9px;color:' + (isMax?'var(--acc)':'var(--tx3)') + ';height:14px;display:flex;align-items:center">' +
      (dayTotals[i]>0 ? (dayTotals[i]/3600).toFixed(1)+'h' : '') + '</div>' +
      '<div style="flex:1;width:100%;display:flex;align-items:flex-end">' +
      '<div style="width:100%;min-height:3px;background:' + (isMax?'var(--acc)':'rgba(48,197,187,.3)') +
      ';border-radius:4px 4px 0 0;height:0;transition:height .8s ease ' + (i*0.06) + 's" data-dh="' + pct + '%"></div></div>' +
      '<div style="font-size:11px;font-weight:700;color:' + (isMax?'var(--acc)':'var(--tx2)') + '">' + d + '</div>';
    barCont.appendChild(col);
  });
  daySec.appendChild(barCont);
  content.appendChild(daySec);
  setTimeout(() => content.querySelectorAll('[data-dh]').forEach(el => el.style.height = el.dataset.dh), 80);

  buildAchievementsSection(stats);
}

function buildAchievementsSection(stats) {
  const el = document.getElementById('achievements-content');
  if (!el) return;
  const earned = new Set(JSON.parse(localStorage.getItem('achievements_' + activeProfileId) || '[]'));
  el.innerHTML = '';

  const total = ACHIEVEMENTS.filter(a => !a.hidden).length;
  const earnedCount = [...earned].filter(id => !ACHIEVEMENTS.find(x=>x.id===id)?.hidden).length;

  const header = document.createElement('div');
  header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px';
  header.innerHTML = '<h3 style="font-family:var(--font-d);font-size:15px;font-weight:800;color:var(--tx);margin:0">🏆 Achievements</h3>' +
    '<div style="display:flex;align-items:center;gap:8px">' +
    '<div style="font-size:12px;color:var(--tx2)">' + earnedCount + ' / ' + total + ' freigeschaltet</div>' +
    '<div style="width:100px;height:6px;background:var(--bgch);border-radius:999px;overflow:hidden">' +
    '<div style="width:' + Math.round((earnedCount/total)*100) + '%;height:100%;background:var(--acc);border-radius:999px"></div></div></div>';
  el.appendChild(header);

  const catLabels = {
    stream: {de:'⏱ Streamzeit'}, provider: {de:'📺 Anbieter'},
    special: {de:'⭐ Besonders'}, hidden: {de:'🔒 Versteckt'},
  };

  ['stream','provider','special','hidden'].forEach(cat => {
    const list = ACHIEVEMENTS.filter(a => a.cat === cat);
    if (!list.length) return;
    const sec = document.createElement('div');
    sec.style.cssText = 'margin-bottom:18px';
    sec.innerHTML = '<div style="font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">' +
      (catLabels[cat]?.[lang] || catLabels[cat]?.de || cat) + '</div>';
    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px';

    list.forEach(a => {
      const isEarned = earned.has(a.id);
      const isHidden = a.hidden && !isEarned;
      const name = isHidden ? '???' : (a.name[lang] || a.name.de);
      const desc = isHidden ? 'Muss erst freigeschaltet werden' : (a.desc[lang] || a.desc.de);
      const card = document.createElement('div');
      card.style.cssText = 'background:var(--bgc);border:1px solid ' + (isEarned ? 'var(--acc)' : 'var(--bor)') +
        ';border-radius:var(--r-sm);padding:10px;display:flex;align-items:center;gap:8px;' +
        'opacity:' + (isEarned ? '1' : '0.4') + ';' +
        (isEarned ? 'background:linear-gradient(135deg,var(--bgc),var(--accg))' : '');
      card.innerHTML = '<div style="font-size:22px;filter:' + (isEarned?'none':'grayscale(1)') + '">' + a.icon + '</div>' +
        '<div style="min-width:0"><div style="font-size:11px;font-weight:700;color:' + (isEarned?'var(--acc)':'var(--tx)') +
        ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(name) + '</div>' +
        '<div style="font-size:10px;color:var(--tx3);margin-top:2px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(desc) + '</div></div>' +
        (isEarned ? '<div style="margin-left:auto;color:var(--acc);font-size:14px;flex-shrink:0">✓</div>' : '');
      grid.appendChild(card);
    });
    sec.appendChild(grid);
    el.appendChild(sec);
  });
}

// ════════════════════════════════════════════════════════════════════
// TEIL 5: SPRACHE – ohne Rekursion
// ════════════════════════════════════════════════════════════════════

function applyLanguage(l) {
  lang = l;
  const tr = (I18N[l] || I18N.de);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (tr[key]) el.textContent = tr[key];
  });

  const si = document.getElementById('search-input');
  if (si) si.placeholder = tr.searchPlaceholder || 'Anbieter, Film, Serie…';

  document.querySelectorAll('.lang-btn, [data-lang]').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === l);
  });

  window._days = tr.days || ['So','Mo','Di','Mi','Do','Fr','Sa'];
  settings.language = l;
  autoSave();
}

// Sprach-Buttons verdrahten (einmalig, kein Loop)
(function bindLangButtons() {
  setTimeout(() => {
    document.querySelectorAll('[data-lang]').forEach(btn => {
      if (btn._langBound) return;
      btn._langBound = true;
      btn.addEventListener('click', () => applyLanguage(btn.dataset.lang));
    });
  }, 500);
})();

// ════════════════════════════════════════════════════════════════════
// TEIL 6: ONBOARDING – Theme + Font + Sprache
// ════════════════════════════════════════════════════════════════════

(function fixOnboardingSetup() {
  setTimeout(() => {
    // Theme
    ['ob-theme-dark','ob-theme-light'].forEach(id => {
      const btn = document.getElementById(id);
      if (!btn || btn._obBound) return;
      btn._obBound = true;
      btn.addEventListener('click', async () => {
        const theme = id === 'ob-theme-light' ? 'light' : 'dark';
        await window.electronAPI.setTheme(theme);
        document.documentElement.dataset.theme = theme;
        if (typeof applyTheme === 'function') applyTheme(theme);
        document.getElementById('ob-theme-dark')?.classList.toggle('active', theme === 'dark');
        document.getElementById('ob-theme-light')?.classList.toggle('active', theme === 'light');
      });
    });

    // Schriftart
    const fontSel = document.getElementById('ob-font-family');
    if (fontSel && !fontSel._obBound) {
      fontSel._obBound = true;
      fontSel.value = settings.designOptions?.fontFamily || 'DM Sans';
      fontSel.addEventListener('change', () => {
        const font = fontSel.value;
        settings.designOptions = settings.designOptions || {};
        settings.designOptions.fontFamily = font;
        if (typeof applyFontFamily === 'function') applyFontFamily(font);
        autoSave();
      });
    }

    // Aktuelle Theme-State setzen
    const theme = document.documentElement.dataset.theme || 'dark';
    document.getElementById('ob-theme-dark')?.classList.toggle('active', theme === 'dark');
    document.getElementById('ob-theme-light')?.classList.toggle('active', theme === 'light');
  }, 400);
})();

// ════════════════════════════════════════════════════════════════════
// TEIL 7: KATEGORIE-FILTER + ANBIETER-WIEDERHERSTELLUNG
// ════════════════════════════════════════════════════════════════════

function buildCategoryFilterBar() {
  const bar = document.getElementById('category-filter-bar');
  if (!bar) return;
  bar.innerHTML = '';
  const active = settings.activeCategory || 'all';

  Object.entries(PROVIDER_CATEGORIES).forEach(([key, cat]) => {
    const btn = document.createElement('button');
    btn.className = 'cat-filter-btn' + (key === active ? ' active' : '');
    btn.dataset.cat = key;
    const label = cat[lang] || cat.de;
    btn.innerHTML = '<span>' + cat.icon + '</span><span class="cat-label">' + label + '</span>';
    btn.addEventListener('click', () => {
      settings.activeCategory = key;
      autoSave();
      updateCategoryFilter(key);
      buildProviderGrid();
    });
    bar.appendChild(btn);
  });

  // "Anbieter hinzufügen" Button
  const addBtn = document.createElement('button');
  addBtn.className = 'cat-filter-btn';
  addBtn.style.cssText = 'margin-left:auto';
  addBtn.innerHTML = '<span>➕</span><span class="cat-label">Anbieter</span>';
  addBtn.title = 'Ausgeblendete Anbieter aktivieren';
  addBtn.addEventListener('click', () => {
    if (typeof openRestoreProvidersPanel === 'function') openRestoreProvidersPanel();
  });
  bar.appendChild(addBtn);

  bar.style.display = 'flex';
}

// ════════════════════════════════════════════════════════════════════
// TEIL 8: UPDATE-CHECK
// ════════════════════════════════════════════════════════════════════

(function setupUpdateCheck() {
  setTimeout(() => {
    const btn = document.getElementById('btn-check-updates');
    if (!btn || btn._updateBound) return;
    btn._updateBound = true;
    btn.replaceWith(btn.cloneNode(true));
    document.getElementById('btn-check-updates').addEventListener('click', async () => {
      const el = document.getElementById('update-check-result');
      if (el) { el.textContent = 'Prüfe…'; el.style.color = 'var(--tx2)'; }
      let done = false;
      const finish = (text, color) => {
        if (done) return; done = true;
        if (el) { el.textContent = text; el.style.color = color; }
      };
      window.electronAPI.onUpdateAvailable?.(info =>
        finish('🚀 v' + info.version + ' verfügbar!', 'var(--acc)'));
      window.electronAPI.onUpdateNotAvailable?.(() =>
        finish('✓ Aktuellste Version', 'var(--acc)'));
      window.electronAPI.onUpdateError?.(msg =>
        finish(msg && !msg.includes('404') ? 'Fehler: ' + msg : '✓ Aktuellste Version', 'var(--acc)'));
      try { await window.electronAPI.checkForUpdates(); } catch {}
      setTimeout(() => finish('✓ Aktuellste Version', 'var(--acc)'), 8000);
    });
  }, 900);
})();

// ════════════════════════════════════════════════════════════════════
// TEIL 9: WIDEVINE STATUS
// ════════════════════════════════════════════════════════════════════

async function checkWidevineStatus() {
  try {
    const status = await window.electronAPI.getWidevineStatus();
    const el     = document.getElementById('widevine-status');
    if (!el) return;

    if (status?.installed) {
      el.innerHTML = '<div style="display:flex;align-items:center;gap:6px;color:#66bb6a">' +
        '<span style="font-size:16px">✓</span>' +
        '<div><div style="font-weight:700;font-size:13px">WideVine CDM installiert</div>' +
        (status.version ? '<div style="font-size:11px;opacity:.7">v' + status.version + '</div>' : '') + '</div></div>';
    } else {
      const missing = [];
      if (!status?.dllExists)      missing.push('widevinecdm.dll');
      if (!status?.sigExists)      missing.push('widevinecdm.dll.sig');
      if (!status?.manifestExists) missing.push('manifest.json');
      el.innerHTML = '<div style="color:var(--danger)">' +
        '<div style="font-weight:700;margin-bottom:6px">✗ WideVine CDM nicht vollständig</div>' +
        (missing.length ? '<div style="font-size:11px;margin-bottom:8px">Fehlend: ' +
          missing.map(f => '<code style="background:var(--bgc);padding:1px 5px;border-radius:3px">' + f + '</code>').join(' ') + '</div>' : '') +
        '<div style="display:flex;gap:6px;align-items:center;margin-top:6px">' +
        '<code style="background:var(--bgc);border:1px solid var(--bor);border-radius:4px;padding:4px 8px;font-size:10px;color:var(--tx2);flex:1;word-break:break-all">' + (status?.cdmDir || '?') + '</code>' +
        '<button onclick="window._openWvFolder(\'dest\')" style="padding:5px 10px;background:var(--acc);color:#fff;border:none;border-radius:var(--r-sm);font-size:11px;cursor:pointer">📁 Öffnen</button></div></div>';
    }
  } catch(e) {
    console.warn('[WideVine] Status-Fehler:', e.message);
  }
}

window._openWvFolder = async function(type) {
  try {
    let targetPath = '';
    if (type === 'dest') {
      const status = await window.electronAPI.getWidevineStatus();
      targetPath = status?.cdmDir || '';
    } else if (type === 'chrome') {
      targetPath = 'C:\\Program Files\\Google\\Chrome\\Application';
    } else if (type === 'edge') {
      targetPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application';
    }
    if (!targetPath) { showToastMsg('Pfad nicht gefunden'); return; }
    window.electronAPI.openExternal('file:///' + targetPath.replace(/\\/g, '/'));
  } catch(e) {
    showToastMsg('Ordner konnte nicht geöffnet werden');
  }
};

// ════════════════════════════════════════════════════════════════════
// TEIL 10: SESSION-LISTE (Account-Tab)
// ════════════════════════════════════════════════════════════════════

function buildSessionList(res) {
  const list = document.getElementById('session-list');
  if (!list) return;

  let actionRow = document.getElementById('account-action-btns');
  if (!actionRow) {
    actionRow = document.createElement('div');
    actionRow.id = 'account-action-btns';
    actionRow.style.cssText = 'display:flex;gap:8px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--bor);flex-wrap:wrap';
    const parent = list.parentElement;
    if (parent) parent.insertBefore(actionRow, parent.firstChild);
  }

  const selectedIds = new Set();

  actionRow.innerHTML = '<button class="pick-btn" id="btn-logout-all" style="border-color:var(--danger);color:var(--danger)">↩ Alle abmelden</button>' +
    '<button class="pick-btn" id="btn-logout-sel">↩ Auswahl abmelden</button>';

  document.getElementById('btn-logout-all')?.addEventListener('click', () => {
    if (!confirm('Von allen Diensten abmelden?')) return;
    window.electronAPI.clearAllSessions(activeProfileId);
    showToastMsg('Alle abgemeldet');
    setTimeout(() => window.electronAPI.refreshSessionsNow(activeProfileId), 600);
  });
  document.getElementById('btn-logout-sel')?.addEventListener('click', () => {
    if (!selectedIds.size) { showToastMsg('Keine Anbieter ausgewählt'); return; }
    window.electronAPI.clearProvidersSessions(activeProfileId, [...selectedIds]);
    selectedIds.clear();
    showToastMsg('Ausgewählte Anbieter abgemeldet');
    setTimeout(() => window.electronAPI.refreshSessionsNow(activeProfileId), 600);
  });

  list.innerHTML = '';
  const all = Object.entries(PROVIDERS_BASE).sort((a,b) => a[1].name.localeCompare(b[1].name));
  const loggedIn = all.filter(([id]) => !!(res||{})[id]);
  const notIn    = all.filter(([id]) => !(res||{})[id]);

  function makeRow(id, p, isOn) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:9px;padding:8px 10px;' +
      'border:1px solid transparent;border-radius:var(--r-sm);cursor:pointer;transition:all .15s;margin-bottom:3px;user-select:none';
    row.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:' + (isOn?'#66bb6a':'var(--bor)') + '"></span>' +
      '<img src="' + getFavicon(id,p) + '" style="width:18px;height:18px;border-radius:3px;object-fit:contain" onerror="this.style.display=\'none\'"/>' +
      '<span style="flex:1;font-size:13px;color:var(--tx)">' + esc((settings.cardCustomNames||{})[id]||p.name) + '</span>' +
      (isOn ? '<span style="font-size:10px;color:#66bb6a;font-weight:600">✓</span>' : '') +
      (isOn ? '<button class="sess-logout-btn" style="display:none;padding:3px 8px;border:1px solid var(--bor);background:transparent;color:var(--danger);border-radius:var(--r-sm);font-size:10px;cursor:pointer">Abmelden</button>' : '');

    if (isOn) {
      row.addEventListener('click', e => {
        if (e.target.classList.contains('sess-logout-btn')) return;
        if (selectedIds.has(id)) {
          selectedIds.delete(id);
          row.style.background = ''; row.style.borderColor = 'transparent';
        } else {
          selectedIds.add(id);
          row.style.background = 'var(--accg)'; row.style.borderColor = 'var(--acc)';
        }
      });
      const lb = row.querySelector('.sess-logout-btn');
      if (lb) {
        row.addEventListener('mouseenter', () => lb.style.display = 'block');
        row.addEventListener('mouseleave', () => lb.style.display = 'none');
        lb.addEventListener('click', e => {
          e.stopPropagation();
          window.electronAPI.clearProviderSession(activeProfileId, id);
          showToastMsg('Abgemeldet von ' + p.name);
          row.style.opacity = '0'; row.style.transition = 'opacity .3s';
          setTimeout(() => row.remove(), 300);
          setTimeout(() => window.electronAPI.refreshSessionsNow(activeProfileId), 500);
        });
      }
    }
    return row;
  }

  if (loggedIn.length) {
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:10px;font-weight:700;color:var(--acc);text-transform:uppercase;letter-spacing:.1em;padding:6px 0 4px';
    lbl.textContent = 'Angemeldet';
    list.appendChild(lbl);
    loggedIn.forEach(([id,p]) => list.appendChild(makeRow(id,p,true)));
  }
  if (notIn.length) {
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:10px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.1em;padding:8px 0 4px';
    lbl.textContent = 'Nicht angemeldet';
    list.appendChild(lbl);
    notIn.forEach(([id,p]) => list.appendChild(makeRow(id,p,false)));
  }
}

// ════════════════════════════════════════════════════════════════════
// TEIL 11: MISC PATCHES
// ════════════════════════════════════════════════════════════════════

// Plugin-Buttons Farben
(function stylePluginButtons() {
  const bind = () => {
    document.querySelectorAll('.plugin-preset-btn').forEach(btn => {
      const txt = (btn.textContent || '').toLowerCase();
      if (txt.includes('install') || txt.includes('aktivier'))
        btn.style.cssText += 'background:var(--acc)!important;color:#fff!important;border:none!important';
      else if (txt.includes('deinstall') || txt.includes('entfern'))
        btn.style.cssText += 'background:rgba(229,115,115,.12)!important;border:1px solid #e57373!important;color:#e57373!important';
    });
  };
  setTimeout(bind, 900);
})();

// CR Kalender
async function loadCrCalendarView() {
  const content = document.getElementById('cr-calendar-content');
  if (!content) return;
  content.innerHTML = '<div style="color:var(--tx2);padding:20px;text-align:center">Lädt…</div>';
  try {
    const [p1, p2] = await Promise.all([
      window.electronAPI.getUpcoming(1),
      window.electronAPI.getTrending(),
    ]);
    const all = [...(p1.anime||[]),...(p2.anime||[])]
      .filter((v,i,a) => a.findIndex(x=>x.id===v.id)===i)
      .filter(i => i.poster_path)
      .filter(i => /^[\u0000-\u024F\s\d\W]+$/.test(i.title||i.name||''));

    const today = new Date(); today.setHours(0,0,0,0);
    const dayNames = ['So','Mo','Di','Mi','Do','Fr','Sa'];

    const tabs = [];
    for (let i = 0; i < 8; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      tabs.push({
        label: i===0 ? 'Heute' : dayNames[d.getDay()]+' '+d.getDate()+'.'+(d.getMonth()+1)+'.',
        date: d.toISOString().split('T')[0], type:'future'
      });
    }
    tabs.push({ label: '← Letzte Woche', date: 'lastweek', type:'past' });

    let activeTab = tabs[0].date;

    function renderTabContent(targetDate) {
      const tc = document.getElementById('cr-tab-content');
      if (!tc) return;
      tc.innerHTML = '';
      let items;
      if (targetDate === 'lastweek') {
        const ls = new Date(today); ls.setDate(today.getDate()-7);
        items = all.filter(i => {
          const d = i.first_air_date || i.release_date;
          if (!d) return false;
          const dt = new Date(d); dt.setHours(0,0,0,0);
          return dt >= ls && dt < today;
        });
      } else {
        items = all.filter(i => (i.first_air_date||i.release_date) === targetDate);
      }
      if (!items.length) {
        tc.innerHTML = '<div style="color:var(--tx2);padding:20px;text-align:center">Keine Anime für diesen Tag</div>';
        return;
      }
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px;padding:14px 0';
      items.forEach(item => {
        const title = item.title||item.name||'?';
        const poster = item.poster_path ? 'https://image.tmdb.org/t/p/w185' + item.poster_path : '';
        const card = document.createElement('div');
        card.style.cssText = 'background:var(--bgc);border:1px solid var(--bor);border-radius:var(--r);overflow:hidden;cursor:pointer;transition:transform .18s,border-color .18s';
        card.innerHTML = (poster ? '<img src="' + poster + '" style="width:100%;aspect-ratio:2/3;object-fit:cover;display:block" loading="lazy"/>' : '') +
          '<div style="padding:7px 9px"><div style="font-size:11px;font-weight:600;color:var(--tx);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(title) + '</div><div style="font-size:9px;color:var(--acc);margin-top:3px;font-weight:600">Crunchyroll</div></div>';
        card.addEventListener('mouseenter', () => { card.style.transform='translateY(-3px)'; card.style.borderColor='var(--acc)'; });
        card.addEventListener('mouseleave', () => { card.style.transform=''; card.style.borderColor=''; });
        card.addEventListener('click', () => showDetailPopup(item.id,'tv',title));
        grid.appendChild(card);
      });
      tc.appendChild(grid);
    }

    content.innerHTML = '';
    const topBar = document.createElement('div');
    topBar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--bor);align-items:center';
    tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'media-type-text-btn' + (tab.date===activeTab?' active':'');
      btn.textContent = tab.label;
      btn.addEventListener('click', () => {
        activeTab = tab.date;
        topBar.querySelectorAll('.media-type-text-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderTabContent(tab.date);
      });
      topBar.appendChild(btn);
    });
    const crBtn = document.createElement('button');
    crBtn.className = 'pick-btn';
    crBtn.style.marginLeft = 'auto';
    crBtn.textContent = '▶ Crunchyroll';
    crBtn.addEventListener('click', () => openProvider('crunchyroll'));
    topBar.appendChild(crBtn);
    content.appendChild(topBar);
    const tc = document.createElement('div');
    tc.id = 'cr-tab-content';
    content.appendChild(tc);
    renderTabContent(activeTab);
  } catch(e) {
    if (content) content.innerHTML = '<div style="color:var(--danger);padding:20px">Fehler: ' + esc(e.message||String(e)) + '</div>';
  }
}

console.log('[OmniHub fixes.js] Geladen – keine Rekursionen');

// ════════════════════════════════════════════════════════════════════
// v3.2.6 FIXES
// ════════════════════════════════════════════════════════════════════

// ── 1. MINIPLAYER: Komplett überarbeitet ─────────────────────────────

(function setupPipImproved() {
  const PIP_W = 340, PIP_H = 200;
  let isDragging = false, dragOffX = 0, dragOffY = 0;

  function setupPip() {
    const pip = document.getElementById('pip-window');
    if (!pip || pip._v326Setup) return;
    pip._v326Setup = true;

    // Modernes Design
    pip.style.cssText = `
      position:fixed; width:${PIP_W}px; height:${PIP_H}px;
      right:24px; bottom:24px; left:auto; top:auto;
      background:#000; border-radius:12px; overflow:hidden;
      box-shadow:0 8px 32px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.08);
      z-index:8000; display:none; flex-direction:column;
      transition:box-shadow .2s;
    `;

    // Toolbar oben
    let toolbar = document.getElementById('pip-toolbar');
    if (!toolbar) {
      toolbar = document.createElement('div');
      toolbar.id = 'pip-toolbar';
      toolbar.style.cssText = `
        display:flex; align-items:center; gap:6px; padding:6px 10px;
        background:rgba(0,0,0,.85); backdrop-filter:blur(8px);
        border-bottom:1px solid rgba(255,255,255,.08);
        position:absolute; top:0; left:0; right:0; z-index:10;
        opacity:0; transition:opacity .2s;
      `;

      const title = document.createElement('span');
      title.id = 'pip-title';
      title.style.cssText = 'font-size:11px;color:#fff;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      title.textContent = 'Mini-Player';

      // Größenregler
      const sizes = [
        { label: 'S', w: 240, h: 135 },
        { label: 'M', w: 340, h: 200 },
        { label: 'L', w: 480, h: 270 },
      ];
      const sizeWrap = document.createElement('div');
      sizeWrap.style.cssText = 'display:flex;gap:3px';
      sizes.forEach(sz => {
        const b = document.createElement('button');
        b.textContent = sz.label;
        b.style.cssText = 'background:rgba(255,255,255,.1);border:none;color:rgba(255,255,255,.7);font-size:10px;padding:2px 6px;border-radius:4px;cursor:pointer;transition:all .15s';
        b.addEventListener('mouseenter', () => b.style.background = 'rgba(255,255,255,.2)');
        b.addEventListener('mouseleave', () => b.style.background = 'rgba(255,255,255,.1)');
        b.addEventListener('click', () => {
          pip.style.width  = sz.w + 'px';
          pip.style.height = sz.h + 'px';
          const cont = document.getElementById('pip-content');
          if (cont) { const wv = cont.querySelector('webview'); if (wv) wv.style.height = (sz.h - 32) + 'px'; }
        });
        sizeWrap.appendChild(b);
      });

      // Mute Button
      const muteBtn = document.createElement('button');
      muteBtn.id = 'pip-mute-btn';
      muteBtn.style.cssText = 'background:rgba(255,255,255,.1);border:none;color:#fff;font-size:14px;padding:3px 8px;border-radius:4px;cursor:pointer;line-height:1';
      muteBtn.textContent = '🔊';
      muteBtn.title = 'Ton an/aus';
      muteBtn.addEventListener('click', () => {
        const cont = document.getElementById('pip-content');
        const wv = cont?.querySelector('webview');
        if (!wv) return;
        const muted = !wv._pipMuted;
        wv._pipMuted = muted;
        try { wv.setAudioMuted(muted); } catch {}
        muteBtn.textContent = muted ? '🔇' : '🔊';
        muteBtn.style.background = muted ? 'rgba(239,83,80,.4)' : 'rgba(255,255,255,.1)';
      });

      // Zurück-Button
      const restoreBtn = document.createElement('button');
      restoreBtn.style.cssText = 'background:rgba(48,197,187,.2);border:1px solid rgba(48,197,187,.3);color:var(--acc);font-size:10px;padding:3px 8px;border-radius:4px;cursor:pointer;white-space:nowrap';
      restoreBtn.textContent = '⤢ Vollbild';
      restoreBtn.title = 'Zurück zum Vollbild';
      restoreBtn.addEventListener('click', () => {
        if (typeof restoreFromPip === 'function') restoreFromPip();
      });

      // Schließen
      const closeBtn = document.createElement('button');
      closeBtn.style.cssText = 'background:rgba(239,83,80,.15);border:none;color:#ef5350;font-size:14px;padding:3px 8px;border-radius:4px;cursor:pointer;line-height:1';
      closeBtn.textContent = '×';
      closeBtn.title = 'Stream beenden';
      closeBtn.addEventListener('click', () => {
        pip.style.display = 'none';
        const cont = document.getElementById('pip-content');
        if (cont) cont.innerHTML = '';
        pipProviderId = null;
        currentProvider = null;
        currentWebview = null;
      });

      toolbar.append(title, sizeWrap, muteBtn, restoreBtn, closeBtn);
      pip.appendChild(toolbar);
    }

    // Content-Bereich
    let cont = document.getElementById('pip-content');
    if (!cont) {
      cont = document.createElement('div');
      cont.id = 'pip-content';
      cont.style.cssText = `position:absolute;top:32px;left:0;right:0;bottom:0;background:#000`;
      pip.appendChild(cont);
    }

    // Hover zeigt Toolbar
    pip.addEventListener('mouseenter', () => { toolbar.style.opacity = '1'; });
    pip.addEventListener('mouseleave', () => { toolbar.style.opacity = '0'; });

    // Drag & Drop
    toolbar.addEventListener('mousedown', e => {
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      const rect = pip.getBoundingClientRect();
      dragOffX = e.clientX - rect.left;
      dragOffY = e.clientY - rect.top;
      pip.style.transition = 'none';
      pip.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      let x = e.clientX - dragOffX;
      let y = e.clientY - dragOffY;
      // Innerhalb des Bildschirms halten
      x = Math.max(0, Math.min(window.innerWidth - pip.offsetWidth, x));
      y = Math.max(0, Math.min(window.innerHeight - pip.offsetHeight, y));
      pip.style.left   = x + 'px';
      pip.style.top    = y + 'px';
      pip.style.right  = 'auto';
      pip.style.bottom = 'auto';
    });
    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      pip.style.transition = 'box-shadow .2s';
      pip.style.cursor = '';
    });
  }

  setTimeout(setupPip, 600);
})();

// maybeMoveToPip: Webview in Miniplayer verschieben
window.maybeMoveToPip = function() {
  const wrap = document.getElementById('webview-wrap');
  const pip  = document.getElementById('pip-window');
  const cont = document.getElementById('pip-content');
  if (!wrap || !pip || !cont || !currentWebview || !currentProvider) return;

  const wv = currentWebview;
  wrap.removeChild(wv);
  wv.style.cssText = 'width:100%;height:100%;border:none';
  cont.innerHTML = '';
  cont.appendChild(wv);

  pipProviderId = currentProvider;
  const titleEl = document.getElementById('pip-title');
  if (titleEl) titleEl.textContent =
    (settings.cardCustomNames || {})[currentProvider] ||
    PROVIDERS()[currentProvider]?.name || currentProvider;

  pip.style.display = 'flex';
  currentProvider = null;
  currentWebview  = null;
};

// restoreFromPip: Webview zurück in den Stream
window.restoreFromPip = function() {
  const pip  = document.getElementById('pip-window');
  const cont = document.getElementById('pip-content');
  const wrap = document.getElementById('webview-wrap');
  if (!pip || !cont || !wrap || !pipProviderId) return;

  const wv = cont.querySelector('webview');
  if (wv) {
    cont.removeChild(wv);
    wv.style.cssText = 'width:100%;height:100%;border:none;display:flex';
    wrap.innerHTML = '';
    wrap.appendChild(wv);
    currentWebview  = wv;
    currentProvider = pipProviderId;
  }

  pip.style.display = 'none';
  cont.innerHTML = '';
  pipProviderId  = null;

  const titleEl = document.getElementById('stream-title');
  if (titleEl) titleEl.textContent =
    (settings.cardCustomNames || {})[currentProvider] ||
    PROVIDERS()[currentProvider]?.name || currentProvider;

  showView('stream');
};

// ── 2. PARTIKEL: Komplett überarbeitet ───────────────────────────────

(function setupParticlesImproved() {
  function runParticles() {
    const canvas = document.getElementById('particles-canvas');
    if (!canvas) return;
    if (window._particlesAnim) { cancelAnimationFrame(window._particlesAnim); window._particlesAnim = null; }
    if (!settings.particlesEnabled) { canvas.style.display = 'none'; return; }

    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0';
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    let w = canvas.width  = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    const cfg = settings.particlesConfig || {};
    const count   = cfg.count   || 60;
    const size    = cfg.size    || 1.5;
    const speed   = cfg.speed   || 0.8;
    const opacity = cfg.opacity !== undefined ? cfg.opacity : 0.55;
    const color   = cfg.color   || '#30c5bb';
    const shapes  = (cfg.shapes && cfg.shapes.length) ? cfg.shapes : ['circle'];

    const pts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * size + 0.4,
      vx: (Math.random() - .5) * speed * .6,
      vy: (Math.random() - .5) * speed * .6,
      rot: Math.random() * Math.PI * 2,
      op: (Math.random() * .5 + .5) * opacity,
      shape: shapes[Math.floor(Math.random() * shapes.length)],
    }));

    window.addEventListener('resize', () => { w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; });

    function drawP(p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = p.op;
      // Farbe: CSS var() in canvas nicht erlaubt
      const c = color.startsWith('var(')
        ? (getComputedStyle(document.documentElement).getPropertyValue('--acc').trim() || '#30c5bb')
        : color;
      ctx.fillStyle = c;
      ctx.strokeStyle = c;
      ctx.lineWidth = 0.8;
      switch (p.shape) {
        case 'triangle':
          ctx.beginPath(); ctx.moveTo(0,-p.r*1.4); ctx.lineTo(p.r,p.r*.9); ctx.lineTo(-p.r,p.r*.9); ctx.closePath(); ctx.fill(); break;
        case 'star':
          ctx.beginPath();
          for (let i=0;i<5;i++) { ctx.lineTo(Math.cos((18+i*72)*Math.PI/180)*p.r,   -Math.sin((18+i*72)*Math.PI/180)*p.r); ctx.lineTo(Math.cos((54+i*72)*Math.PI/180)*p.r*.4,-Math.sin((54+i*72)*Math.PI/180)*p.r*.4); }
          ctx.closePath(); ctx.fill(); break;
        case 'ring':
          ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.lineWidth=p.r*.35; ctx.stroke(); break;
        case 'line':
          ctx.beginPath(); ctx.moveTo(-p.r*2,0); ctx.lineTo(p.r*2,0); ctx.stroke(); break;
        default: // circle
          ctx.beginPath(); ctx.arc(0,0,p.r,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }

    function tick() {
      ctx.clearRect(0,0,w,h);
      pts.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += .003;
        if(p.x<-10)p.x=w+10; if(p.x>w+10)p.x=-10;
        if(p.y<-10)p.y=h+10; if(p.y>h+10)p.y=-10;
        drawP(p);
      });
      window._particlesAnim = requestAnimationFrame(tick);
    }
    tick();
  }

  // UI: Partikel-Einstellungen verdrahten
  function bindParticleUI() {
    const sec = document.getElementById('particles-options-section') ||
                document.querySelector('[id*="particle"]')?.closest('.smt-card');
    const toggle = document.getElementById('particles-enabled');

    if (toggle && !toggle._pBound) {
      toggle._pBound = true;
      toggle.checked = !!settings.particlesEnabled;
      toggle.addEventListener('change', () => {
        settings.particlesEnabled = toggle.checked;
        runParticles();
        autoSave();
      });
    }

    // Anzahl
    const countEl = document.getElementById('particles-count');
    if (countEl && !countEl._pBound) {
      countEl._pBound = true;
      countEl.value = settings.particlesConfig?.count || 60;
      countEl.addEventListener('input', () => {
        settings.particlesConfig = settings.particlesConfig || {};
        settings.particlesConfig.count = parseInt(countEl.value);
        runParticles(); autoSave();
      });
    }
    // Geschwindigkeit
    const speedEl = document.getElementById('particles-speed');
    if (speedEl && !speedEl._pBound) {
      speedEl._pBound = true;
      speedEl.value = (settings.particlesConfig?.speed || 0.8) * 10;
      speedEl.addEventListener('input', () => {
        settings.particlesConfig = settings.particlesConfig || {};
        settings.particlesConfig.speed = parseInt(speedEl.value) / 10;
        runParticles(); autoSave();
      });
    }
    // Größe
    const sizeEl = document.getElementById('particles-size');
    if (sizeEl && !sizeEl._pBound) {
      sizeEl._pBound = true;
      sizeEl.value = (settings.particlesConfig?.size || 1.5) * 10;
      sizeEl.addEventListener('input', () => {
        settings.particlesConfig = settings.particlesConfig || {};
        settings.particlesConfig.size = parseInt(sizeEl.value) / 10;
        runParticles(); autoSave();
      });
    }
    // Transparenz
    const opEl = document.getElementById('particles-opacity');
    if (opEl && !opEl._pBound) {
      opEl._pBound = true;
      opEl.value = Math.round((settings.particlesConfig?.opacity ?? 0.55) * 100);
      opEl.addEventListener('input', () => {
        settings.particlesConfig = settings.particlesConfig || {};
        settings.particlesConfig.opacity = parseInt(opEl.value) / 100;
        const lbl = document.getElementById('particles-opacity-val');
        if (lbl) lbl.textContent = opEl.value + '%';
        runParticles(); autoSave();
      });
    }
    // Farbe
    const colorEl = document.getElementById('particles-color') || document.getElementById('particle-color');
    if (colorEl && !colorEl._pBound) {
      colorEl._pBound = true;
      colorEl.value = settings.particlesConfig?.color || '#30c5bb';
      colorEl.addEventListener('input', () => {
        settings.particlesConfig = settings.particlesConfig || {};
        settings.particlesConfig.color = colorEl.value;
        runParticles(); autoSave();
      });
    }
    // Shapes
    document.querySelectorAll('.particle-shape-btn').forEach(btn => {
      if (btn._pBound) return;
      btn._pBound = true;
      const shape = btn.dataset.shape;
      const active = (settings.particlesConfig?.shapes || ['circle']).includes(shape);
      btn.classList.toggle('active', active);
      btn.style.opacity = active ? '1' : '0.4';
      btn.addEventListener('click', () => {
        settings.particlesConfig = settings.particlesConfig || {};
        let shapes = [...(settings.particlesConfig.shapes || ['circle'])];
        if (shapes.includes(shape)) {
          shapes = shapes.filter(s => s !== shape);
          if (!shapes.length) shapes = ['circle'];
        } else {
          shapes.push(shape);
        }
        settings.particlesConfig.shapes = shapes;
        document.querySelectorAll('.particle-shape-btn').forEach(b => {
          const active = shapes.includes(b.dataset.shape);
          b.classList.toggle('active', active);
          b.style.opacity = active ? '1' : '0.4';
        });
        runParticles(); autoSave();
      });
    });
  }

  window.setupParticles = function() { runParticles(); bindParticleUI(); };
  setTimeout(() => {
    if (settings?.particlesEnabled) runParticles();
    bindParticleUI();
  }, 600);
})();

// ── 3. DESIGN-OPTIONEN: Karten-Effekte ───────────────────────────────

(function bindDesignOptions() {
  setTimeout(() => {
    // Karten-Schatten
    const shadowToggle = document.getElementById('card-shadow-toggle');
    if (shadowToggle && !shadowToggle._doBound) {
      shadowToggle._doBound = true;
      shadowToggle.checked = settings.designOptions?.cardShadow !== false;
      shadowToggle.addEventListener('change', () => {
        settings.designOptions = settings.designOptions || {};
        settings.designOptions.cardShadow = shadowToggle.checked;
        document.documentElement.style.setProperty('--card-shadow',
          shadowToggle.checked ? '0 2px 12px rgba(0,0,0,.22)' : 'none');
        autoSave();
      });
    }
    // Karten-Hover-Zoom
    const zoomToggle = document.getElementById('card-zoom-toggle');
    if (zoomToggle && !zoomToggle._doBound) {
      zoomToggle._doBound = true;
      zoomToggle.checked = settings.designOptions?.hoverZoom !== false;
      zoomToggle.addEventListener('change', () => {
        settings.designOptions = settings.designOptions || {};
        settings.designOptions.hoverZoom = zoomToggle.checked;
        document.documentElement.style.setProperty('--card-hover-zoom',
          zoomToggle.checked ? 'translateY(-3px) scale(1.015)' : 'translateY(-2px)');
        autoSave();
      });
    }
    // Animationen
    const animToggle = document.getElementById('card-anim-toggle');
    if (animToggle && !animToggle._doBound) {
      animToggle._doBound = true;
      animToggle.checked = settings.designOptions?.animations !== false;
      animToggle.addEventListener('change', () => {
        settings.designOptions = settings.designOptions || {};
        settings.designOptions.animations = animToggle.checked;
        document.body.classList.toggle('no-animations', !animToggle.checked);
        autoSave();
      });
    }

    // Initiale CSS-Variablen setzen
    const do_ = settings.designOptions || {};
    document.documentElement.style.setProperty('--card-shadow',
      do_.cardShadow !== false ? '0 2px 12px rgba(0,0,0,.22)' : 'none');
    document.documentElement.style.setProperty('--card-hover-zoom',
      do_.hoverZoom !== false ? 'translateY(-3px) scale(1.015)' : 'translateY(-2px)');
    if (do_.animations === false) document.body.classList.add('no-animations');
  }, 500);
})();

// ── 4. PLUGIN BUTTONS: Farben ────────────────────────────────────────

(function stylePlugins() {
  const bind = () => {
    document.querySelectorAll('.plugin-preset-btn').forEach(btn => {
      const txt = (btn.textContent||'').toLowerCase().trim();
      // Erst klassen zurücksetzen
      btn.removeAttribute('style');
      if (txt.includes('deinstall') || txt.includes('entfern') || txt.includes('remove')) {
        btn.style.cssText = 'background:rgba(239,83,80,.12)!important;border:1px solid #ef5350!important;color:#ef5350!important;font-weight:600';
      } else if (txt.includes('install') || txt.includes('aktivier')) {
        btn.style.cssText = 'background:var(--acc)!important;color:#fff!important;border:none!important';
      }
    });
  };
  setTimeout(bind, 900);
  // Auch nach Tab-Wechsel
  document.getElementById('sms-plugins')?.addEventListener('click', () => setTimeout(bind, 200));
})();

// ── 5. WIDEVINE GUIDE: In Einstellungen verfügbar machen ─────────────

(function ensureWidevineGuideBtn() {
  setTimeout(() => {
    const btn = document.getElementById('btn-widevine-guide') ||
                document.querySelector('[data-widevine-guide]');
    if (btn && !btn._wvBound) {
      btn._wvBound = true;
      btn.addEventListener('click', () => {
        if (typeof openWidevineGuide === 'function') openWidevineGuide();
      });
    }
    // WideVine Status in Einstellungen aktualisieren
    if (typeof checkWidevineStatus === 'function') checkWidevineStatus();
  }, 800);
})();

// WideVine Guide Funktion (vollständig)
function openWidevineGuide() {
  const existing = document.getElementById('widevine-guide-overlay');
  if (existing) { existing.remove(); return; }
  const overlay = document.createElement('div');
  overlay.id = 'widevine-guide-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--borh);border-radius:var(--r);width:min(660px,96%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.7)">
      <div style="display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid var(--bor)">
        <span style="font-size:20px;margin-right:10px">🔐</span>
        <span style="font-family:var(--font-d);font-size:16px;font-weight:800;color:var(--tx);flex:1">WideVine CDM installieren</span>
        <button onclick="document.getElementById('widevine-guide-overlay').remove()" style="border:none;background:transparent;color:var(--tx2);font-size:18px;cursor:pointer">✕</button>
      </div>
      <div style="overflow-y:auto;padding:20px;flex:1;display:flex;flex-direction:column;gap:14px">
        <div style="background:rgba(239,83,80,.1);border:1px solid var(--danger);border-radius:var(--r-sm);padding:12px 16px;font-size:12px">
          ⚠ <b>Du brauchst genau 3 Dateien:</b><br><br>
          <b>Ordner 1:</b> <code style="background:var(--bgc);padding:1px 5px;border-radius:3px">WidevineCdm\_platform_specific\win_x64\</code><br>
          &nbsp;&nbsp;→ <code style="background:var(--bgc);padding:1px 5px;border-radius:3px">widevinecdm.dll</code> + <code style="background:var(--bgc);padding:1px 5px;border-radius:3px">widevinecdm.dll.sig</code><br><br>
          <b>Ordner 2:</b> <code style="background:var(--bgc);padding:1px 5px;border-radius:3px">WidevineCdm\</code> (eine Ebene höher)<br>
          &nbsp;&nbsp;→ <code style="background:var(--bgc);padding:1px 5px;border-radius:3px">manifest.json</code>
        </div>
        <div style="background:var(--accg);border:1px solid var(--acc);border-radius:var(--r-sm);padding:12px 16px;font-size:12px">
          📁 In Chrome liegt die Struktur so: <code style="background:var(--bgc);padding:1px 5px;border-radius:3px">Chrome\Application\[Version]\WidevineCdm\</code><br>
          Dort siehst du: <b>manifest.json</b> (hier) und <b>_platform_specific\win_x64\</b> mit den 2 anderen Dateien.
        </div>
        ${[1,2,3,4,5].map((n,i) => {
          const steps = [
            {t:'Chrome-Ordner öffnen', d:'Klicke auf den Button um den WidevineCdm-Ordner von Chrome zu öffnen.',
             btns:[{l:'📁 Chrome',fn:"window._openWvFolder('chrome'"},{l:'📁 Edge',fn:"window._openWvFolder('edge'"}]},
            {t:'Versionsordner öffnen', d:'Öffne den Ordner mit der Versionsnummer (z.B. 4.10.x.x).'},
            {t:'manifest.json kopieren', d:'Kopiere die manifest.json aus dem WidevineCdm-Ordner in den OmniHub WidevineCdm-Ordner.',
             btns:[{l:'📁 Ziel WidevineCdm',fn:"window._openWvFolder('cdmBase'"}]},
            {t:'DLL + .sig kopieren', d:'Öffne _platform_specific → win_x64. Kopiere widevinecdm.dll und widevinecdm.dll.sig in den OmniHub win_x64-Ordner.',
             btns:[{l:'📁 Ziel win_x64',fn:"window._openWvFolder('dest'"}]},
            {t:'App neu starten', d:'Schließe OmniHub komplett und starte es neu. Netflix, Disney+ und Crunchyroll sollten jetzt funktionieren.', ok:true},
          ];
          const s = steps[i];
          return `<div style="display:flex;gap:10px">
            <div style="width:24px;height:24px;border-radius:50%;background:${s.ok?'#66bb6a':'var(--acc)'};color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">${n}</div>
            <div><div style="font-size:13px;font-weight:600;color:var(--tx);margin-bottom:3px">${s.t}</div>
            <div style="font-size:12px;color:var(--tx2)">${s.d}</div>
            ${s.btns?`<div style="display:flex;gap:6px;margin-top:6px">${s.btns.map(b=>`<button onclick="${b.fn})" style="padding:5px 12px;background:var(--acc);color:#fff;border:none;border-radius:var(--r-sm);font-size:11px;cursor:pointer">${b.l}</button>`).join('')}</div>`:''}
            </div></div>`;
        }).join('')}
      </div>
      <div style="padding:12px 20px;border-top:1px solid var(--bor);display:flex;justify-content:flex-end">
        <button onclick="document.getElementById('widevine-guide-overlay').remove()" style="padding:8px 20px;background:var(--acc);color:#fff;border:none;border-radius:var(--r-sm);font-family:var(--font-d);font-weight:700;cursor:pointer">Verstanden</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// _openWvFolder: auch cdmBase öffnen
window._openWvFolder = async function(type) {
  try {
    const status = await window.electronAPI.getWidevineStatus();
    let targetPath = '';
    if (type === 'dest')    targetPath = status?.cdmDir  || '';
    else if (type === 'cdmBase') targetPath = status?.cdmBase || '';
    else if (type === 'chrome') targetPath = 'C:\\Program Files\\Google\\Chrome\\Application';
    else if (type === 'edge')   targetPath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application';
    if (!targetPath) { showToastMsg('Pfad nicht gefunden'); return; }
    window.electronAPI.openExternal('file:///' + targetPath.replace(/\\/g, '/'));
  } catch(e) { showToastMsg('Ordner konnte nicht geöffnet werden'); }
};

console.log('[v3.2.6] Miniplayer, Partikel, Design, WideVine, Plugins gepatcht');

// ════════════════════════════════════════════════════════════════════
// v3.2.7 FIXES
// ════════════════════════════════════════════════════════════════════

// ── 1. SUCHE: Außen-Klick WIRKLICH schließen ─────────────────────────

(function fixSearchClose() {
  // Jedes Mal wenn setupSearch() aufgerufen wurde, wurde ein neuer
  // 'mousedown' capture-Listener hinzugefügt. Wir nutzen ein Flag.
  if (window._searchCloseInstalled) return;
  window._searchCloseInstalled = true;

  document.addEventListener('mousedown', function(e) {
    const dd    = document.getElementById('search-dropdown');
    const input = document.getElementById('search-input');
    if (!dd || dd.style.display === 'none') return;

    const wrap = input?.closest('.search-bar') ||
                 input?.closest('.home-actions') ||
                 input?.parentElement;

    if (!wrap?.contains(e.target) && !dd.contains(e.target)) {
      dd.style.display = 'none';
    }
  }, true); // capture = true, läuft vor allen anderen Listenern
})();

// ── 2. UPDATE: Download/Install Buttons verdrahten ───────────────────

(function setupUpdateButtons() {
  setTimeout(() => {
    const dlBtn  = document.getElementById('btn-download-update');
    const instBtn= document.getElementById('btn-install-update');

    if (dlBtn && !dlBtn._updateBound) {
      dlBtn._updateBound = true;
      dlBtn.style.display = 'none'; // erst bei Update einblenden
      dlBtn.addEventListener('click', () => {
        dlBtn.textContent = '⬇ Lädt…';
        dlBtn.disabled    = true;
        window.electronAPI.downloadUpdate();
      });
    }

    if (instBtn && !instBtn._updateBound) {
      instBtn._updateBound = true;
      instBtn.style.display = 'none';
      instBtn.addEventListener('click', () => {
        instBtn.textContent = '↺ Wird installiert…';
        instBtn.disabled    = true;
        window.electronAPI.installUpdate();
      });
    }

    // onUpdateDownloaded: Install-Button einblenden
    window.electronAPI.onUpdateDownloaded?.(() => {
      if (dlBtn)   dlBtn.style.display   = 'none';
      if (instBtn) {
        instBtn.style.display   = 'flex';
        instBtn.disabled        = false;
        instBtn.textContent     = '↺ Jetzt installieren';
      }
      // Update-Check Ergebnis
      const el = document.getElementById('update-check-result');
      if (el) { el.textContent = '✓ Update heruntergeladen – bereit zur Installation'; el.style.color = 'var(--acc)'; }
    });

    // Fortschritt
    window.electronAPI.onUpdateDownloadProgress?.((pct) => {
      if (dlBtn) dlBtn.textContent = `⬇ ${pct}%`;
    });
  }, 800);
})();

// ── 3. WIDEVINE GUIDE: In Einstellungen ──────────────────────────────

(function bindWidevineGuideBtn() {
  setTimeout(() => {
    const btn = document.getElementById('btn-widevine-guide');
    if (btn && !btn._wvBound) {
      btn._wvBound = true;
      btn.addEventListener('click', () => {
        if (typeof openWidevineGuide === 'function') openWidevineGuide();
        else console.warn('openWidevineGuide nicht gefunden');
      });
    }
  }, 700);
})();

// ── 4. MINIPLAYER: Auto-Aktivierung einstellbar ───────────────────────

// pip-auto-enable Toggle verdrahten
(function bindPipAutoToggle() {
  setTimeout(() => {
    const toggle = document.getElementById('pip-auto-enable');
    if (!toggle || toggle._pipBound) return;
    toggle._pipBound = true;
    toggle.checked = settings.pipAutoEnable !== false; // default: an
    toggle.addEventListener('change', () => {
      settings.pipAutoEnable = toggle.checked;
      autoSave();
      showToastMsg(toggle.checked ? '🎬 Miniplayer aktiviert sich automatisch' : '🎬 Miniplayer: manuell');
    });
  }, 700);
})();

// maybeMoveToPip: nur wenn pipAutoEnable aktiv
const _origMaybeMoveToPip = typeof maybeMoveToPip === 'function' ? maybeMoveToPip : null;
window.maybeMoveToPip = function() {
  // Nur automatisch wenn Einstellung aktiv
  if (settings.pipAutoEnable === false) return; // manuell deaktiviert
  if (typeof moveToPip === 'function' && window.moveToPip && currentWebview && currentProvider) {
    window.moveToPip(currentProvider, currentWebview);
  } else if (_origMaybeMoveToPip) {
    _origMaybeMoveToPip();
  }
};

// ── 5. KARTEN: Qualitäts-Badge ohne Hintergrund ──────────────────────

(function fixQualityBadge() {
  const style = document.createElement('style');
  style.textContent = `
    .card-quality-badge {
      background: transparent !important;
      color: rgba(255,255,255,0.6) !important;
      font-size: 9px !important;
      font-weight: 700 !important;
      padding: 0 !important;
      border-radius: 0 !important;
      text-shadow: 0 1px 3px rgba(0,0,0,0.8) !important;
    }
  `;
  document.head.appendChild(style);
})();

// ── 6. PROFIL-EDITOR: Komplett repariert ─────────────────────────────

// openProfileEditor überschreiben – sicher ohne Rekursion
window._openProfileEditorSafe = function(id) {
  const p = id ? (typeof profiles !== 'undefined' ? profiles.find(pr => pr.id === id) : null) : null;
  window._pedId     = id || null;
  window._pedAvatar = undefined;
  window._pedPin    = undefined;

  // Overlay holen
  const overlay = document.getElementById('profile-editor-overlay');
  if (!overlay) { console.warn('[Profile] Overlay nicht gefunden'); return; }

  // Felder befüllen
  const titleEl = document.getElementById('ped-title');
  const nameEl  = document.getElementById('ped-name');
  const prevEl  = document.getElementById('ped-avatar-preview');
  const pinEl   = document.getElementById('ped-pin-status');
  const delBtn  = document.getElementById('ped-delete');
  const cancelBtn = document.getElementById('ped-cancel');

  if (titleEl) titleEl.textContent = p ? 'Profil bearbeiten' : 'Neues Profil';
  if (nameEl)  { nameEl.value = p?.name || ''; setTimeout(() => nameEl.focus(), 100); }
  if (prevEl)  prevEl.innerHTML = p?.avatar
    ? `<img src="${p.avatar}" style="width:56px;height:56px;border-radius:50%;object-fit:cover"/>`
    : `<div style="width:56px;height:56px;border-radius:50%;background:var(--bgch);display:flex;align-items:center;justify-content:center;font-size:28px">👤</div>`;
  if (pinEl)   pinEl.textContent = p?.pin ? '🔒 PIN aktiv' : '🔓 Kein PIN';
  if (delBtn) {
    const canDelete = p && (typeof profiles !== 'undefined' ? profiles.length > 1 : false);
    delBtn.style.display = canDelete ? 'flex' : 'none';
  }

  overlay.style.display = 'flex';
  overlay.style.zIndex  = '4000';

  // Außen-Klick schließt (einmalig registrieren)
  if (!overlay._outsideClick) {
    overlay._outsideClick = true;
    overlay.addEventListener('mousedown', e => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
        window._pedId = null;
      }
    });
  }
};

// Alle Edit-Trigger verdrahten (nach DOM-Aufbau)
(function bindProfileTriggers() {
  const bind = () => {
    // Stift-Buttons in Profil-Liste
    document.querySelectorAll('.profile-edit-trigger').forEach(btn => {
      if (btn._trigBound) return;
      btn._trigBound = true;
      btn.addEventListener('click', e => {
        e.stopPropagation();
        window._openProfileEditorSafe(btn.dataset.profileId);
      });
    });
    // Neues Profil Button
    const newBtn = document.getElementById('btn-new-profile');
    if (newBtn && !newBtn._newBound) {
      newBtn._newBound = true;
      newBtn.addEventListener('click', () => window._openProfileEditorSafe(null));
    }
  };
  setTimeout(bind, 700);
  // Auch nach buildSidebarProfile neu binden
  const origBSP = window.buildSidebarProfile;
  if (typeof origBSP === 'function') {
    window.buildSidebarProfile = function() {
      origBSP.apply(this, arguments);
      setTimeout(bind, 100);
    };
  }
})();

// Profil-Editor Buttons: einmalig verdrahten ohne doppelte Handler
(function setupProfileEditorV327() {
  const bindEditorBtns = () => {
    const overlay = document.getElementById('profile-editor-overlay');
    if (!overlay || overlay._v327Done) return;
    overlay._v327Done = true;

    // SPEICHERN
    const saveBtn = document.getElementById('ped-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const pedId = window._pedId;
        const name  = (document.getElementById('ped-name')?.value || '').trim() || 'User';
        let pinSave = undefined;

        if (window._pedPin !== undefined) {
          if (!window._pedPin) {
            pinSave = null;
          } else if (/^\d{4,8}$/.test(String(window._pedPin))) {
            try { pinSave = await window.electronAPI.hashPin(String(window._pedPin)); }
            catch { pinSave = window._pedPin; }
          } else {
            pinSave = window._pedPin;
          }
        }

        if (typeof profiles === 'undefined') { showToastMsg('Fehler: profiles nicht definiert'); return; }

        if (pedId) {
          const idx = profiles.findIndex(p => p.id === pedId);
          if (idx >= 0) {
            profiles[idx].name = name;
            if (window._pedAvatar !== undefined) profiles[idx].avatar = window._pedAvatar;
            if (pinSave !== undefined) profiles[idx].pin = pinSave;
          }
        } else {
          profiles.push({
            id: 'profile_' + Date.now(), name,
            avatar: window._pedAvatar || null,
            pin: pinSave || null,
            favorites: [], watchlist: [], searchHistory: [], viewHistory: [],
          });
        }

        window.electronAPI.setProfiles(profiles);
        overlay.style.display = 'none';
        window._pedId = null; window._pedPin = undefined; window._pedAvatar = undefined;
        if (typeof buildSidebarProfile === 'function') buildSidebarProfile();
        showSaveToast();
      });
    }

    // ABBRECHEN
    document.getElementById('ped-cancel')?.addEventListener('click', () => {
      overlay.style.display = 'none';
      window._pedId = null;
    });

    // LÖSCHEN
    document.getElementById('ped-delete')?.addEventListener('click', async () => {
      const pedId = window._pedId;
      if (!pedId || !profiles || profiles.length <= 1) { showToastMsg('Mindestens 1 Profil erforderlich'); return; }
      const profile = profiles.find(p => p.id === pedId);
      if (!profile) return;

      if (profile.pin) {
        const entered = prompt(`PIN für "${profile.name}" eingeben:`);
        if (entered === null) return;
        let valid = false;
        try { valid = await window.electronAPI.verifyPin(String(entered), profile.pin); }
        catch { valid = String(entered) === String(profile.pin); }
        if (!valid) { showToastMsg('Falscher PIN'); return; }
      }
      if (!confirm(`Profil "${profile.name}" wirklich löschen?`)) return;

      profiles = profiles.filter(p => p.id !== pedId);
      window.electronAPI.setProfiles(profiles);
      overlay.style.display = 'none';
      window._pedId = null;
      if (activeProfileId === pedId) {
        if (typeof switchProfile === 'function') switchProfile(profiles[0].id);
      } else {
        if (typeof buildSidebarProfile === 'function') buildSidebarProfile();
      }
      showToastMsg('Profil gelöscht');
    });

    // AVATAR
    document.getElementById('ped-pick-avatar')?.addEventListener('click', async () => {
      const r = await window.electronAPI.pickImage('avatar').catch(() => null);
      if (!r) return;
      const url = r.base64 || r.filePath || r;
      window._pedAvatar = url;
      const prev = document.getElementById('ped-avatar-preview');
      if (prev) prev.innerHTML = `<img src="${url}" style="width:56px;height:56px;border-radius:50%;object-fit:cover"/>`;
    });

    // PIN
    document.getElementById('ped-set-pin')?.addEventListener('click', async () => {
      const pedId   = window._pedId;
      const profile = pedId ? profiles?.find(p => p.id === pedId) : null;
      if (profile?.pin) {
        const old = prompt('Aktuellen PIN eingeben:');
        if (old === null) return;
        let valid = false;
        try { valid = await window.electronAPI.verifyPin(String(old), profile.pin); }
        catch { valid = String(old) === String(profile.pin); }
        if (!valid) { showToastMsg('Falscher PIN'); return; }
      }
      const newPin = prompt('Neuen PIN (4-8 Ziffern, leer = entfernen):');
      if (newPin === null) return;
      if (newPin === '') {
        window._pedPin = '';
        const ps = document.getElementById('ped-pin-status');
        if (ps) ps.textContent = '🔓 PIN wird entfernt';
        showToastMsg('PIN wird beim Speichern entfernt');
        return;
      }
      if (!/^\d{4,8}$/.test(newPin)) { showToastMsg('PIN: 4-8 Ziffern'); return; }
      window._pedPin = newPin;
      const ps = document.getElementById('ped-pin-status');
      if (ps) ps.textContent = '🔒 Neuer PIN (noch nicht gespeichert)';
      showToastMsg('PIN gesetzt – Speichern nicht vergessen!');
    });
  };

  setTimeout(bindEditorBtns, 800);
})();

// openProfileEditor global überschreiben
window.openProfileEditor = function(id) {
  window._openProfileEditorSafe(id);
};

console.log('[v3.2.7] Suche, Update, WideVine, PIP, Karte, Profil gepatcht');

// ════════════════════════════════════════════════════════════════════
// v3.3.0 FIXES
// ════════════════════════════════════════════════════════════════════

// ── 1. PROFIL-EDITOR: Komplett neu aufgebaut ─────────────────────────

(function buildProfileEditorFresh() {
  // Erstelle den Profil-Editor neu wenn er nicht korrekt im HTML ist
  function ensureProfileEditorExists() {
    if (document.getElementById('profile-editor-overlay')) return;

    const ov = document.createElement('div');
    ov.id = 'profile-editor-overlay';
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:4000;display:none;align-items:center;justify-content:center';
    ov.innerHTML = `
      <div style="background:var(--bg2);border:1px solid var(--borh);border-radius:var(--r);
        width:min(420px,95%);box-shadow:0 24px 60px rgba(0,0,0,.6);overflow:hidden">
        <div style="display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid var(--bor)">
          <span id="ped-title" style="font-family:var(--font-d);font-size:16px;font-weight:800;color:var(--tx);flex:1">Profil bearbeiten</span>
          <button id="ped-x" style="background:transparent;border:none;color:var(--tx2);font-size:18px;cursor:pointer;line-height:1">✕</button>
        </div>
        <div style="padding:20px;display:flex;flex-direction:column;gap:14px">
          <!-- Avatar -->
          <div style="display:flex;align-items:center;gap:14px">
            <div id="ped-avatar-preview" style="width:64px;height:64px;border-radius:50%;overflow:hidden;background:var(--bgch);display:flex;align-items:center;justify-content:center;font-size:28px;cursor:pointer;border:2px solid var(--bor);flex-shrink:0">👤</div>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--tx);margin-bottom:4px">Profilbild</div>
              <button id="ped-pick-avatar" class="pick-btn" style="font-size:11px;padding:4px 10px">🖼 Bild wählen</button>
            </div>
          </div>
          <!-- Name -->
          <div>
            <label style="font-size:12px;color:var(--tx2);font-weight:600;display:block;margin-bottom:5px">Name</label>
            <input id="ped-name" type="text" maxlength="30" placeholder="Profilname…"
              style="width:100%;background:var(--bgc);border:1px solid var(--bor);color:var(--tx);
                border-radius:var(--r-sm);padding:8px 12px;outline:none;box-sizing:border-box;font-family:inherit"/>
          </div>
          <!-- PIN -->
          <div style="display:flex;align-items:center;justify-content:space-between;background:var(--bgc);border:1px solid var(--bor);border-radius:var(--r-sm);padding:10px 12px">
            <div>
              <div style="font-size:12px;font-weight:600;color:var(--tx)">PIN-Schutz</div>
              <div id="ped-pin-status" style="font-size:11px;color:var(--tx3);margin-top:2px">🔓 Kein PIN</div>
            </div>
            <div style="display:flex;gap:6px">
              <button id="ped-set-pin" style="padding:5px 10px;background:var(--accg);border:1px solid var(--acc);color:var(--acc);border-radius:var(--r-sm);font-size:11px;cursor:pointer">PIN setzen</button>
              <button id="ped-remove-pin" style="padding:5px 10px;background:transparent;border:1px solid var(--bor);color:var(--tx2);border-radius:var(--r-sm);font-size:11px;cursor:pointer;display:none">Entfernen</button>
            </div>
          </div>
        </div>
        <div style="display:flex;gap:8px;padding:14px 20px;border-top:1px solid var(--bor);justify-content:space-between">
          <button id="ped-delete" style="padding:8px 14px;background:rgba(239,83,80,.1);border:1px solid #ef5350;color:#ef5350;border-radius:var(--r-sm);font-size:12px;cursor:pointer;display:none">🗑 Löschen</button>
          <div style="display:flex;gap:8px;margin-left:auto">
            <button id="ped-cancel" style="padding:8px 16px;background:transparent;border:1px solid var(--bor);color:var(--tx2);border-radius:var(--r-sm);font-family:var(--font-d);font-weight:600;cursor:pointer">Abbrechen</button>
            <button id="ped-save" style="padding:8px 20px;background:var(--acc);color:#fff;border:none;border-radius:var(--r-sm);font-family:var(--font-d);font-weight:700;cursor:pointer">Speichern</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(ov);
  }

  function setupEditorLogic() {
    const overlay = document.getElementById('profile-editor-overlay');
    if (!overlay || overlay._editorReady) return;
    overlay._editorReady = true;

    // Schließen
    overlay.addEventListener('mousedown', e => { if (e.target === overlay) closeEditor(); });
    document.getElementById('ped-x')?.addEventListener('click', closeEditor);
    document.getElementById('ped-cancel')?.addEventListener('click', closeEditor);

    // Avatar klickbar
    document.getElementById('ped-avatar-preview')?.addEventListener('click', pickAvatar);
    document.getElementById('ped-pick-avatar')?.addEventListener('click', pickAvatar);

    // Speichern
    document.getElementById('ped-save')?.addEventListener('click', saveProfile);

    // Löschen
    document.getElementById('ped-delete')?.addEventListener('click', deleteProfile);

    // PIN setzen
    document.getElementById('ped-set-pin')?.addEventListener('click', setPin);
    document.getElementById('ped-remove-pin')?.addEventListener('click', removePin);

    // Enter speichert
    document.getElementById('ped-name')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') saveProfile();
      if (e.key === 'Escape') closeEditor();
    });
  }

  function closeEditor() {
    const ov = document.getElementById('profile-editor-overlay');
    if (ov) ov.style.display = 'none';
    window._pedId = null;
    window._pedAvatar = undefined;
    window._pedPin = undefined;
  }

  async function pickAvatar() {
    const r = await window.electronAPI.pickImage('avatar').catch(() => null);
    if (!r) return;
    const url = r.base64 || r.filePath || r;
    window._pedAvatar = url;
    const prev = document.getElementById('ped-avatar-preview');
    if (prev) prev.innerHTML = `<img src="${url}" style="width:100%;height:100%;object-fit:cover"/>`;
  }

  async function setPin() {
    const pedId = window._pedId;
    const profile = pedId ? (profiles||[]).find(p => p.id === pedId) : null;
    if (profile?.pin) {
      const old = prompt('Aktuellen PIN eingeben:');
      if (old === null) return;
      let ok = false;
      try { ok = await window.electronAPI.verifyPin(String(old), profile.pin); } catch { ok = String(old) === profile.pin; }
      if (!ok) { showToastMsg('Falscher PIN'); return; }
    }
    const np = prompt('Neuen PIN (4-8 Ziffern):');
    if (np === null) return;
    if (!/^\d{4,8}$/.test(np)) { showToastMsg('PIN muss 4-8 Ziffern haben'); return; }
    window._pedPin = np;
    const ps = document.getElementById('ped-pin-status');
    if (ps) ps.textContent = '🔒 Neuer PIN (nicht gespeichert)';
    const rb = document.getElementById('ped-remove-pin');
    if (rb) rb.style.display = 'inline-block';
    showToastMsg('PIN gesetzt – Speichern nicht vergessen');
  }

  function removePin() {
    window._pedPin = '';
    const ps = document.getElementById('ped-pin-status');
    if (ps) ps.textContent = '🔓 PIN wird entfernt';
    showToastMsg('PIN wird beim Speichern entfernt');
  }

  async function saveProfile() {
    const name = (document.getElementById('ped-name')?.value || '').trim() || 'User';
    const pedId = window._pedId;
    let pinSave = undefined;

    if (window._pedPin !== undefined) {
      if (window._pedPin === '') {
        pinSave = null;
      } else if (/^\d{4,8}$/.test(String(window._pedPin))) {
        try { pinSave = await window.electronAPI.hashPin(String(window._pedPin)); }
        catch { pinSave = window._pedPin; }
      }
    }

    if (pedId) {
      const idx = (profiles||[]).findIndex(p => p.id === pedId);
      if (idx >= 0) {
        profiles[idx].name = name;
        if (window._pedAvatar !== undefined) profiles[idx].avatar = window._pedAvatar;
        if (pinSave !== undefined) profiles[idx].pin = pinSave;
      }
    } else {
      if (!profiles) window.profiles = [];
      profiles.push({
        id: 'profile_' + Date.now(), name,
        avatar: window._pedAvatar || null,
        pin: pinSave || null,
        favorites: [], watchlist: [], searchHistory: [], viewHistory: [],
      });
    }

    window.electronAPI.setProfiles(profiles);
    closeEditor();
    if (typeof buildSidebarProfile === 'function') buildSidebarProfile();
    showSaveToast();
  }

  async function deleteProfile() {
    const pedId = window._pedId;
    if (!pedId || !profiles || profiles.length <= 1) {
      showToastMsg('Mindestens 1 Profil erforderlich'); return;
    }
    const p = profiles.find(pr => pr.id === pedId);
    if (!p) return;

    if (p.pin) {
      const entered = prompt(`PIN für "${p.name}" eingeben:`);
      if (!entered) return;
      let ok = false;
      try { ok = await window.electronAPI.verifyPin(String(entered), p.pin); }
      catch { ok = String(entered) === p.pin; }
      if (!ok) { showToastMsg('Falscher PIN'); return; }
    }

    if (!confirm(`Profil "${p.name}" wirklich löschen?`)) return;
    profiles = profiles.filter(pr => pr.id !== pedId);
    window.electronAPI.setProfiles(profiles);
    closeEditor();
    if (activeProfileId === pedId) { if (typeof switchProfile==='function') switchProfile(profiles[0].id); }
    else if (typeof buildSidebarProfile==='function') buildSidebarProfile();
    showToastMsg('Profil gelöscht');
  }

  // Globale openProfileEditor Funktion
  window.openProfileEditor = function(id) {
    ensureProfileEditorExists();
    setupEditorLogic();

    const p = id ? (profiles||[]).find(pr => pr.id === id) : null;
    window._pedId = id || null;
    window._pedAvatar = undefined;
    window._pedPin = undefined;

    const titleEl = document.getElementById('ped-title');
    const nameEl  = document.getElementById('ped-name');
    const prevEl  = document.getElementById('ped-avatar-preview');
    const pinEl   = document.getElementById('ped-pin-status');
    const delBtn  = document.getElementById('ped-delete');
    const remPinBtn = document.getElementById('ped-remove-pin');

    if (titleEl) titleEl.textContent = p ? 'Profil bearbeiten' : 'Neues Profil';
    if (nameEl)  { nameEl.value = p?.name || ''; setTimeout(() => nameEl.focus(), 100); }
    if (prevEl)  prevEl.innerHTML = p?.avatar
      ? `<img src="${p.avatar}" style="width:100%;height:100%;object-fit:cover"/>`
      : '👤';
    if (pinEl)   pinEl.textContent = p?.pin ? '🔒 PIN aktiv' : '🔓 Kein PIN';
    if (delBtn)  delBtn.style.display = (p && profiles.length > 1) ? 'flex' : 'none';
    if (remPinBtn) remPinBtn.style.display = p?.pin ? 'inline-block' : 'none';

    const ov = document.getElementById('profile-editor-overlay');
    if (ov) ov.style.display = 'flex';
  };

  // Wrapper für _openProfileEditorSafe
  window._openProfileEditorSafe = window.openProfileEditor;

  console.log('[v3.3.0] Profil-Editor neu aufgebaut');
})();

// ── 2. KARTEN: Favoriten-Button verbessert ───────────────────────────

(function fixFavoriteButton() {
  document.addEventListener('mouseover', e => {
    const card = e.target.closest?.('.provider-card');
    if (!card) return;
    const bm = card.querySelector('.card-bookmark');
    if (!bm) return;
    bm.style.opacity = '1';
  });
  document.addEventListener('mouseout', e => {
    const card = e.target.closest?.('.provider-card');
    if (!card) return;
    const bm = card.querySelector('.card-bookmark');
    if (!bm) return;
    const id = card.dataset.id;
    const isFav = (settings?.favorites||[]).includes(id);
    bm.style.opacity = isFav ? '1' : '0'; // Fav-Karten zeigen immer
  });
})();

// CSS für Favoriten-Button
(function injectFavCSS() {
  const style = document.createElement('style');
  style.textContent = `
    /* Favoriten: kein Hintergrund, nur beim Hover oder wenn aktiv */
    .card-bookmark {
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
      opacity: 0;
      transition: opacity .15s;
    }
    .card-bookmark svg { stroke: rgba(255,255,255,0.7); fill: none; transition: stroke .15s, fill .15s; }
    .card-bookmark.active svg { stroke: #ffd600 !important; fill: #ffd600 !important; }
    .provider-card:hover .card-bookmark { opacity: 1; }
    .card-bookmark.active { opacity: 1; }

    /* Qualitäts-Badge: kein Hintergrund */
    .card-quality-badge {
      background: transparent !important;
      color: rgba(255,255,255,.65) !important;
      font-size: 9px !important;
      font-weight: 700 !important;
      padding: 0 !important;
      text-shadow: 0 1px 3px rgba(0,0,0,.9) !important;
    }

    /* Neuigkeiten/Upcoming: Merken-Button nur bei Hover */
    .slide-bm-btn-v2 { opacity: 0; transition: opacity .15s; }
    .slide-card:hover .slide-bm-btn-v2 { opacity: 1; }
    .slide-bm-btn-v2.bookmarked { opacity: 1; }
    .slide-hide-btn-v2 { opacity: 0; transition: opacity .15s; }
    .slide-card:hover .slide-hide-btn-v2 { opacity: 1; }

    /* Animationen deaktivieren falls eingestellt */
    .no-animations * { transition: none !important; animation: none !important; }
  `;
  document.head.appendChild(style);
})();

// ── 3. DRAG & DROP: Anbieterkarten verbessert ────────────────────────

(function setupCardDragDrop() {
  const grid = document.getElementById('providers-grid');
  if (!grid || grid._dndSetup) return;
  grid._dndSetup = true;

  let dragging = null;
  let placeholder = null;

  grid.addEventListener('dragstart', e => {
    dragging = e.target.closest('.provider-card');
    if (!dragging) return;
    dragging.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
    placeholder = document.createElement('div');
    placeholder.className = 'dnd-placeholder';
    placeholder.style.cssText = `
      width:${dragging.offsetWidth}px;
      height:${dragging.offsetHeight}px;
      background:var(--accg);
      border:2px dashed var(--acc);
      border-radius:var(--r);
      pointer-events:none;
    `;
  });

  grid.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('.provider-card');
    if (!target || target === dragging) return;

    const rect = target.getBoundingClientRect();
    const after = e.clientX > rect.left + rect.width / 2;

    if (placeholder?.parentNode) placeholder.remove();
    if (after) target.after(placeholder);
    else target.before(placeholder);
  });

  grid.addEventListener('dragend', e => {
    if (dragging) dragging.style.opacity = '';
    if (placeholder?.parentNode) {
      placeholder.parentNode.replaceChild(dragging, placeholder);
    }
    placeholder = null;

    // Neue Reihenfolge speichern
    const order = [...grid.querySelectorAll('.provider-card')].map(c => c.dataset.id).filter(Boolean);
    settings.providerOrder = order;
    autoSave();
    dragging = null;
  });

  grid.addEventListener('dragleave', e => {
    if (!grid.contains(e.relatedTarget) && placeholder?.parentNode) {
      placeholder.remove();
    }
  });
})();

// Karten draggable machen nach buildProviderGrid
const _origBuildGrid = typeof buildProviderGrid === 'function' ? buildProviderGrid : null;
if (_origBuildGrid) {
  window.buildProviderGrid = function() {
    _origBuildGrid.apply(this, arguments);
    setTimeout(() => {
      document.querySelectorAll('.provider-card').forEach(card => {
        card.setAttribute('draggable', 'true');
        // Favoriten-Status CSS
        const id = card.dataset.id;
        const bm = card.querySelector('.card-bookmark');
        if (bm && id) {
          const isFav = (settings?.favorites||[]).includes(id);
          bm.classList.toggle('active', isFav);
        }
      });
      // DnD neu aufsetzen
      const grid = document.getElementById('providers-grid');
      if (grid) { grid._dndSetup = false; setupCardDragDrop(); }
    }, 100);
  };
}

// ── 4. SUCHVERLAUF: Mit Lösch-Funktion ───────────────────────────────

function renderSearchHistory(dd) {
  if (!searchHistory || !searchHistory.length) { dd.style.display = 'none'; return; }
  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;
      padding:8px 14px 4px;border-bottom:1px solid var(--bor)">
      <span style="font-size:11px;font-weight:700;color:var(--tx2);text-transform:uppercase;letter-spacing:.08em">Zuletzt gesucht</span>
      <button id="dd-clear-all" style="background:transparent;border:none;color:var(--tx3);font-size:11px;cursor:pointer;padding:2px 6px">Alle löschen</button>
    </div>`;

  searchHistory.slice(0, 12).forEach((q, i) => {
    html += `
      <div class="search-dd-history-item" style="display:flex;align-items:center;gap:8px;padding:7px 14px;cursor:pointer;transition:background .12s">
        <span style="color:var(--tx3);font-size:13px">🕐</span>
        <span class="dd-hist-q" data-q="${esc(q)}" style="flex:1;font-size:13px;color:var(--tx2)">${esc(q)}</span>
        <button class="dd-hist-del" data-i="${i}"
          style="background:transparent;border:none;color:var(--tx3);font-size:13px;cursor:pointer;padding:2px 5px;line-height:1;opacity:0;transition:opacity .15s"
          title="Löschen">✕</button>
      </div>`;
  });

  dd.innerHTML = html;
  dd.style.display = 'block';

  // Hover-Effekte für Zeilen
  dd.querySelectorAll('.search-dd-history-item').forEach(row => {
    row.addEventListener('mouseenter', () => {
      row.style.background = 'var(--bgc)';
      row.querySelector('.dd-hist-del').style.opacity = '1';
    });
    row.addEventListener('mouseleave', () => {
      row.style.background = '';
      row.querySelector('.dd-hist-del').style.opacity = '0';
    });
    row.querySelector('.dd-hist-q')?.addEventListener('click', () => {
      const inp = document.getElementById('search-input');
      if (inp) { inp.value = row.querySelector('.dd-hist-q').dataset.q; inp.dispatchEvent(new Event('input')); }
    });
    row.querySelector('.dd-hist-del')?.addEventListener('click', e => {
      e.stopPropagation();
      const i = parseInt(e.target.dataset.i);
      searchHistory.splice(i, 1);
      settings.searchHistory = searchHistory;
      autoSave();
      renderSearchHistory(dd);
    });
  });

  document.getElementById('dd-clear-all')?.addEventListener('click', e => {
    e.stopPropagation();
    searchHistory = [];
    settings.searchHistory = [];
    autoSave();
    dd.style.display = 'none';
  });
}

// ── 5. SUCHE: Ergebnisse nach Erscheinungsjahr sortieren ─────────────

const _origRunTmdbSearch3 = typeof runTmdbSearch === 'function' ? runTmdbSearch : null;
if (_origRunTmdbSearch3) {
  window.runTmdbSearch = async function(q, page = 1, signal = null) {
    // Suchbegriff MUSS im Titel vorkommen
    window._searchFilter = q.trim().toLowerCase();
    return _origRunTmdbSearch3.apply(this, arguments);
  };
}

// bindSearchResults überschreiben: nach Jahr sortieren + Wort-Filter
const _origBindSearch = typeof bindSearchResults === 'function' ? bindSearchResults : null;
if (_origBindSearch) {
  window.bindSearchResults = function(dd, q, page) {
    // Items nach Datum sortieren (neueste zuerst)
    const items = dd.querySelectorAll('.search-dd-film');
    const itemsArr = [...items];
    const sorted = itemsArr.sort((a, b) => {
      const ya = parseInt(a.querySelector('.search-dd-meta span:nth-child(2)')?.textContent || '0');
      const yb = parseInt(b.querySelector('.search-dd-meta span:nth-child(2)')?.textContent || '0');
      return yb - ya; // Neueste zuerst
    });
    const parent = items[0]?.parentNode;
    if (parent) sorted.forEach(el => parent.appendChild(el));

    _origBindSearch.apply(this, arguments);
  };
}

// ── 6. UHR: Drag & Drop im Vordergrund ───────────────────────────────

(function ensureClockDraggable() {
  setTimeout(() => {
    const w = document.getElementById('clock-widget');
    if (!w || w._clockDragSetup) return;
    w._clockDragSetup = true;
    w.style.zIndex = '9500';

    let isDragging = false, ox = 0, oy = 0;
    w.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      isDragging = true;
      const rect = w.getBoundingClientRect();
      ox = e.clientX - rect.left;
      oy = e.clientY - rect.top;
      w.style.cursor = 'grabbing';
      e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
      if (!isDragging) return;
      let x = e.clientX - ox;
      let y = e.clientY - oy;
      x = Math.max(0, Math.min(window.innerWidth - w.offsetWidth, x));
      y = Math.max(0, Math.min(window.innerHeight - w.offsetHeight, y));
      w.style.left = x + 'px'; w.style.top = y + 'px';
      w.style.right = 'auto'; w.style.bottom = 'auto';
      settings.clock = settings.clock || {};
      settings.clock.position = { x, y };
    });
    document.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      w.style.cursor = '';
      autoSave();
    });

    // Kontextmenü (Rechtsklick)
    w.addEventListener('contextmenu', e => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById('clock-ctx-menu')?.remove();
      const menu = document.createElement('div');
      menu.id = 'clock-ctx-menu';
      menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;
        background:var(--bg2);border:1px solid var(--borh);border-radius:var(--r-sm);
        padding:4px;z-index:99999;min-width:160px;box-shadow:0 8px 24px rgba(0,0,0,.4)`;
      const type = settings.clock?.type || 'digital';
      [
        { label: type === 'digital' ? '🕐 Zur Analoguhr' : '🔢 Zur Digitaluhr',
          action: () => { settings.clock = settings.clock || {}; settings.clock.type = type === 'digital' ? 'analog' : 'digital'; autoSave(); if (typeof setupClock==='function') setupClock(); } },
        { label: '❌ Uhr ausblenden',
          action: () => { settings.clock = settings.clock || {}; settings.clock.enabled = false; w.style.display = 'none'; autoSave(); } },
      ].forEach(item => {
        const btn = document.createElement('button');
        btn.style.cssText = 'display:block;width:100%;text-align:left;padding:7px 10px;background:transparent;border:none;color:var(--tx);font-size:13px;cursor:pointer;border-radius:3px;';
        btn.textContent = item.label;
        btn.addEventListener('mouseenter', () => btn.style.background = 'var(--bgch)');
        btn.addEventListener('mouseleave', () => btn.style.background = 'transparent');
        btn.addEventListener('click', () => { item.action(); menu.remove(); });
        menu.appendChild(btn);
      });
      document.body.appendChild(menu);
      setTimeout(() => document.addEventListener('click', () => menu.remove(), { once: true }), 0);
    });
  }, 800);
})();

console.log('[v3.3.0] Profil-Editor, Karten, DnD, Suche, Uhr gepatcht');

// ════════════════════════════════════════════════════════════════════
// v3.3.1 FIXES: System-Theme, Profil-Limit, CR-Kalender, Sessions
// ════════════════════════════════════════════════════════════════════

// ── 1. SYSTEM-THEME: Automatisch nach Windows folgen ─────────────────

(function setupSystemTheme() {
  // System-Theme beim Start anwenden
  async function applySystemOrSavedTheme() {
    const saved = await window.electronAPI.getTheme().catch(() => 'dark');
    if (saved === 'system') {
      const systemTheme = await window.electronAPI.getSystemTheme().catch(() => 'dark');
      document.documentElement.dataset.theme = systemTheme;
      if (typeof applyTheme === 'function') applyTheme(systemTheme);
    } else {
      document.documentElement.dataset.theme = saved;
      if (typeof applyTheme === 'function') applyTheme(saved);
    }
  }

  setTimeout(applySystemOrSavedTheme, 200);

  // Auf System-Änderungen reagieren
  window.electronAPI.onSystemThemeChanged?.((theme) => {
    const saved = document.documentElement.dataset.themeSource || 'dark';
    if (saved === 'system') {
      document.documentElement.dataset.theme = theme;
      if (typeof applyTheme === 'function') applyTheme(theme);
    }
  });

  // Theme-Buttons: "System" Option
  setTimeout(() => {
    document.querySelectorAll('[data-theme-btn]').forEach(btn => {
      if (btn._themeBound) return;
      btn._themeBound = true;
      btn.addEventListener('click', () => {
        const t = btn.dataset.themeBtn;
        document.documentElement.dataset.themeSource = t;
        window.electronAPI.setThemeSource(t);
        if (t === 'system') {
          window.electronAPI.getSystemTheme().then(st => {
            if (typeof applyTheme === 'function') applyTheme(st);
          });
        } else {
          if (typeof applyTheme === 'function') applyTheme(t);
        }
        document.querySelectorAll('[data-theme-btn]').forEach(b => b.classList.toggle('active', b.dataset.themeBtn === t));
      });
    });
  }, 600);
})();

// ── 2. PROFIL-LIMIT: Max 5 Profile ───────────────────────────────────

(function enforceProfileLimit() {
  const MAX_PROFILES = 5;

  function updateNewProfileBtn() {
    const btn = document.getElementById('btn-new-profile');
    if (!btn) return;
    const count = (typeof profiles !== 'undefined' ? profiles : []).length;
    btn.style.display = count >= MAX_PROFILES ? 'none' : '';
    btn.title = count >= MAX_PROFILES ? `Maximal ${MAX_PROFILES} Profile möglich` : 'Neues Profil';
  }

  // Überwachen
  const _origBSP2 = window.buildSidebarProfile;
  if (typeof _origBSP2 === 'function') {
    window.buildSidebarProfile = function() {
      _origBSP2.apply(this, arguments);
      setTimeout(updateNewProfileBtn, 50);
    };
  }
  setTimeout(updateNewProfileBtn, 800);
})();

// ── 3. REDUCED MOTION: prefers-reduced-motion ─────────────────────────

(function respectReducedMotion() {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function apply(matches) {
    document.body.classList.toggle('reduced-motion', matches);
    if (matches) {
      const style = document.getElementById('reduced-motion-style') || document.createElement('style');
      style.id = 'reduced-motion-style';
      style.textContent = '*, *::before, *::after { transition-duration: 0.01ms !important; animation-duration: 0.01ms !important; }';
      document.head.appendChild(style);
    } else {
      document.getElementById('reduced-motion-style')?.remove();
    }
  }
  apply(mq.matches);
  mq.addEventListener('change', e => apply(e.matches));
})();

// ── 4. TOUCH SUPPORT: Swipe-Gesten für Onboarding ────────────────────

(function setupTouchSupport() {
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return; // Zu kurz oder vertikal

    // Onboarding Swipe
    const onboarding = document.getElementById('onboarding-overlay');
    if (onboarding?.style.display !== 'none') {
      if (dx < -50 && typeof obNext === 'function') obNext();   // Links = weiter
      if (dx > 50  && typeof obBack === 'function') obBack();    // Rechts = zurück
    }

    // Slideshow Swipe (Neuigkeiten/Upcoming)
    const activeSlide = document.querySelector('.slideshow-container:hover, .slideshow-container.active');
    if (activeSlide) {
      const key = activeSlide.dataset.key;
      if (key && typeof goToSlide === 'function') {
        const ss = slideshows?.[key];
        if (ss) goToSlide(key, dx < 0 ? ss.idx + 1 : ss.idx - 1);
      }
    }
  }, { passive: true });
})();

// ── 5. CR KALENDER: Echte Crunchyroll-Daten wenn angemeldet ───────────

(function setupCRCalendar() {
  // CR Kalender nur anzeigen wenn angemeldet
  function updateCRCalendarVisibility() {
    const crBtn = document.querySelector('[data-view="cr-calendar"]');
    if (!crBtn) return;
    const isLoggedIn = !!(sessionCache?.crunchyroll);
    crBtn.style.display = isLoggedIn ? '' : 'none';
    crBtn.title = isLoggedIn ? 'Crunchyroll Kalender' : 'Anmelden bei Crunchyroll um den Kalender zu sehen';
  }

  // Initial und bei Session-Updates
  setTimeout(updateCRCalendarVisibility, 1000);
  window.electronAPI.onSessionsUpdated?.(() => setTimeout(updateCRCalendarVisibility, 200));
})();

// CR Kalender: verbesserte Implementierung mit echten CR-Daten wenn verfügbar
async function loadCrCalendarView() {
  const content = document.getElementById('cr-calendar-content');
  if (!content) return;

  // Prüfe CR-Login-Status
  const isLoggedIn = !!(sessionCache?.crunchyroll);

  if (!isLoggedIn) {
    content.innerHTML = `
      <div style="text-align:center;padding:40px 20px;display:flex;flex-direction:column;align-items:center;gap:16px">
        <div style="font-size:48px">🦊</div>
        <h3 style="font-family:var(--font-d);font-size:18px;font-weight:800;color:var(--tx);margin:0">Crunchyroll-Login erforderlich</h3>
        <p style="color:var(--tx2);font-size:13px;max-width:340px;text-align:center;line-height:1.5;margin:0">
          Der Crunchyroll-Kalender zeigt dir neue Anime-Folgen basierend auf deiner Crunchyroll-Watchlist. Melde dich an um loszulegen.
        </p>
        <button class="pick-btn" onclick="openProvider('crunchyroll')" style="font-size:13px;padding:10px 24px">
          🦊 Bei Crunchyroll anmelden
        </button>
      </div>`;
    return;
  }

  // Angemeldet: TMDB-Anime-Daten laden (zukünftig: echte CR-API)
  content.innerHTML = `
    <div style="text-align:center;padding:20px;color:var(--tx2)">
      <div style="font-size:32px;margin-bottom:8px">🦊</div>
      Lade Anime-Kalender…
    </div>`;

  try {
    const today = new Date(); today.setHours(0,0,0,0);
    const dayNames = ['So','Mo','Di','Mi','Do','Fr','Sa'];
    const tabs = [];

    for (let i = 0; i < 8; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const label = i === 0 ? 'Heute' : dayNames[d.getDay()] + ' ' + d.getDate() + '.' + (d.getMonth()+1) + '.';
      tabs.push({ label, date: d.toISOString().split('T')[0] });
    }
    tabs.push({ label: '← Letzte Woche', date: 'lastweek' });

    const [t1, t2] = await Promise.all([
      window.electronAPI.getTrending().catch(() => ({})),
      window.electronAPI.getUpcoming(1).catch(() => ({})),
    ]);

    const all = [...(t1.anime||[]), ...(t2.anime||[])]
      .filter((v,i,a) => a.findIndex(x=>x.id===v.id)===i)
      .filter(i => i.poster_path && /^[\u0000-\u024F\s\d\W]+$/.test(i.title||i.name||''));

    content.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid var(--bor)';
    header.innerHTML = `
      <span style="font-size:24px">🦊</span>
      <div>
        <div style="font-family:var(--font-d);font-size:16px;font-weight:800;color:var(--tx)">Crunchyroll Kalender</div>
        <div style="font-size:11px;color:var(--tx2)">Neue Anime-Folgen der nächsten 7 Tage</div>
      </div>
      <button class="pick-btn" onclick="openProvider('crunchyroll')" style="margin-left:auto;font-size:11px">▶ Crunchyroll öffnen</button>`;
    content.appendChild(header);

    // Tabs (Tag-Auswahl)
    let activeDate = tabs[0].date;
    const tabBar = document.createElement('div');
    tabBar.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px';
    content.appendChild(tabBar);

    const resultArea = document.createElement('div');
    resultArea.id = 'cr-result-area';
    content.appendChild(resultArea);

    function renderDay(date) {
      activeDate = date;
      tabBar.querySelectorAll('.cr-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.date === date));
      let items;
      if (date === 'lastweek') {
        const ls = new Date(today); ls.setDate(today.getDate()-7);
        items = all.filter(i => {
          const d = new Date(i.first_air_date||i.release_date||''); d.setHours(0,0,0,0);
          return d >= ls && d < today;
        });
      } else {
        items = all.filter(i => (i.first_air_date||i.release_date) === date);
      }

      if (!items.length) {
        resultArea.innerHTML = `<div style="text-align:center;padding:30px;color:var(--tx2);font-size:13px">Keine neuen Folgen an diesem Tag verfügbar</div>`;
        return;
      }

      resultArea.innerHTML = '';
      const grid = document.createElement('div');
      grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px';
      items.forEach(item => {
        const title = item.title || item.name || '?';
        const poster = item.poster_path ? `https://image.tmdb.org/t/p/w185${item.poster_path}` : '';
        const card = document.createElement('div');
        card.style.cssText = 'background:var(--bgc);border:1px solid var(--bor);border-radius:var(--r);overflow:hidden;cursor:pointer;transition:transform .18s,border-color .18s;position:relative';
        card.innerHTML = (poster ? `<img src="${poster}" style="width:100%;aspect-ratio:2/3;object-fit:cover;display:block" loading="lazy"/>` : '<div style="aspect-ratio:2/3;background:var(--bgch);display:flex;align-items:center;justify-content:center;font-size:32px">🦊</div>') +
          `<div style="padding:8px 10px">
            <div style="font-size:11px;font-weight:700;color:var(--tx);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(title)}</div>
            <div style="font-size:9px;color:#F47521;margin-top:3px;font-weight:700">Crunchyroll</div>
          </div>`;
        card.addEventListener('mouseenter', () => { card.style.transform='translateY(-3px)'; card.style.borderColor='#F47521'; });
        card.addEventListener('mouseleave', () => { card.style.transform=''; card.style.borderColor=''; });
        card.addEventListener('click', () => showDetailPopup(item.id, 'tv', title));
        grid.appendChild(card);
      });
      resultArea.appendChild(grid);
    }

    tabs.forEach(tab => {
      const btn = document.createElement('button');
      btn.className = 'cr-tab-btn media-type-text-btn' + (tab.date === activeDate ? ' active' : '');
      btn.dataset.date = tab.date;
      btn.textContent = tab.label;
      btn.style.cssText = 'font-size:12px;padding:4px 0';
      btn.addEventListener('click', () => renderDay(tab.date));
      tabBar.appendChild(btn);
    });

    renderDay(activeDate);
  } catch(e) {
    content.innerHTML = `<div style="color:var(--danger);padding:20px">Fehler: ${esc(e.message)}</div>`;
  }
}

// ── 6. KARTEN-EDITOR: Live-Vorschau ──────────────────────────────────

(function setupCardEditorPreview() {
  // Karten-Editor Overlay größer machen + Live-Vorschau links
  const patchCardEditor = () => {
    const editorOv = document.getElementById('card-editor-overlay');
    if (!editorOv || editorOv._previewSetup) return;
    editorOv._previewSetup = true;

    // Füge Vorschau-Panel ein
    const inner = editorOv.querySelector('.card-editor-inner, [class*="editor"]') || editorOv.firstElementChild?.firstElementChild;
    if (!inner) return;

    // Breite erhöhen
    inner.style.maxWidth = '900px';
    inner.style.width = '95%';
    inner.style.display = 'flex';
    inner.style.gap = '0';

    // Vorschau-Seite links
    if (!document.getElementById('card-editor-preview')) {
      const previewPane = document.createElement('div');
      previewPane.id = 'card-editor-preview-pane';
      previewPane.style.cssText = 'width:220px;flex-shrink:0;background:var(--bgch);border-right:1px solid var(--bor);padding:20px;display:flex;flex-direction:column;align-items:center;gap:12px';
      previewPane.innerHTML = `
        <div style="font-size:11px;font-weight:700;color:var(--tx3);text-transform:uppercase;letter-spacing:.1em">Live-Vorschau</div>
        <div id="card-editor-preview" style="width:160px"></div>
        <div style="font-size:10px;color:var(--tx3);text-align:center;line-height:1.4">Änderungen werden sofort angezeigt</div>`;
      inner.insertBefore(previewPane, inner.firstChild);
    }
  };

  // Live-Update der Vorschau wenn Editor-Felder geändert werden
  function updateCardPreview(providerId) {
    const preview = document.getElementById('card-editor-preview');
    if (!preview || !providerId) return;
    const p = PROVIDERS()[providerId];
    if (!p) return;

    const customName  = document.getElementById('ced-custom-name')?.value || (settings.cardCustomNames||{})[providerId] || p.name;
    const customTag   = document.getElementById('ced-custom-tag')?.value  || (settings.cardCustomTags||{})[providerId]  || p.tag || '';
    const bgColor     = document.getElementById('ced-bg-color')?.value    || (settings.cardBgColors||{})[providerId]    || p.color || '#333';
    const bgOpacity   = document.getElementById('ced-bg-opacity')?.value  || (settings.cardBgOpacity||{})[providerId]   || 0.85;
    const customImg   = (settings.cardImages||{})[providerId];
    const customLogo  = (settings.cardLogos||{})[providerId];

    preview.innerHTML = `
      <div style="border-radius:12px;overflow:hidden;border:1px solid var(--bor);background:var(--bgc);box-shadow:0 4px 16px rgba(0,0,0,.25)">
        <div style="height:80px;background:${customImg ? `url('${customImg}') center/cover` : bgColor};position:relative;display:flex;align-items:center;justify-content:center">
          ${customLogo ? `<img src="${customLogo}" style="height:36px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))"/>` : `<img src="${getFavicon(providerId,p)}" style="height:36px;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,.5))" onerror="this.style.display='none'"/>`}
        </div>
        <div style="padding:7px 10px">
          <div style="font-size:12px;font-weight:700;color:var(--tx)">${esc(customName)}</div>
          <div style="font-size:9px;color:var(--tx3);margin-top:1px">${esc(customTag)}</div>
        </div>
      </div>`;
  }

  // Auf Änderungen in Eingabefeldern reagieren
  document.addEventListener('input', e => {
    if (e.target.closest('#card-editor-overlay')) {
      const providerId = window._currentCardEditor;
      if (providerId) updateCardPreview(providerId);
    }
  });

  // openCardEditor überwachen
  const _origOCE = typeof openCardEditor === 'function' ? openCardEditor : null;
  if (_origOCE) {
    window.openCardEditor = function(id, p) {
      window._currentCardEditor = id;
      _origOCE.apply(this, arguments);
      setTimeout(() => {
        patchCardEditor();
        updateCardPreview(id);
      }, 100);
    };
  }
})();

console.log('[v3.3.1] System-Theme, Profil-Limit, CR, Touch, Vorschau gepatcht');
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
