// ═══ OmniHub v0.3.0 – features/widevine.js ═══
// Aus bundle.js extrahiert

// ═══════════════════════════════════════════════════════════════════
// OmniHub – WideVine CDM Management
// ═══════════════════════════════════════════════════════════════════

async function checkWidevineStatus() {
  try {
    const status = await window.electronAPI.getWidevineStatus();
    const el     = document.getElementById('widevine-status');
    if (!el) return;

    if (status?.installed) {
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;color:#66bb6a">
          <span style="font-size:18px">✓</span>
          <div>
            <div style="font-weight:700;font-size:13px">WideVine CDM installiert</div>
            ${status.version ? `<div style="font-size:11px;opacity:.7">Version: ${status.version}</div>` : ''}
          </div>
        </div>`;
    } else {
      const missing = [];
      if (!status?.dllExists)      missing.push('widevinecdm.dll');
      if (!status?.sigExists)      missing.push('widevinecdm.dll.sig');
      if (!status?.manifestExists) missing.push('manifest.json');

      el.innerHTML = `
        <div style="color:var(--danger)">
          <div style="display:flex;align-items:center;gap:6px;font-weight:700;margin-bottom:6px">
            <span>✗</span> WideVine CDM nicht vollständig
          </div>
          ${missing.length ? `
          <div style="font-size:11px;margin-bottom:8px">
            Fehlende Dateien:<br>
            ${missing.map(f=>`<code style="background:var(--bgc);padding:1px 5px;border-radius:3px;color:var(--danger)">${f}</code>`).join(' ')}
          </div>` : ''}
          <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <code style="background:var(--bgc);border:1px solid var(--bor);border-radius:4px;padding:4px 8px;font-size:10px;color:var(--tx2);flex:1;word-break:break-all">${status?.cdmDir || '?'}</code>
            <button onclick="window._openWvFolder('dest')"
              style="padding:5px 10px;background:var(--acc);color:#fff;border:none;border-radius:var(--r-sm);font-size:11px;cursor:pointer;white-space:nowrap">📁 Öffnen</button>
          </div>
        </div>`;

      // Anleitung-Button
      let guideBtn = el.parentElement?.querySelector('.wv-guide-btn');
      if (!guideBtn) {
        guideBtn = document.createElement('button');
        guideBtn.className = 'pick-btn wv-guide-btn';
        guideBtn.style.marginTop = '8px';
        guideBtn.innerHTML = '📖 Schritt-für-Schritt Anleitung';
        guideBtn.addEventListener('click', openWidevineGuide);
        el.parentElement?.appendChild(guideBtn);
      }
    }
  } catch (e) {
    console.warn('[WideVine] Status-Fehler:', e.message);
  }
}

window._openWvFolder = async function(type) {
  try {
    let targetPath = '';
    if (type === 'dest') {
      const status = await window.electronAPI.getWidevineStatus();
      targetPath   = status?.cdmDir || '';
    } else if (type === 'chrome') {
      targetPath   = 'C:\\Program Files\\Google\\Chrome\\Application';
    } else if (type === 'edge') {
      targetPath   = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application';
    }
    if (!targetPath) { showToastMsg('Pfad nicht gefunden'); return; }
    const normalized = targetPath.replace(/\\/g, '/');
    window.electronAPI.openExternal('file:///' + normalized);
  } catch (e) {
    showToastMsg('Ordner konnte nicht geöffnet werden: ' + e.message);
  }
};

function openWidevineGuide() {
  const existing = document.getElementById('widevine-guide-overlay');
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement('div');
  overlay.id    = 'widevine-guide-overlay';
  overlay.style.cssText =
    'position:fixed;inset:0;background:rgba(0,0,0,.8);z-index:10000;' +
    'display:flex;align-items:center;justify-content:center;padding:20px';

  overlay.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--borh);border-radius:var(--r);
      width:min(660px,96%);max-height:88vh;display:flex;flex-direction:column;
      overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.7)">
      <div style="display:flex;align-items:center;padding:18px 22px;border-bottom:1px solid var(--bor)">
        <span style="font-size:22px;margin-right:10px">🔐</span>
        <span style="font-family:var(--font-d);font-size:17px;font-weight:800;color:var(--tx);flex:1">WideVine CDM installieren</span>
        <button onclick="document.getElementById('widevine-guide-overlay').remove()"
          style="border:none;background:transparent;color:var(--tx2);font-size:18px;cursor:pointer;padding:4px 8px">✕</button>
      </div>
      <div style="overflow-y:auto;padding:22px;flex:1;display:flex;flex-direction:column;gap:16px">
        <div style="background:var(--accg);border:1px solid var(--acc);border-radius:var(--r-sm);padding:12px 16px;font-size:13px;color:var(--tx)">
          <b>Was ist WideVine?</b><br>
          WideVine ist ein Kopierschutzsystem das Netflix, Disney+, Amazon Prime und Crunchyroll
          nutzen. OmniHub braucht es um diese Dienste abspielen zu können.
          Du hast WideVine bereits auf deinem PC – es ist in Google Chrome oder Microsoft Edge eingebaut.
        </div>
        <div style="background:rgba(229,115,115,.1);border:1px solid var(--danger);border-radius:var(--r-sm);padding:10px 14px;font-size:12px;color:var(--tx)">
          ⚠️ <b>Du brauchst genau 3 Dateien</b> aus demselben Ordner – ohne alle drei funktioniert WideVine nicht:<br><br>
          <code style="background:var(--bgc);padding:2px 6px;border-radius:3px;font-size:11px">widevinecdm.dll</code> +
          <code style="background:var(--bgc);padding:2px 6px;border-radius:3px;font-size:11px">widevinecdm.dll.sig</code> +
          <code style="background:var(--bgc);padding:2px 6px;border-radius:3px;font-size:11px">manifest.json</code>
        </div>
        <div>
          <h3 style="font-family:var(--font-d);font-size:14px;font-weight:700;color:var(--tx);margin-bottom:12px">Schritt-für-Schritt:</h3>
          ${[
            {n:1, title:'Chrome- oder Edge-Ordner öffnen', desc:'Klicke auf einen der Buttons und öffne den Ordner im Datei-Explorer.',
              btns:[{label:'📁 Chrome öffnen',fn:"window._openWvFolder('chrome')"},{label:'📁 Edge öffnen',fn:"window._openWvFolder('edge')"}]},
            {n:2, title:'In den Versionsunterordner navigieren',
              desc:'Du siehst einen Ordner mit einer Versionsnummer (z.B. <code>4.10.2662.3</code>). Öffne ihn → dann <code>_platform_specific</code> → dann <code>win_x64</code>. Dort liegen die 3 benötigten Dateien.'},
            {n:3, title:'Alle 3 Dateien kopieren',
              desc:'Wähle alle Dateien aus (<kbd>Strg+A</kbd>) und kopiere sie (<kbd>Strg+C</kbd>).'},
            {n:4, title:'In den OmniHub-Ordner einfügen',
              desc:'Öffne den Ziel-Ordner und füge die Dateien ein (<kbd>Strg+V</kbd>).',
              btns:[{label:'📁 Ziel-Ordner öffnen',fn:"window._openWvFolder('dest')"}]},
            {n:5, title:'OmniHub neu starten', desc:'Schließe OmniHub komplett und öffne es erneut. Netflix, Disney+ und Crunchyroll sollten jetzt funktionieren.', ok:true},
          ].map(step=>`
            <div style="display:flex;gap:10px;margin-bottom:14px">
              <div style="width:24px;height:24px;border-radius:50%;
                background:${step.ok?'#66bb6a':'var(--acc)'};color:#fff;
                font-size:11px;font-weight:700;display:flex;align-items:center;
                justify-content:center;flex-shrink:0;margin-top:2px">${step.n}</div>
              <div style="flex:1">
                <div style="font-size:13px;color:var(--tx);font-weight:600;margin-bottom:3px">${step.title}</div>
                <div style="font-size:12px;color:var(--tx2)">${step.desc}</div>
                ${step.btns ? `<div style="display:flex;gap:6px;margin-top:6px">${step.btns.map(b=>`<button onclick="${b.fn}" style="padding:5px 12px;background:var(--acc);color:#fff;border:none;border-radius:var(--r-sm);font-size:11px;cursor:pointer">${b.label}</button>`).join('')}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>
        <div style="background:var(--bgc);border:1px solid var(--bor);border-radius:var(--r-sm);padding:12px 16px">
          <b style="font-size:13px;color:var(--tx)">⚖️ Legal?</b>
          <div style="font-size:12px;color:var(--tx2);margin-top:4px">
            Ja. Du verwendest WideVine nur für Dienste bei denen du angemeldet bist.
            Du kopierst es aus deinem eigenen Chrome-Browser. Das ist keine Urheberrechtsverletzung.
          </div>
        </div>
      </div>
      <div style="padding:14px 22px;border-top:1px solid var(--bor);display:flex;justify-content:flex-end">
        <button onclick="document.getElementById('widevine-guide-overlay').remove()"
          style="padding:8px 20px;background:var(--acc);color:#fff;border:none;border-radius:var(--r-sm);font-family:var(--font-d);font-weight:700;cursor:pointer">
          Verstanden
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
}

// Widevine-Banner wenn nicht installiert
async function checkWidevineBanner() {
  try {
    const status = await window.electronAPI.getWidevineStatus();
    if (!status?.installed && !sessionStorage.getItem('wv-banner-shown')) {
      sessionStorage.setItem('wv-banner-shown', '1');
      const banner = document.createElement('div');
      banner.id    = 'widevine-banner';
      banner.style.cssText =
        'position:fixed;top:var(--tbh,40px);left:var(--sw,200px);right:0;' +
        'background:rgba(229,115,115,.1);border-bottom:1px solid var(--danger);' +
        'padding:8px 16px;display:flex;align-items:center;gap:12px;z-index:990;' +
        'font-size:12px;color:var(--tx)';
      banner.innerHTML = `
        <span>⚠ WideVine CDM fehlt – Netflix, Disney+, Prime und Crunchyroll funktionieren möglicherweise nicht.</span>
        <button onclick="openWidevineGuide()" style="padding:4px 12px;background:var(--danger);color:#fff;border:none;border-radius:var(--r-sm);font-size:11px;cursor:pointer;white-space:nowrap">Anleitung</button>
        <button onclick="this.parentElement.remove()" style="margin-left:auto;background:transparent;border:none;color:var(--tx2);font-size:16px;cursor:pointer">✕</button>`;
      document.body.appendChild(banner);
    }
  } catch {}
}
