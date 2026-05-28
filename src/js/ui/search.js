// ═══ OmniHub v0.3.0 – ui/search.js ═══
// Aus bundle.js extrahiert

// ═══════════════════════════════════════════════════════════════════
// OmniHub – Suche (TMDB + Anbieter)
// ═══════════════════════════════════════════════════════════════════

const TMDB_IMG = 'https://image.tmdb.org/t/p/w185';

let _searchTimer  = null;
let _searchAbort  = null;
let _searchPage   = 1;
// searchHistory: von app.js verwaltet

// Cache für schnelle Wiederholung
const _searchCache = new Map();

function setupSearch() {
  const input   = document.getElementById('search-input');
  const dd      = document.getElementById('search-dropdown');
  const clearBtn= document.getElementById('search-clear');
  if (!input || !dd) return;

  function closeSearch() { dd.style.display = 'none'; }

  function doSearch(q, page = 1) {
    _searchPage = page;
    q = q.trim();
    if (!q) {
      if (searchHistory.length) renderSearchHistory(dd);
      else closeSearch();
      return;
    }
    // YouTube-URL direkt
    const ytId = extractYtId(q);
    if (ytId && page === 1) { renderYtResult(dd, ytId); return; }

    if (_searchAbort) try { _searchAbort.abort(); } catch {}
    _searchAbort = new AbortController();
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => runTmdbSearch(q, page, _searchAbort.signal), 300);
  }

  // Alle alten Listener entfernen durch Clone
  const fresh = input.cloneNode(true);
  input.parentNode.replaceChild(fresh, input);

  fresh.addEventListener('input', () => {
    const q = fresh.value;
    if (clearBtn) clearBtn.style.display = q ? 'block' : 'none';
    doSearch(q);
  });
  fresh.addEventListener('focus', () => {
    const q = fresh.value.trim();
    if (q) doSearch(q);
    else if (searchHistory.length) renderSearchHistory(dd);
  });
  fresh.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeSearch();
    if (e.key === 'Enter' && fresh.value.trim()) {
      addToSearchHistory(fresh.value.trim());
    }
  });

  if (clearBtn) {
    clearBtn.style.display = 'none';
    clearBtn.addEventListener('click', () => {
      fresh.value = '';
      clearBtn.style.display = 'none';
      dd.innerHTML = '';
      closeSearch();
      if (_searchAbort) try { _searchAbort.abort(); } catch {}
      clearTimeout(_searchTimer);
      fresh.focus();
    });
  }

  // Außen-Klick schließt
  document.addEventListener('mousedown', e => {
    const wrap = fresh.closest?.('.search-bar') ||
                 fresh.closest?.('.search-bar-wrap') ||
                 fresh.parentElement;
    if (wrap && !wrap.contains(e.target) && !dd.contains(e.target))
      closeSearch();
  });

  // Seitenwechsel schließt
  document.querySelectorAll('[data-view]').forEach(btn =>
    btn.addEventListener('click', closeSearch));
}

function extractYtId(q) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ];
  for (const p of patterns) {
    const m = q.match(p);
    if (m) return m[1];
  }
  return null;
}

function renderYtResult(dd, ytId) {
  dd.innerHTML = `
    <div class="search-dd-section">YouTube</div>
    <div class="search-dd-item" id="yt-dd-direct" style="cursor:pointer">
      <img src="https://img.youtube.com/vi/${ytId}/mqdefault.jpg"
        style="width:80px;height:46px;border-radius:5px;object-fit:cover;flex-shrink:0"
        onerror="this.style.display='none'"/>
      <div class="search-dd-info">
        <div class="search-dd-title">YouTube Video</div>
        <div class="search-dd-meta">Direkt öffnen</div>
      </div>
    </div>`;
  dd.style.display = 'block';
  document.getElementById('yt-dd-direct')?.addEventListener('click', () => {
    dd.style.display = 'none';
    openProviderAtUrl('youtube',
      `https://www.youtube.com/watch?v=${ytId}`,
      'YouTube', getProfilePartition('youtube'));
  });
}

