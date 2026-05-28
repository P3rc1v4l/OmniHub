// ═══ OmniHub v0.3.0 – features/feedback.js ═══
// Aus bundle.js extrahiert

// ═══════════════════════════════════════════════════════════════════
// OmniHub – Beta-Feedback System
// In-App Feedback + Discord-Link
// ═══════════════════════════════════════════════════════════════════

const DISCORD_INVITE = 'https://discord.gg/tnfgta33uj';

function setupFeedback() {
  // Feedback-Button in Einstellungen verdrahten
  document.getElementById('btn-open-feedback')?.addEventListener('click', openFeedbackModal);
  document.getElementById('btn-open-discord')?.addEventListener('click', () => {
    window.electronAPI.openExternal(DISCORD_INVITE);
  });
}

function openFeedbackModal() {
  const existing = document.getElementById('feedback-overlay');
  if (existing) { existing.remove(); return; }

  const overlay = document.createElement('div');
  overlay.id    = 'feedback-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.75);z-index:5000;display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="background:var(--bg2);border:1px solid var(--borh);border-radius:var(--r);width:min(500px,96%);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 60px rgba(0,0,0,.6)">
      <div style="display:flex;align-items:center;padding:16px 20px;border-bottom:1px solid var(--bor)">
        <span style="font-size:20px;margin-right:10px">💬</span>
        <span style="font-family:var(--font-d);font-size:16px;font-weight:800;color:var(--tx);flex:1">Beta-Feedback</span>
        <button onclick="document.getElementById('feedback-overlay').remove()" style="border:none;background:transparent;color:var(--tx2);font-size:18px;cursor:pointer">✕</button>
      </div>
      <div style="padding:20px;display:flex;flex-direction:column;gap:14px">
        <div>
          <label style="font-size:12px;color:var(--tx2);font-weight:600;display:block;margin-bottom:5px">Kategorie</label>
          <select id="fb-category" style="width:100%;background:var(--bgc);border:1px solid var(--bor);color:var(--tx);border-radius:var(--r-sm);padding:8px 10px;outline:none">
            <option value="bug">🐛 Fehler/Bug</option>
            <option value="feature">💡 Verbesserungsvorschlag</option>
            <option value="ui">🎨 Design-Problem</option>
            <option value="performance">⚡ Performance</option>
            <option value="other">📝 Sonstiges</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;color:var(--tx2);font-weight:600;display:block;margin-bottom:5px">Titel</label>
          <input id="fb-title" type="text" placeholder="Kurze Beschreibung…" maxlength="100"
            style="width:100%;background:var(--bgc);border:1px solid var(--bor);color:var(--tx);border-radius:var(--r-sm);padding:8px 10px;outline:none;box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:12px;color:var(--tx2);font-weight:600;display:block;margin-bottom:5px">Details</label>
          <textarea id="fb-text" rows="5" placeholder="Was ist passiert? Was hast du erwartet? Schritte zum Reproduzieren…" maxlength="1000"
            style="width:100%;background:var(--bgc);border:1px solid var(--bor);color:var(--tx);border-radius:var(--r-sm);padding:8px 10px;outline:none;resize:vertical;box-sizing:border-box;font-family:inherit"></textarea>
        </div>
        <div>
          <label style="font-size:12px;color:var(--tx2);font-weight:600;display:block;margin-bottom:5px">Version</label>
          <input id="fb-version" type="text" value="v${window.__appVersion || '3.1.14'}" readonly
            style="width:100%;background:var(--bgch);border:1px solid var(--bor);color:var(--tx3);border-radius:var(--r-sm);padding:8px 10px;outline:none;box-sizing:border-box"/>
        </div>
      </div>
      <div style="padding:14px 20px;border-top:1px solid var(--bor);display:flex;gap:8px;justify-content:flex-end">
        <button onclick="document.getElementById('feedback-overlay').remove()" class="pick-btn">Abbrechen</button>
        <button id="fb-discord-btn" class="pick-btn" style="background:transparent;border-color:var(--bor)">
          <img src="https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0b5061df29d55a746d69_icon_clyde_white_RGB.png"
            style="width:14px;height:11px;margin-right:5px;opacity:.6" onerror="this.remove()"/>
          Discord öffnen
        </button>
        <button id="fb-submit-btn" style="padding:8px 18px;background:var(--acc);color:#fff;border:none;border-radius:var(--r-sm);font-family:var(--font-d);font-weight:700;cursor:pointer">
          Feedback senden
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  document.getElementById('fb-discord-btn')?.addEventListener('click', () => {
    window.electronAPI.openExternal(DISCORD_INVITE);
  });

  document.getElementById('fb-submit-btn')?.addEventListener('click', () => {
    const category = document.getElementById('fb-category')?.value || 'other';
    const title    = document.getElementById('fb-title')?.value?.trim();
    const text     = document.getElementById('fb-text')?.value?.trim();
    const version  = window.__appVersion || '3.1.14';

    if (!title || !text) {
      showToastMsg('Bitte Titel und Details ausfüllen');
      return;
    }

    // Feedback als GitHub Issue öffnen (öffnet Browser)
    const body = encodeURIComponent(
      `**Kategorie:** ${category}\n` +
      `**Version:** ${version}\n` +
      `**Betriebssystem:** Windows\n\n` +
      `**Beschreibung:**\n${text}`
    );
    const titleEnc = encodeURIComponent(`[Beta] ${title}`);
    const issueUrl = `https://github.com/P3rc1v4l/OmniHub/issues/new?title=${titleEnc}&body=${body}&labels=beta-feedback`;

    window.electronAPI.openExternal(issueUrl);
    overlay.remove();
    showToastMsg('✓ GitHub-Issue-Formular geöffnet');
  });
}
