// ═══ OmniHub v0.3.0 – ui/notifications.js ═══
// Aus bundle.js extrahiert

// ═══════════════════════════════════════════════════════════════════
// OmniHub – Benachrichtigungs-System
// ═══════════════════════════════════════════════════════════════════

let notifications = [];

function addNotification(icon, title, body) {
  if (!Array.isArray(notifications)) notifications = [];
  const n = {
    id:   Date.now() + Math.random(),
    icon: icon || '🔔',
    title, body,
    time: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
    date: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
  };
  notifications.unshift(n);
  notifications = notifications.slice(0, 50);
  renderNotifications();
  updateNotifBadge();
  persistNotifications();
  // Ton
  if (settings?.notificationsConfig?.sound) {
    try {
      const ctx = new AudioContext();
      const o   = ctx.createOscillator();
      const g   = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 520;
      g.gain.setValueAtTime(0.1, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      o.start(); o.stop(ctx.currentTime + 0.3);
    } catch {}
  }
  return n;
}

function renderNotifications() {
  const list = document.getElementById('notif-list');
  if (!list) return;
  if (!notifications.length) {
    list.innerHTML = `<div style="text-align:center;padding:30px;color:var(--tx2);font-size:13px">${t('noNotifications')}</div>`;
    return;
  }
  list.innerHTML = notifications.map(n => `
    <div class="notif-item" data-id="${n.id}">
      <div class="notif-item-icon">${n.icon}</div>
      <div class="notif-item-body">
        <div class="notif-item-title">${esc(n.title || '')}</div>
        <div class="notif-item-text">${esc(n.body || '')}</div>
      </div>
      <div class="notif-item-meta">
        <div class="notif-item-time">${n.time}</div>
        <button class="notif-item-del" onclick="deleteNotif(${n.id})">✕</button>
      </div>
    </div>`).join('');
}

function updateNotifBadge() {
  const b = document.getElementById('notif-badge');
  if (!b) return;
  const count = notifications.length;
  b.textContent = count > 99 ? '99+' : count;
  b.style.display = count ? 'flex' : 'none';
}

function deleteNotif(id) {
  notifications = notifications.filter(n => n.id !== id);
  renderNotifications();
  updateNotifBadge();
  persistNotifications();
}

window.deleteNotif = deleteNotif;

function persistNotifications() {
  try {
    window.electronAPI.setNotifications(
      activeProfileId || 'default',
      notifications
    );
  } catch {}
}

async function loadPersistedNotifications() {
  try {
    const saved = await window.electronAPI.getNotifications(activeProfileId || 'default');
    if (Array.isArray(saved)) {
      notifications = saved;
      renderNotifications();
      updateNotifBadge();
    }
  } catch {}
}

function setupNotificationCenter() {
  const bell = document.getElementById('notif-bell-btn');
  const nc   = document.getElementById('notif-center');
  const close = document.getElementById('notif-center-close');
  const clear = document.getElementById('notif-clear-all');
  if (!bell || !nc) return;

  bell.addEventListener('click', e => {
    e.stopPropagation();
    const open = nc.style.display === 'flex';
    nc.style.display = open ? 'none' : 'flex';
    if (!open) renderNotifications();
  });
  document.addEventListener('click', e => {
    if (nc.style.display === 'flex' && !nc.contains(e.target) && !bell.contains(e.target))
      nc.style.display = 'none';
  });
  close?.addEventListener('click', () => nc.style.display = 'none');
  clear?.addEventListener('click', () => {
    notifications = [];
    renderNotifications();
    updateNotifBadge();
    persistNotifications();
  });

  // Crash-Log Benachrichtigung
  window.electronAPI.onCrashLogFound?.(data => {
    const toast = document.createElement('div');
    toast.className = 'crash-toast';
    toast.innerHTML = `
      <div style="font-size:20px">⚠️</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:600;color:var(--tx)">Letzter Absturz erkannt</div>
        <div style="font-size:11px;color:var(--tx2);margin-top:2px">OmniHub ist beim letzten Start abgestürzt.</div>
      </div>
      <button id="crash-view-btn" class="crash-btn">Details</button>
      <button id="crash-clear-btn" class="crash-close">✕</button>`;
    document.body.appendChild(toast);
    document.getElementById('crash-view-btn')?.addEventListener('click', () => {
      alert(`Crash-Details:\n\n${data.preview}\n\nLog: %AppData%\\omnihub\\logs\\crash.log`);
    });
    document.getElementById('crash-clear-btn')?.addEventListener('click', () => {
      window.electronAPI.clearCrashLog();
      toast.remove();
    });
    setTimeout(() => toast?.remove(), 12000);
  });
}