async function runTmdbSearch(q, page = 1, signal = null) {
  const dd = document.getElementById('search-dropdown');
  if (!dd || !q) return;

  // Cache prüfen
  const cacheKey = `${q}|${page}`;
  const cached   = _searchCache.get(cacheKey);
  if (cached && Date.now() - cached.ts < 5 * 60 * 1000) {
    dd.innerHTML    = cached.html;
    dd.style.display = 'block';
    bindSearchResults(dd, q, page);
    return;
  }

  const ql = q.toLowerCase().trim();

  // Anbieter-Treffer (immer auf Seite 1)
  let html = '';
  if (page === 1) {
    const provMatches = Object.entries(PROVIDERS())
      .filter(([id]) => !(settings.deletedProviders || []).includes(id))
      .filter(([id, p]) => {
        const name = ((settings.cardCustomNames || {})[id] || p.name).toLowerCase();
        return name.startsWith(ql) || name.includes(ql);
      })
      .slice(0, 3);

    if (provMatches.length) {
      html += '<div class="search-dd-section">Anbieter</div>';
      provMatches.forEach(([id, p]) => {
        const name = (settings.cardCustomNames || {})[id] || p.name;
        html += `<div class="search-dd-item" data-prov-open="${id}" style="cursor:pointer">
          <img src="${getFavicon(id, p)}"
            style="width:36px;height:36px;object-fit:contain;border-radius:8px;
                   background:${p.color}22;padding:4px"
            onerror="this.style.display='none'"/>
          <div class="search-dd-info">
            <div class="search-dd-title">${esc(name)}</div>
            <div class="search-dd-meta">${esc(p.tag || '')}</div>
          </div>
        </div>`;
      });
    }
  }

  // TMDB
  try {
    if (signal?.aborted) return;
    const data    = await window.electronAPI.searchTmdb(q);
    if (signal?.aborted) return;

    const results = (data.results || []).filter(r => {
      if (!r.poster_path || r.media_type === 'person') return false;
      const title = (r.title || r.name || '').toLowerCase();
      // Relevanz: Begriff muss im Titel vorkommen
      if (!title.includes(ql) && !ql.split(' ').every(w => w.length < 2 || title.includes(w)))
        return false;
      // Nur lateinische Zeichen
      return /^[\u0000-\u024F\s\d\W]+$/.test(r.title || r.name || '');
    });

    if (results.length) {
      if (page === 1) html += '<div class="search-dd-section">Filme & Serien</div>';
      const slice = results.slice((page - 1) * 8, page * 8);
      slice.forEach(item => {
        const title  = item.title || item.name || '';
        const year   = (item.release_date || item.first_air_date || '').substring(0, 4);
        const type   = item.media_type === 'movie' ? 'Film' : 'Serie';
        const rating = item.vote_average ? `★ ${item.vote_average.toFixed(1)}` : '';
        html += `<div class="search-dd-item search-dd-film" style="cursor:pointer"
            data-tmdb="${item.id}" data-type="${item.media_type}" data-title="${esc(title)}">
          <img class="search-dd-poster"
            src="${TMDB_IMG}${item.poster_path}"
            style="width:36px;height:52px;object-fit:cover;border-radius:5px;flex-shrink:0"
            onerror="this.style.display='none'"/>
          <div class="search-dd-info">
            <div class="search-dd-title">${esc(title)}</div>
            <div class="search-dd-meta">
              <span class="search-dd-badge">${type}</span>
              ${year ? `<span>${year}</span>` : ''}
              ${rating ? `<span>${rating}</span>` : ''}
            </div>
          </div>
        </div>`;
      });
      if (results.length > page * 8)
        html += `<div class="search-dd-more" id="dd-more-btn">Mehr anzeigen ↓</div>`;
    } else if (!html.includes('data-prov-open')) {
      html += `<div style="padding:16px 14px;text-align:center;font-size:13px;color:var(--tx2)">
        Keine Ergebnisse für „${esc(q)}"</div>`;
    }
  } catch (e) {
    if (e.name !== 'AbortError')
      html += `<div style="padding:12px;color:var(--danger);font-size:12px">Suche fehlgeschlagen</div>`;
  }

  if (signal?.aborted) return;
  if (page === 1) { dd.innerHTML = html; }
  else {
    document.getElementById('dd-more-btn')?.remove();
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    tmp.querySelectorAll('.search-dd-item, .search-dd-more').forEach(el => dd.appendChild(el));
  }
  dd.style.display = 'block';

  // Cache speichern
  _searchCache.set(cacheKey, { html: dd.innerHTML, ts: Date.now() });

  bindSearchResults(dd, q, page);
}

