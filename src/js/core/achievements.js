// ═══ OmniHub v0.3.0 – core/achievements.js ═══
// Aus bundle.js extrahiert

// ═══════════════════════════════════════════════════════════════════
// OmniHub – Achievements System
// ═══════════════════════════════════════════════════════════════════

// Hilfsfunktionen
function _tot(stats) {
  return Object.values(stats||{}).reduce((a, v) => a + (v?.total||0), 0);
}
function _uniq(stats) {
  return Object.values(stats||{}).filter(v => (v?.total||0) > 0).length;
}

const ACHIEVEMENTS = [
  // ── Streaming-Meilensteine ────────────────────────────────────────
  {id:'h2',   cat:'stream',   icon:'⏰', name:{de:'2 Stunden',    en:'2 Hours'},    desc:{de:'2h gestreamt',     en:'2h streamed'},    check:(s)=>_tot(s)>=7200},
  {id:'h20',  cat:'stream',   icon:'🕔', name:{de:'20 Stunden',   en:'20 Hours'},   desc:{de:'20h gestreamt',    en:'20h streamed'},   check:(s)=>_tot(s)>=72000},
  {id:'h75',  cat:'stream',   icon:'🥉', name:{de:'75 Stunden',   en:'75 Hours'},   desc:{de:'75h gestreamt',    en:'75h streamed'},   check:(s)=>_tot(s)>=270000},
  {id:'h100', cat:'stream',   icon:'🥇', name:{de:'100 Stunden',  en:'100 Hours'},  desc:{de:'100h gestreamt',   en:'100h streamed'},  check:(s)=>_tot(s)>=360000},
  {id:'h250', cat:'stream',   icon:'🥈', name:{de:'250 Stunden',  en:'250 Hours'},  desc:{de:'250h gestreamt',   en:'250h streamed'},  check:(s)=>_tot(s)>=900000},
  {id:'h500', cat:'stream',   icon:'💎', name:{de:'500 Stunden',  en:'500 Hours'},  desc:{de:'500h gestreamt',   en:'500h streamed'},  check:(s)=>_tot(s)>=1800000},
  {id:'h1000',cat:'stream',   icon:'⭐', name:{de:'1000 Stunden', en:'1000 Hours'}, desc:{de:'1000h gestreamt',  en:'1000h streamed'}, check:(s)=>_tot(s)>=3600000},
  // ── Anbieter-Vielfalt ────────────────────────────────────────────
  {id:'prov3', cat:'provider', icon:'📺', name:{de:'3 Anbieter',   en:'3 Providers'}, desc:{de:'3 verschiedene Anbieter',   en:'3 providers used'}, check:(s)=>_uniq(s)>=3},
  {id:'prov10',cat:'provider', icon:'🌍', name:{de:'10 Anbieter',  en:'10 Providers'},desc:{de:'10 verschiedene Anbieter',  en:'10 providers used'},check:(s)=>_uniq(s)>=10},
  {id:'prov15',cat:'provider', icon:'🌎', name:{de:'15 Anbieter',  en:'15 Providers'},desc:{de:'15 verschiedene Anbieter', en:'15 providers used'},check:(s)=>_uniq(s)>=15},
  // ── Anbieter-Spezifisch ─────────────────────────────────────────
  {id:'ard1h',    cat:'provider',icon:'📻',name:{de:'Öffentlich-Rechtlich',en:'Public TV'},        desc:{de:'1h ARD oder ZDF',    en:'1h ARD or ZDF'},   check:(s)=>(s.ard?.total||0)+(s.zdf?.total||0)>=3600},
  {id:'arte1h',   cat:'provider',icon:'🎨',name:{de:'Kulturliebhaber',     en:'Culture Lover'},    desc:{de:'1h ARTE',            en:'1h ARTE'},         check:(s)=>(s.arte?.total||0)>=3600},
  {id:'joyn2h',   cat:'provider',icon:'📺',name:{de:'Free-TV Fan',         en:'Free TV Fan'},      desc:{de:'2h Joyn',            en:'2h Joyn'},         check:(s)=>(s.joyn?.total||0)>=7200},
  {id:'prime5h',  cat:'provider',icon:'📦',name:{de:'Prime-Fan',           en:'Prime Fan'},        desc:{de:'5h Prime Video',     en:'5h Prime Video'},  check:(s)=>(s.prime?.total||0)>=18000},
  {id:'spotify5h',cat:'provider',icon:'🎵',name:{de:'Musik-Liebhaber',     en:'Music Lover'},      desc:{de:'5h Spotify',         en:'5h Spotify'},      check:(s)=>(s.spotify?.total||0)>=18000},
  // ── Besondere Erfolge ─────────────────────────────────────────────
  {id:'friday',   cat:'special', icon:'🎉',name:{de:'Freitagsstreamer',   en:'Friday Streamer'},  desc:{de:'Am Freitag gestreamt', en:'Streamed on Friday'},  check:(s)=>Object.values(s||{}).some(v=>(v.byDay?.[5]||0)>0)},
  {id:'allweek',  cat:'special', icon:'🗓️',name:{de:'Allrounder',          en:'All-Rounder'},      desc:{de:'Jeden Wochentag gestreamt',en:'Streamed every day'},  check:(s)=>Array(7).fill(0).map((_,i)=>Object.values(s||{}).reduce((a,v)=>a+(v.byDay?.[i]||0),0)).every(d=>d>0)},
  {id:'wl5',      cat:'special', icon:'📝',name:{de:'Erste 5 gemerkt',    en:'First 5 Saved'},    desc:{de:'5 Titel in Watchlist',    en:'5 titles saved'},      check:()=>(typeof watchlist!=='undefined'?watchlist:[]).length>=5},
  {id:'wl10',     cat:'special', icon:'📋',name:{de:'Watchlist-Fan',      en:'Watchlist Fan'},    desc:{de:'10 Titel gemerkt',        en:'10 titles saved'},     check:()=>(typeof watchlist!=='undefined'?watchlist:[]).length>=10},
  {id:'wl25',     cat:'special', icon:'📚',name:{de:'Watchlist-Sammler',  en:'Collector'},        desc:{de:'25 Titel gemerkt',        en:'25 titles saved'},     check:()=>(typeof watchlist!=='undefined'?watchlist:[]).length>=25},
  {id:'wl50',     cat:'special', icon:'📖',name:{de:'Fleißige Watchlist', en:'Busy Watchlist'},   desc:{de:'50 Titel gemerkt',        en:'50 titles saved'},     check:()=>(typeof watchlist!=='undefined'?watchlist:[]).length>=50},
  {id:'search10', cat:'special', icon:'🔍',name:{de:'Forscher',           en:'Researcher'},       desc:{de:'10× gesucht',             en:'Searched 10×'},        check:(_,m)=>(m?.searchCount||0)>=10},
  {id:'customProv',cat:'special',icon:'🆕',name:{de:'Pionier',            en:'Pioneer'},          desc:{de:'Eigenen Anbieter erstellt',en:'Custom provider added'},check:(_,m)=>(m?.customProviderAdded||0)>=1},
  // ── Versteckt ────────────────────────────────────────────────────
  {id:'hid_night',    cat:'hidden',icon:'🌙',name:{de:'Nachtmensch',       en:'Night Owl'},        desc:{de:'Nach 23 Uhr gestreamt',   en:'Streamed after 11pm'},   hidden:true, check:(_,m)=>(m?.lateNight||0)>=1},
  {id:'hid_marathon', cat:'hidden',icon:'🏃',name:{de:'Marathon-Zuschauer',en:'Binge Watcher'},    desc:{de:'6h am Stück gestreamt',   en:'6h in a row'},           hidden:true, check:(s)=>Object.values(s||{}).some(v=>v.byDay&&Math.max(...v.byDay)>=21600)},
  {id:'hid_nostalgic',cat:'hidden',icon:'📼',name:{de:'Nostalgiker',       en:'Nostalgic'},        desc:{de:'3h auf inoffiziellen Seiten',en:'3h unofficial sites'}, hidden:true, check:(s)=>(s.cineto?.total||0)+(s.movie2k?.total||0)+(s.burning?.total||0)>=10800},
  {id:'hid_search100',cat:'hidden',icon:'🕵️',name:{de:'Suchmaschine',     en:'Search Machine'},   desc:{de:'100× gesucht',            en:'Searched 100×'},         hidden:true, check:(_,m)=>(m?.searchCount||0)>=100},
  {id:'hid_allprov',  cat:'hidden',icon:'🏅',name:{de:'Sammler',           en:'Collector'},        desc:{de:'20 verschiedene Anbieter',en:'20 providers used'},     hidden:true, check:(s)=>_uniq(s)>=20},
  {id:'hid_beta',     cat:'hidden',icon:'🧪',name:{de:'Beta-Tester',       en:'Beta Tester'},      desc:{de:'In der Beta dabei gewesen',en:'Participated in beta'},  hidden:true, check:(_,m)=>(m?.isBeta||0)>=1},
];

async function checkAchievements(statsArg = null) {
  try {
    const stats = statsArg || await window.electronAPI.getStreamStats(activeProfileId).catch(() => ({}));
    const pid   = activeProfileId || 'default';

    // Aus electron-store laden (persistent, überlebt Updates!)
    let earnedArr = await window.electronAPI.getAchievements(pid).catch(() => []);
    let meta      = await window.electronAPI.getAchievementMeta(pid).catch(() => ({}));
    
    // Migration: falls noch in localStorage
    const lsKey = `achievements_${pid}`;
    const lsData = localStorage.getItem(lsKey);
    if (lsData && (!earnedArr || earnedArr.length === 0)) {
      try {
        earnedArr = JSON.parse(lsData);
        // In electron-store migrieren
        window.electronAPI.setAchievements(pid, earnedArr);
        localStorage.removeItem(lsKey);
        console.log('[Achievements] localStorage → electron-store migriert');
      } catch {}
    }

    const earned  = new Set(earnedArr || []);
    let newOnes   = false;

    // Beta-Achievement automatisch setzen
    meta.isBeta = 1;
    meta.searchCount = (meta.searchCount || 0);

    for (const a of ACHIEVEMENTS) {
      if (earned.has(a.id)) continue;
      let ok = false;
      try { ok = a.check(stats, meta, typeof watchlist !== 'undefined' ? watchlist : []); } catch {}
      if (!ok) continue;
      earned.add(a.id);
      newOnes = true;
      const name = a.name[(typeof lang !== 'undefined' ? lang : 'de')] || a.name.de;
      if (settings?.notificationsConfig?.achievements !== false) {
        if (typeof addNotification === 'function')
          addNotification('🏆', typeof t === 'function' ? t('achievementUnlocked') : 'Achievement!', `${a.icon} ${name}`);
      }
    }
    if (newOnes) {
      // In electron-store speichern (nicht localStorage)
      window.electronAPI.setAchievements(pid, [...earned]);
      window.electronAPI.setAchievementMeta(pid, meta);
    }
  } catch (e) {
    console.warn('[Achievements] Fehler:', e.message);
  }
}

function startAchievementWatcher() {
  // Alle 5 Minuten prüfen
  setInterval(() => checkAchievements(), 5 * 60 * 1000);
  // Sofort nach Init
  setTimeout(() => checkAchievements(), 3000);
}