function bindSearchResults(dd, q, page) {
  dd.querySelectorAll('[data-prov-open]').forEach(el =>
    el.addEventListener('click', () => { dd.style.display='none'; openProvider(el.dataset.provOpen); }));
  dd.querySelectorAll('.search-dd-film').forEach(el =>
    el.addEventListener('click', e => {
      if (e.target.closest('[data-prov-open]')) return;
      dd.style.display = 'none';
      addToSearchHistory(el.dataset.title);
      showDetailPopup(parseInt(el.dataset.tmdb), el.dataset.type, el.dataset.title);
    }));
  document.getElementById('dd-more-btn')?.addEventListener('click', () =>
    runTmdbSearch(q, page + 1));
}

function addToSearchHistory(q) {
  if (!q || !q.trim()) return;
  searchHistory = [q, ...searchHistory.filter(h => h !== q)].slice(0, 15);
  settings.searchHistory = searchHistory;
  autoSave();
}

function renderSearchHistory(dd) {
  if (!searchHistory || !searchHistory.length) { dd.style.display = 'none'; return; }
  let html = `<div class="search-dd-section" style="display:flex;justify-content:space-between;align-items:center">
    <span>Zuletzt gesucht</span>
    <button onclick="clearAllSearchHistory()" class="search-dd-clear-all">Alle löschen</button>
  </div>`;
  searchHistory.slice(0, 10).forEach((q, i) => {
    const cacheKey = `${q}|1`;
    const cached   = _searchCache.get(cacheKey);
    const preview  = cached && Date.now() - cached.ts < 10 * 60 * 1000
      ? `<div style="font-size:10px;color:var(--acc);margin-top:1px">⚡ Vorschau</div>` : '';
    html += `<div class="search-dd-history-item">
      <span class="search-dd-history-q" data-q="${esc(q)}" data-i="${i}">🕐 ${esc(q)}${preview}</span>
      <button class="search-dd-history-del" data-i="${i}">✕</button>
    </div>`;
  });
  dd.innerHTML    = html;
  dd.style.display = 'block';

  dd.querySelectorAll('.search-dd-history-q').forEach(el =>
    el.addEventListener('click', () => {
      const input = document.getElementById('search-input');
      if (input) { input.value = el.dataset.q; input.focus(); }
      const cached = _searchCache.get(`${el.dataset.q}|1`);
      if (cached && Date.now() - cached.ts < 10 * 60 * 1000) {
        dd.innerHTML    = cached.html;
        dd.style.display = 'block';
        bindSearchResults(dd, el.dataset.q, 1);
      } else { runTmdbSearch(el.dataset.q, 1); }
    }));
  dd.querySelectorAll('.search-dd-history-del').forEach(el =>
    el.addEventListener('click', e => {
      e.stopPropagation();
      searchHistory.splice(parseInt(el.dataset.i), 1);
      settings.searchHistory = searchHistory;
      autoSave();
      renderSearchHistory(dd);
    }));
}

function clearAllSearchHistory() {
  searchHistory            = [];
  settings.searchHistory   = [];
  autoSave();
  const dd = document.getElementById('search-dropdown');
  if (dd) { dd.innerHTML = ''; dd.style.display = 'none'; }
}

window.clearAllSearchHistory = clearAllSearchHistory;
