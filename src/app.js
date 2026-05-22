'use strict';
// ═══════════════════════════════════════════════════════════════════════════
//  OmniHub – app.js  v1.0.0
// ═══════════════════════════════════════════════════════════════════════════

const TMDB_IMG  = 'https://image.tmdb.org/t/p/';
const VERSION   = '1.0.0';

const DEFAULT_PROVIDERS = [
  {id:'adn',        name:'ADN',           url:'https://www.animedigitalnetwork.de', color:'#0077CC', quality:'HD',   tag:'Anime & Manga'},
  {id:'apple',      name:'Apple TV+',     url:'https://tv.apple.com',             color:'#555555', quality:'4K',   tag:'Apple Originals'},
  {id:'ard',        name:'ARD Mediathek', url:'https://www.ardmediathek.de',       color:'#003D6B', quality:'HD',   tag:'Öffentlich-rechtlich'},
  {id:'arte',       name:'ARTE',          url:'https://www.arte.tv/de',            color:'#F00000', quality:'HD',   tag:'Kultur & Dokumentation'},
  {id:'burning',    name:'BurningSeries', url:'https://bs.to',                     color:'#C0392B', quality:'HD',   tag:'Serien & Anime', multiTab:true},
  {id:'cineto',     name:'Cine.to',       url:'https://cine.to',                   color:'#8B5CF6', quality:'HD',   tag:'Filme & Serien', multiTab:true},
  {id:'crunchyroll',name:'Crunchyroll',   url:'https://www.crunchyroll.com',       color:'#F47521', quality:'4K',   tag:'Anime & Manga'},
  {id:'dazn',       name:'DAZN',          url:'https://www.dazn.com',              color:'#F8D200', quality:'4K',   tag:'Sport Live-Streams'},
  {id:'disney',     name:'Disney+',       url:'https://www.disneyplus.com',        color:'#113CCF', quality:'4K',   tag:'Marvel, Star Wars & mehr'},
  {id:'funk',       name:'Funk',          url:'https://www.funk.net',              color:'#000000', quality:'HD',   tag:'Content Creator Network'},
  {id:'hbomax',     name:'Max (HBO)',     url:'https://www.max.com',               color:'#0031DB', quality:'4K',   tag:'HBO Originals & mehr'},
  {id:'joyn',       name:'Joyn',          url:'https://www.joyn.de',               color:'#E4001B', quality:'HD',   tag:'Kostenlos streamen'},
  {id:'kika',       name:'KiKA',          url:'https://www.kika.de',               color:'#00A859', quality:'HD',   tag:'Kinder & Familie'},
  {id:'magenta',    name:'MagentaTV',     url:'https://www.magentatv.de',          color:'#E20074', quality:'4K',   tag:'Telekom Streaming'},
  {id:'movie2k',    name:'Movie2k',       url:'https://movie2k.ch/',               color:'#FF6B35', quality:'HD',   tag:'Filme & Serien'},
  {id:'mubi',       name:'MUBI',          url:'https://mubi.com',                  color:'#213F5E', quality:'HD',   tag:'Arthouse & Kino'},
  {id:'netflix',    name:'Netflix',       url:'https://www.netflix.com',           color:'#E50914', quality:'4K',   tag:'Serien & Filme'},
  {id:'paramountplus',name:'Paramount+',  url:'https://www.paramountplus.com',     color:'#0064FF', quality:'4K',   tag:'Paramount Originals'},
  {id:'prime',      name:'Prime Video',   url:'https://www.primevideo.com',        color:'#00A8E1', quality:'4K',   tag:'Amazon Originals'},
  {id:'rtl',        name:'RTL+',          url:'https://plus.rtl.de',               color:'#FF6B00', quality:'HD',   tag:'Serien & Shows'},
  {id:'skygo',      name:'Sky Go',        url:'https://www.sky.de/entertainment/sky-go', color:'#00205B', quality:'HD', tag:'Serien & Sport'},
  {id:'spotify',    name:'Spotify',       url:'https://open.spotify.com',         color:'#1DB954', quality:'-',    tag:'Musik & Podcasts', bgAudio:true},
  {id:'twitch',     name:'Twitch',        url:'https://www.twitch.tv',             color:'#9146FF', quality:'1080p',tag:'Gaming & Streams', multiTab:true},
  {id:'waipu',      name:'Waipu.tv',      url:'https://www.waipu.tv',              color:'#00B4D8', quality:'HD',   tag:'Live-TV & Mediathek'},
  {id:'wow',        name:'WOW',           url:'https://www.wowtv.de',              color:'#00A3E0', quality:'HD',   tag:'Sky ohne Abo'},
  {id:'youtube',    name:'YouTube',       url:'https://www.youtube.com',           color:'#FF0000', quality:'4K',   tag:'Videos & Streams', multiTab:true},
  {id:'zdf',        name:'ZDF Mediathek', url:'https://www.zdf.de',               color:'#163A6A', quality:'HD',   tag:'Öffentlich-rechtlich'},
];

const ACHIEVEMENTS = [
  {id:'first_stream',  name:'Erster Stream',     icon:'▶️', desc:'Irgendein Anbieter genutzt',      cat:'time',     condition: s=>totalSecs(s)>0},
  {id:'hour_1',        name:'1 Stunde',           icon:'⏱️', desc:'1 Stunde gesamt gestreamt',        cat:'time',     condition: s=>totalSecs(s)>=3600},
  {id:'hour_5',        name:'5 Stunden',          icon:'⏱️', desc:'5 Stunden gesamt gestreamt',       cat:'time',     condition: s=>totalSecs(s)>=18000},
  {id:'hour_10',       name:'10 Stunden',         icon:'⏱️', desc:'10 Stunden gesamt gestreamt',      cat:'time',     condition: s=>totalSecs(s)>=36000},
  {id:'hour_50',       name:'50 Stunden',         icon:'🏅', desc:'50 Stunden gesamt gestreamt',      cat:'time',     condition: s=>totalSecs(s)>=180000},
  {id:'hour_100',      name:'100 Stunden',        icon:'🥇', desc:'100 Stunden gesamt gestreamt',     cat:'time',     condition: s=>totalSecs(s)>=360000},
  {id:'hour_500',      name:'500 Stunden',        icon:'🏆', desc:'500 Stunden gesamt gestreamt',     cat:'time',     condition: s=>totalSecs(s)>=1800000},
  {id:'night_owl',     name:'Nachteule',          icon:'🦉', desc:'Am Wochenende gestreamt',          cat:'time',     condition: s=>(s._weekend||0)>0},
  {id:'monday_start',  name:'Wochenstart',        icon:'📅', desc:'An einem Montag gestreamt',        cat:'time',     condition: s=>(s._monday||0)>0},
  {id:'netflix_1h',    name:'Netflix Fan',        icon:'🍿', desc:'1h Netflix',                      cat:'provider', condition: s=>(s.netflix?.total||0)>=3600},
  {id:'youtube_5h',    name:'YouTube Addict',     icon:'📺', desc:'5h YouTube',                      cat:'provider', condition: s=>(s.youtube?.total||0)>=18000},
  {id:'anime_fan',     name:'Anime-Fan',          icon:'⛩️', desc:'1h Crunchyroll',                  cat:'provider', condition: s=>(s.crunchyroll?.total||0)>=3600},
  {id:'anime_master',  name:'Anime-Meister',      icon:'🎌', desc:'10h Crunchyroll',                 cat:'provider', condition: s=>(s.crunchyroll?.total||0)>=36000},
  {id:'multi_provider',name:'Viel-Streamer',      icon:'🎭', desc:'5 verschiedene Anbieter',         cat:'provider', condition: s=>Object.keys(s).filter(k=>!k.startsWith('_')).length>=5},
  {id:'all_providers', name:'Komplett-Streamer',  icon:'🌐', desc:'10 verschiedene Anbieter',        cat:'provider', condition: s=>Object.keys(s).filter(k=>!k.startsWith('_')).length>=10},
  {id:'sport_fan',     name:'Sport-Fan',          icon:'⚽', desc:'1h DAZN',                         cat:'provider', condition: s=>(s.dazn?.total||0)>=3600},
  {id:'music_fan',     name:'Musik-Fan',          icon:'🎵', desc:'1h Spotify',                      cat:'provider', condition: s=>(s.spotify?.total||0)>=3600},
  {id:'twitch_fan',    name:'Twitch-Fan',         icon:'🎮', desc:'2h Twitch',                       cat:'provider', condition: s=>(s.twitch?.total||0)>=7200},
  {id:'binge_day',     name:'Binge-Tag',          icon:'🛋️', desc:'4h an einem Tag gestreamt',       cat:'special',  condition: s=>maxDay(s)>=14400},
  {id:'early_bird',    name:'Frühaufsteher',      icon:'🌅', desc:'3h montags gesamt',               cat:'special',  condition: s=>mondaySecs(s)>=10800},
  {id:'hid_100app',    name:'Stammgast',          icon:'🏠', desc:'App 100x gestartet',              cat:'hidden', hidden:true, metaKey:'appStarts',     metaVal:100},
  {id:'hid_settings50',name:'Einstellungs-Freak', icon:'⚙️', desc:'Einstellungen 50x geöffnet',     cat:'hidden', hidden:true, metaKey:'settingsOpens',  metaVal:50},
  {id:'hid_1000h',     name:'Lebenswerk',         icon:'👑', desc:'1000h gesamt gestreamt',          cat:'hidden', hidden:true, condition: s=>totalSecs(s)>=3600000},
  {id:'hid_midnight',  name:'Mitternachts-Freak', icon:'🌙', desc:'Nach Mitternacht gestreamt',      cat:'hidden', hidden:true, metaKey:'midnightStreams', metaVal:1},
  {id:'hid_allprovider',name:'Alles-Tester',      icon:'🔍', desc:'Alle Standardanbieter genutzt',  cat:'hidden', hidden:true, condition: s=>DEFAULT_PROVIDERS.every(p=>s[p.id])},
];

const PLUGINS = [
  {id:'easylist',  name:'AdBlock (EasyList)',  desc:'Grundlegende Werbefilterung',   url:'https://easylist.to/easylist/easylist.txt'},
  {id:'easyprivacy',name:'EasyPrivacy',        desc:'Tracking-Schutz',               url:'https://easylist.to/easylist/easyprivacy.txt'},
  {id:'fanboy',    name:'Fanboy Annoyance',    desc:'Nervige Elemente entfernen',    url:'https://secure.fanboy.co.nz/fanboy-annoyance.txt'},
  {id:'adguard',   name:'AdGuard Base',        desc:'Zusätzliche Werbefilterung',    url:'https://filters.adtidy.org/extension/chromium/filters/2.txt'},
  {id:'buster',    name:'Buster CAPTCHA',      desc:'CAPTCHA-Solver Erweiterung',    url:null, infoOnly:true},
  {id:'betterttv', name:'BetterTTV',           desc:'Twitch-Verbesserungen',          url:null, infoOnly:true},
  {id:'icloud',    name:'iCloud-Passwörter',   desc:'iCloud Passwort-Integration',   url:null, infoOnly:true},
];

const TRANSLATIONS = {
  de:{home:'Übersicht',favorites:'Favoriten',watchlist:'Gemerkt',news:'Neuigkeiten',upcoming:'Upcoming',stats:'Statistiken',settings:'Einstellungen',all:'Alle',movies:'Filme',shows:'Serien',back:'Zurück',stop:'Stop',logout:'Abmelden',watching:'Schaut gerade',trending:'Trending',newReleases:'Neu',month1:'1 Monat',months6:'6 Monate',year1:'1 Jahr',design:'Design',account:'Account',clock:'Uhr',plugins:'Plugins',more:'Mehr',sortAZ:'A–Z',sortDate:'Datum',whereStream:'Wo streamen?',bookmark:'Merken',bookmarked:'Gemerkt ✓',loading:'Laden…',editCard:'Karte bearbeiten',displayName:'Anzeige-Name',description:'Beschreibung',logo:'Logo/Icon',bgImage:'Hintergrundbild',bgPosX:'Bild-Position X',bgPosY:'Bild-Position Y',bgOpacity:'Bild-Transparenz',bgColor:'Hintergrundfarbe',reset:'Reset',save:'Speichern',deleteProvider:'Anbieter löschen',addProvider:'Anbieter hinzufügen',name:'Name',add:'Hinzufügen',cancel:'Abbrechen',profileName:'Profilname',create:'Erstellen',delete:'Löschen',hiddenItems:'Ausgeblendete Einträge',pickFile:'Datei wählen',openCR:'▶ Crunchyroll öffnen',wlEmpty:'Noch nichts gemerkt.',saved:'✓ Gespeichert',disableClock:'Uhr deaktivieren',defaultAccount:'Standardkonto',achCatTime:'⏱ Streamzeit',achCatProvider:'📺 Anbieter',achCatSpecial:'✨ Besonders',achCatHidden:'🔒 Versteckt',daysShort:['So','Mo','Di','Mi','Do','Fr','Sa']},
  en:{home:'Overview',favorites:'Favorites',watchlist:'Watchlist',news:'News',upcoming:'Upcoming',stats:'Statistics',settings:'Settings',all:'All',movies:'Movies',shows:'Shows',back:'Back',stop:'Stop',logout:'Sign out',watching:'Now Watching',trending:'Trending',newReleases:'New',month1:'1 Month',months6:'6 Months',year1:'1 Year',design:'Design',account:'Account',clock:'Clock',plugins:'Plugins',more:'More',sortAZ:'A–Z',sortDate:'Date',whereStream:'Where to stream?',bookmark:'Bookmark',bookmarked:'Bookmarked ✓',loading:'Loading…',editCard:'Edit Card',displayName:'Display Name',description:'Description',logo:'Logo/Icon',bgImage:'Background Image',bgPosX:'Image X',bgPosY:'Image Y',bgOpacity:'Image Opacity',bgColor:'Background Color',reset:'Reset',save:'Save',deleteProvider:'Delete Provider',addProvider:'Add Provider',name:'Name',add:'Add',cancel:'Cancel',profileName:'Profile Name',create:'Create',delete:'Delete',hiddenItems:'Hidden Items',pickFile:'Pick File',openCR:'▶ Open Crunchyroll',wlEmpty:'Nothing bookmarked yet.',saved:'✓ Saved',disableClock:'Disable Clock',defaultAccount:'Default Account',achCatTime:'⏱ Watch Time',achCatProvider:'📺 Providers',achCatSpecial:'✨ Special',achCatHidden:'🔒 Hidden',daysShort:['Sun','Mon','Tue','Wed','Thu','Fri','Sat']},
};

// ── STATE ────────────────────────────────────────────────────────────────────
let settings={}, profiles=[], activeProfileId='default';
let currentProvider=null, currentProvUrl=null, currentView='home';
let streamTabs=[], currentTabId=null, sessions={};
let watchTimer=null, autoSaveTimer=null, clockInterval=null;
let newsData={movies:[],shows:[],anime:[]}, upcomingData={movies:[],shows:[],anime:[]};
let newsIdx=0, upcomingIdx=0, newsBgTimer=null, upcomingBgTimer=null;
let newsType='movies', upcomingType='movies', newsTab='trending', upcomingMonths=1;
let pipActive=false, pipProviderId=null, pipProvUrl=null;
let dragSrcId=null, settingsOpen=false, lang='de';
let extraAdDomains=[], installedPlugins=[];
let currentDetailItem=null, particleAnim=null, particles=[];
let wlFilter='all', wlSort='az';
let editingProviderId=null;

// ── UTILS ────────────────────────────────────────────────────────────────────
const T   = k => (TRANSLATIONS[lang]||TRANSLATIONS.de)[k]||k;
const el  = id => document.getElementById(id);
const qs  = (s,r=document) => r.querySelector(s);
const qsa = (s,r=document) => [...r.querySelectorAll(s)];
const totalSecs  = s => Object.values(s).filter(v=>v&&v.total).reduce((a,v)=>a+(v.total||0),0);
const maxDay     = s => Math.max(...Object.values(s).filter(v=>v&&v.byDay).flatMap(v=>v.byDay||[]),0);
const mondaySecs = s => Object.values(s).filter(v=>v&&v.byDay).reduce((a,v)=>a+(v.byDay?.[1]||0),0);

function toast(msg,dur=2500){const t=el('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),dur);}
function showLoading(v){el('loading').classList.toggle('show',v);}
function scheduleAutoSave(){clearTimeout(autoSaveTimer);autoSaveTimer=setTimeout(saveSettings,600);}
function trackMeta(k){const m=JSON.parse(localStorage.getItem(`achMeta_${activeProfileId}`)||'{}');m[k]=(m[k]||0)+1;localStorage.setItem(`achMeta_${activeProfileId}`,JSON.stringify(m));}

function translate(){
  document.documentElement.lang=lang;
  qsa('[data-i18n]').forEach(e=>{const k=e.dataset.i18n,t=T(k);if(t&&!e.children.length&&e.tagName!=='INPUT')e.textContent=t;});
  el('search-input').placeholder=lang==='de'?'Film, Serie, Anbieter suchen…':'Search movies, shows, providers…';
}

// ── PROVIDERS ────────────────────────────────────────────────────────────────
function allProviders(){
  const del=settings.deletedProviders||[];
  const cust=Object.values(settings.customProviders||{});
  return [...DEFAULT_PROVIDERS.filter(p=>!del.includes(p.id)),...cust.map(c=>({...c,isCustom:true}))];
}
function providerById(id){return allProviders().find(p=>p.id===id);}
function sortedProviders(){
  const list=allProviders();
  if(settings.sortAlpha)return [...list].sort((a,b)=>a.name.localeCompare(b.name));
  const ord=settings.providerOrder||[];
  if(ord.length){const o=ord.map(id=>list.find(p=>p.id===id)).filter(Boolean);const r=list.filter(p=>!ord.includes(p.id));return[...o,...r];}
  return list;
}

function renderProviders(){
  const wrap=el('providers-wrap');if(!wrap)return;
  const favIds=settings.favorites||[];
  const layout=settings.cardLayout||'normal';
  const all=sortedProviders();
  const favs=all.filter(p=>favIds.includes(p.id));
  let html='';
  if(favs.length){
    html+=`<div class="providers-section-label">⭐ ${T('favorites')}</div><div class="providers-grid" id="grid-favs">`;
    favs.forEach(p=>html+=cardHTML(p,layout));
    html+='</div>';
  }
  html+=`<div class="providers-section-label">${lang==='de'?'ALLE ANBIETER':'ALL PROVIDERS'}</div><div class="providers-grid" id="grid-all">`;
  all.forEach(p=>html+=cardHTML(p,layout));
  html+='</div>';
  wrap.innerHTML=html;
  setupCardDragDrop();
  setupCardEvents();
  updateSessionDots();
}

function cardHTML(p,layout){
  const bgColor=settings.cardBgColors?.[p.id]||p.color||'#141420';
  const bgImg=settings.cardImages?.[p.id]||'';
  const bgOff=settings.cardImageOffsets?.[p.id]||{x:0,y:0};
  const bgOpa=settings.cardBgOpacity?.[p.id]??100;
  const cName=settings.cardCustomNames?.[p.id]||p.name;
  const cTag=settings.cardCustomTags?.[p.id]||p.tag||'';
  const cLogo=settings.cardLogos?.[p.id]||'';
  const isFav=(settings.favorites||[]).includes(p.id);
  const small=layout!=='normal';
  let host=''; try{host=new URL(p.url).hostname;}catch(e){};
  const favicon=cLogo||(host?`https://www.google.com/s2/favicons?sz=128&domain=${encodeURIComponent(host)}`:'');
  const bgImgStyle=bgImg?`background-image:url(${bgImg});background-position:calc(50% + ${bgOff.x}px) calc(50% + ${bgOff.y}px);opacity:${bgOpa/100}`:'opacity:0';
  return `<div class="provider-card ${layout}" data-id="${p.id}" draggable="true">
    <div class="card-banner ${layout}" style="background:${bgColor}">
      <div class="card-banner-bg" style="${bgImgStyle}"></div>
      ${p.quality&&p.quality!=='-'?`<span class="quality-badge">${p.quality}</span>`:''}
      ${favicon?`<img class="card-favicon ${layout}" src="${favicon}" alt="" onerror="this.style.display='none'"/>`:''}
      <button class="fav-btn${isFav?' active':''}" data-fav="${p.id}">🔖</button>
      <button class="edit-btn" data-edit="${p.id}">✏️</button>
      <span class="session-dot" data-dot="${p.id}" style="display:none"></span>
    </div>
    <div class="card-info ${layout}">
      <div class="card-name ${layout}">${cName}</div>
      ${!small?`<div class="card-tag">${cTag}</div>`:''}
    </div>
  </div>`;
}

function setupCardEvents(){
  qsa('.provider-card').forEach(c=>{c.addEventListener('click',e=>{if(e.target.closest('.fav-btn,.edit-btn'))return;openProvider(c.dataset.id);});});
  qsa('.fav-btn').forEach(b=>{b.addEventListener('click',e=>{e.stopPropagation();toggleFavorite(b.dataset.fav);});});
  qsa('.edit-btn').forEach(b=>{b.addEventListener('click',e=>{e.stopPropagation();openCardEditor(b.dataset.edit);});});
}

function toggleFavorite(id){
  settings.favorites=settings.favorites||[];
  const i=settings.favorites.indexOf(id);
  if(i>=0)settings.favorites.splice(i,1);else settings.favorites.push(id);
  scheduleAutoSave();renderProviders();renderFavSub();
}

function updateSessionDots(){qsa('[data-dot]').forEach(d=>{d.style.display=sessions[d.dataset.dot]?'block':'none';});}

// ── DRAG & DROP ──────────────────────────────────────────────────────────────
function setupCardDragDrop(){
  qsa('.provider-card').forEach(c=>{
    c.addEventListener('dragstart',e=>{if(settings.sortAlpha)return e.preventDefault();dragSrcId=c.dataset.id;c.classList.add('dragging');});
    c.addEventListener('dragend',()=>{c.classList.remove('dragging');qsa('.drag-over-left,.drag-over-right').forEach(x=>{x.classList.remove('drag-over-left','drag-over-right');});});
    c.addEventListener('dragover',e=>{e.preventDefault();if(!dragSrcId||dragSrcId===c.dataset.id)return;const r=c.getBoundingClientRect();qsa('.drag-over-left,.drag-over-right').forEach(x=>{x.classList.remove('drag-over-left','drag-over-right');});c.classList.add(e.clientX<r.left+r.width/2?'drag-over-left':'drag-over-right');});
    c.addEventListener('drop',e=>{e.preventDefault();if(!dragSrcId||dragSrcId===c.dataset.id)return;const r=c.getBoundingClientRect();const before=e.clientX<r.left+r.width/2;const ord=sortedProviders().map(p=>p.id);const fi=ord.indexOf(dragSrcId);ord.splice(fi,1);const ti=ord.indexOf(c.dataset.id);ord.splice(before?ti:ti+1,0,dragSrcId);settings.providerOrder=ord;scheduleAutoSave();renderProviders();});
  });
}

// ── CARD EDITOR ──────────────────────────────────────────────────────────────
function openCardEditor(id){
  editingProviderId=id;
  const p=providerById(id);if(!p)return;
  el('edit-name').value=settings.cardCustomNames?.[id]||p.name;
  el('edit-tag').value=settings.cardCustomTags?.[id]||p.tag||'';
  const off=settings.cardImageOffsets?.[id]||{x:0,y:0};
  el('edit-pos-x').value=off.x;el('edit-pos-x-val').textContent=off.x;
  el('edit-pos-y').value=off.y;el('edit-pos-y-val').textContent=off.y;
  const opa=settings.cardBgOpacity?.[id]??100;
  el('edit-opacity').value=opa;el('edit-opacity-val').textContent=opa+'%';
  const col=settings.cardBgColors?.[id]||p.color||'#141420';
  el('edit-color').value=col;el('edit-color-hex').value=col;
  const logo=settings.cardLogos?.[id]||'';
  el('edit-logo-preview').src=logo;el('edit-logo-preview').classList.toggle('visible',!!logo);
  const bg=settings.cardImages?.[id]||'';
  el('edit-bg-preview').src=bg;el('edit-bg-preview').classList.toggle('visible',!!bg);
  el('card-editor-overlay').classList.add('open');
}

function saveCardEditor(){
  const id=editingProviderId;if(!id)return;
  settings.cardCustomNames=settings.cardCustomNames||{};
  settings.cardCustomTags=settings.cardCustomTags||{};
  settings.cardImageOffsets=settings.cardImageOffsets||{};
  settings.cardBgOpacity=settings.cardBgOpacity||{};
  settings.cardBgColors=settings.cardBgColors||{};
  settings.cardCustomNames[id]=el('edit-name').value;
  settings.cardCustomTags[id]=el('edit-tag').value;
  settings.cardImageOffsets[id]={x:+el('edit-pos-x').value,y:+el('edit-pos-y').value};
  settings.cardBgOpacity[id]=+el('edit-opacity').value;
  settings.cardBgColors[id]=el('edit-color-hex').value;
  scheduleAutoSave();
  el('card-editor-overlay').classList.remove('open');
  renderProviders();toast(T('saved'));
}
=>t.classList.toggle('active',t.dataset.stab===tab));
  const body=el('settings-body');
  if(tab==='design')body.innerHTML=renderDesignTab();
  else if(tab==='account')body.innerHTML=renderAccountTab();
  else if(tab==='clock')body.innerHTML=renderClockTab();
  else if(tab==='plugins')body.innerHTML=renderPluginsTab();
  else if(tab==='more')body.innerHTML=renderMoreTab();
  bindSettingEvents(tab);
}

function renderDesignTab(){
  const s=settings,p=s.particlesConfig||{},d=s.designOptions||{};
  const shapes_all=['Kreis','Dreieck','Raute','Stern','Linie','Hexagon','Kreuz','Pfeil','Ring','Punkt'];
  const activeShapes=p.shapes||['Kreis'];
  return`<div class="settings-section">
    <label class="settings-label">${T('bgImage')}</label>
    <div style="display:flex;gap:8px;align-items:center">
      <button class="settings-btn" id="s-bg-pick">📁 ${T('pickFile')}</button>
      <button class="settings-reset-btn" id="s-bg-reset">Reset</button>
    </div>
    ${s.appBgImage?`<img class="settings-bg-preview visible" src="${s.appBgImage}" alt=""/>`:''}
  </div>
  <div class="settings-section">
    <label class="settings-label">Akzentfarbe</label>
    <div class="settings-color-row">
      <input type="color" class="settings-color-input" id="s-accent-color" value="${s.accentColor||'#30c5bb'}"/>
      <input type="text" class="settings-hex-input" id="s-accent-hex" value="${s.accentColor||'#30c5bb'}"/>
      <button class="settings-reset-btn" id="s-accent-reset">Reset</button>
    </div>
  </div>
  <div class="settings-section">
    <label class="settings-label">Schriftart</label>
    <select class="settings-select" id="s-font">
      ${['DM Sans','Inter','Rajdhani','Orbitron','Exo 2','system-ui'].map(f=>`<option${(s.fontFamily||'DM Sans')===f?' selected':''}>${f}</option>`).join('')}
    </select>
  </div>
  <div class="settings-section">
    <label class="settings-label">Schriftgröße</label>
    <div class="settings-slider-wrap">
      <input type="range" class="settings-slider" id="s-font-size" min="10" max="22" value="${s.fontSize||14}"/>
      <span class="settings-val" id="s-font-size-val">${s.fontSize||14}px</span>
    </div>
  </div>
  <div class="settings-section">
    <label class="settings-label">Design-Optionen</label>
    <div class="settings-row"><span class="settings-row-label">Kartenrundung</span><div style="display:flex;align-items:center;gap:8px"><input type="range" class="settings-slider" id="s-radius" min="0" max="24" value="${d.cardRadius??14}" style="width:100px"/><span id="s-radius-val">${d.cardRadius??14}px</span></div></div>
    <div class="settings-row"><span class="settings-row-label">Sidebar-Breite</span><div style="display:flex;align-items:center;gap:8px"><input type="range" class="settings-slider" id="s-sidebar-w" min="160" max="280" value="${d.sidebarWidth??200}" style="width:100px"/><span id="s-sidebar-w-val">${d.sidebarWidth??200}px</span></div></div>
    <div class="settings-row"><span class="settings-row-label">Karten-Schatten</span><label class="toggle-switch"><input type="checkbox" id="s-card-shadow"${d.cardShadow?' checked':''}/><span class="toggle-slider"></span></label></div>
    <div class="settings-row"><span class="settings-row-label">Glasmorphismus</span><label class="toggle-switch"><input type="checkbox" id="s-glass"${d.glass?' checked':''}/><span class="toggle-slider"></span></label></div>
  </div>
  <div class="settings-section">
    <label class="settings-label">Partikel-Hintergrund</label>
    <div class="settings-row"><span class="settings-row-label">Aktiviert</span><label class="toggle-switch"><input type="checkbox" id="s-particles"${s.particlesEnabled?' checked':''}/><span class="toggle-slider"></span></label></div>
    <div class="settings-row"><span class="settings-row-label">Anzahl</span><div style="display:flex;align-items:center;gap:8px"><input type="range" class="settings-slider" id="s-particle-count" min="10" max="400" value="${p.count||60}" style="width:80px"/><span id="s-pc-val">${p.count||60}</span></div></div>
    <div class="settings-row"><span class="settings-row-label">Größe</span><div style="display:flex;align-items:center;gap:8px"><input type="range" class="settings-slider" id="s-particle-size" min="1" max="120" value="${Math.round((p.size||2)*10)}" style="width:80px"/><span id="s-ps-val">${(p.size||2).toFixed(1)}</span></div></div>
    <div class="settings-row"><span class="settings-row-label">Geschwindigkeit</span><div style="display:flex;align-items:center;gap:8px"><input type="range" class="settings-slider" id="s-particle-speed" min="1" max="50" value="${Math.round((p.speed||1)*10)}" style="width:80px"/><span id="s-pspeed-val">${(p.speed||1).toFixed(1)}</span></div></div>
    <div class="settings-row"><span class="settings-row-label">Farbe</span><input type="color" class="settings-color-input" id="s-particle-color" value="${p.color||'#30c5bb'}"/></div>
    <div style="margin-top:8px"><label class="settings-label">Formen</label>
      <div class="shapes-grid">${shapes_all.map(sh=>`<button class="shape-btn${activeShapes.includes(sh)?' active':''}" data-shape="${sh}">${sh}</button>`).join('')}</div>
    </div>
  </div>
  <div class="settings-section">
    <label class="settings-label">Sprache</label>
    <select class="settings-select" id="s-lang">
      <option value="de"${lang==='de'?' selected':''}>Deutsch</option>
      <option value="en"${lang==='en'?' selected':''}>English</option>
    </select>
  </div>`;
}

function renderAccountTab(){
  return`<div class="settings-section">
    ${DEFAULT_PROVIDERS.map(p=>`<div class="account-provider-item"><div class="account-provider-left"><div class="account-dot ${sessions[p.id]?'on':'off'}"></div><span class="account-provider-name">${p.name}</span></div>${sessions[p.id]?`<button class="account-logout-btn" data-acc-logout="${p.id}">Abmelden</button>`:''}</div>`).join('')}
  </div>
  <div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
    <button class="settings-btn danger" id="s-logout-all">Von ALLEN Diensten abmelden</button>
    <button class="settings-btn" id="s-google-login">🔐 Google-Login (YouTube)</button>
  </div>`;
}

function renderClockTab(){
  const c=settings.clock||{};
  return`<div class="settings-section">
    <div class="settings-row"><span class="settings-row-label">Uhr anzeigen</span><label class="toggle-switch"><input type="checkbox" id="s-clock-show"${c.enabled?' checked':''}/><span class="toggle-slider"></span></label></div>
    <div class="settings-row"><span class="settings-row-label">Typ</span><div class="clock-type-btns"><button class="clock-type-btn${(c.type||'digital')==='digital'?' active':''}" id="s-clock-digital">Digital</button><button class="clock-type-btn${c.type==='analog'?' active':''}" id="s-clock-analog">Analog</button></div></div>
    <div class="settings-row"><span class="settings-row-label">Sekunden</span><label class="toggle-switch"><input type="checkbox" id="s-clock-secs"${c.showSeconds?' checked':''}/><span class="toggle-slider"></span></label></div>
    <div class="settings-row"><span class="settings-row-label">Farbe</span><div class="settings-color-row"><input type="color" class="settings-color-input" id="s-clock-color" value="${c.color||'#30c5bb'}"/><input type="text" class="settings-hex-input" id="s-clock-hex" value="${c.color||'#30c5bb'}" style="max-width:100px"/></div></div>
    <div class="settings-row"><span class="settings-row-label">Transparenz (0=sichtbar)</span><div style="display:flex;align-items:center;gap:8px"><input type="range" class="settings-slider" id="s-clock-opacity" min="0" max="100" value="${Math.round((1-(c.opacity??1))*100)}" style="width:100px"/><span id="s-co-val">${Math.round((1-(c.opacity??1))*100)}%</span></div></div>
    <div class="settings-row"><span class="settings-row-label">Schriftgröße</span><div style="display:flex;align-items:center;gap:8px"><input type="range" class="settings-slider" id="s-clock-size" min="12" max="60" value="${c.size||32}" style="width:100px"/><span id="s-cs-val">${c.size||32}px</span></div></div>
    <div style="margin-top:10px;font-size:11px;color:var(--text3)">💡 Uhr-Tab aktiv halten und Uhr ziehen zum Verschieben</div>
  </div>`;
}

function renderPluginsTab(){
  installedPlugins=JSON.parse(localStorage.getItem('installedPlugins')||'["easylist","easyprivacy","fanboy","adguard"]');
  const total=+localStorage.getItem('totalAdDomains')||0;
  return`<div class="settings-section">
    <input type="text" class="plugin-search" id="plugin-search" placeholder="${lang==='de'?'Plugin suchen…':'Search plugin…'}"/>
    <div id="plugin-list">
      ${PLUGINS.map(pl=>`<div class="plugin-item" data-plugin-id="${pl.id}"><div class="plugin-info"><div class="plugin-name">${pl.name}</div><div class="plugin-desc">${pl.desc}</div></div><div class="plugin-actions">${pl.infoOnly?`<button class="plugin-btn" onclick="window.electronAPI.openExternal('https://www.google.com/search?q='+encodeURIComponent('${pl.name}')).catch(()=>{})">Info</button>`:installedPlugins.includes(pl.id)?`<button class="plugin-btn remove" data-plugin-remove="${pl.id}">Entfernen</button>`:`<button class="plugin-btn install" data-plugin-install="${pl.id}">Installieren</button>`}</div></div>`).join('')}
    </div>
    <div class="plugin-domain-count">Geblockte Domains gesamt: <strong>${total.toLocaleString()}</strong></div>
  </div>`;
}

function renderMoreTab(){
  const prof=profiles.find(p=>p.id===activeProfileId);
  const deleted=settings.deletedProviders||[];
  const custom=Object.values(settings.customProviders||{});
  return`<div class="settings-section">
    <label class="settings-label">Updates</label>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <button class="settings-btn" id="s-check-update">Auf Updates prüfen</button>
      <span id="s-update-result" style="font-size:12px;color:var(--text2)"></span>
    </div>
  </div>
  <div class="settings-section">
    <label class="settings-label">VPN</label>
    <button class="settings-btn" id="s-check-vpn">VPN-Status prüfen</button>
    <div id="s-vpn-result" style="margin-top:10px"></div>
  </div>
  <div class="settings-section">
    <label class="settings-label">Profil verwalten</label>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="settings-btn" id="s-rename-profile">Umbenennen</button>
      ${prof?.id!=='default'?`<button class="settings-btn danger" id="s-delete-profile">Löschen</button>`:''}
    </div>
  </div>
  <div class="settings-section">
    <label class="settings-label">Anbieter</label>
    <button class="settings-btn" id="s-restore-all">Alle Standardanbieter wiederherstellen</button>
    ${deleted.map(id=>{const p=DEFAULT_PROVIDERS.find(x=>x.id===id);return p?`<button class="settings-btn" data-restore="${id}" style="margin-top:4px">↩ ${p.name}</button>`:''}).join('')}
    ${custom.map(p=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border)"><span style="font-size:12px">${p.name}</span><button class="settings-btn danger" data-del-custom="${p.id}">Löschen</button></div>`).join('')}
  </div>`;
}

function bindSettingEvents(tab){
  if(tab==='design'){
    el('s-bg-pick')?.addEventListener('click',async()=>{const url=await window.electronAPI.pickImage('appbg').catch(()=>null);if(url){settings.appBgImage=url;applyBgImage();scheduleAutoSave();renderSettingsTab('design');}});
    el('s-bg-reset')?.addEventListener('click',()=>{settings.appBgImage='';applyBgImage();scheduleAutoSave();renderSettingsTab('design');});
    el('s-accent-color')?.addEventListener('input',e=>{settings.accentColor=e.target.value;el('s-accent-hex').value=e.target.value;applyAccent();scheduleAutoSave();});
    el('s-accent-hex')?.addEventListener('change',e=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value)){settings.accentColor=e.target.value;el('s-accent-color').value=e.target.value;applyAccent();scheduleAutoSave();}});
    el('s-accent-reset')?.addEventListener('click',()=>{settings.accentColor='#30c5bb';el('s-accent-color').value='#30c5bb';el('s-accent-hex').value='#30c5bb';applyAccent();scheduleAutoSave();});
    el('s-font')?.addEventListener('change',e=>{settings.fontFamily=e.target.value;applyFont();scheduleAutoSave();});
    el('s-font-size')?.addEventListener('input',e=>{settings.fontSize=+e.target.value;el('s-font-size-val').textContent=e.target.value+'px';applyFontSize();scheduleAutoSave();});
    el('s-radius')?.addEventListener('input',e=>{settings.designOptions=settings.designOptions||{};settings.designOptions.cardRadius=+e.target.value;el('s-radius-val').textContent=e.target.value+'px';applyDesignOptions();scheduleAutoSave();});
    el('s-sidebar-w')?.addEventListener('input',e=>{settings.designOptions=settings.designOptions||{};settings.designOptions.sidebarWidth=+e.target.value;el('s-sidebar-w-val').textContent=e.target.value+'px';applyDesignOptions();scheduleAutoSave();});
    el('s-card-shadow')?.addEventListener('change',e=>{settings.designOptions=settings.designOptions||{};settings.designOptions.cardShadow=e.target.checked;scheduleAutoSave();});
    el('s-glass')?.addEventListener('change',e=>{settings.designOptions=settings.designOptions||{};settings.designOptions.glass=e.target.checked;scheduleAutoSave();});
    el('s-particles')?.addEventListener('change',e=>{settings.particlesEnabled=e.target.checked;initParticles();scheduleAutoSave();});
    el('s-particle-count')?.addEventListener('input',e=>{settings.particlesConfig=settings.particlesConfig||{};settings.particlesConfig.count=+e.target.value;el('s-pc-val').textContent=e.target.value;initParticles();scheduleAutoSave();});
    el('s-particle-size')?.addEventListener('input',e=>{settings.particlesConfig=settings.particlesConfig||{};settings.particlesConfig.size=+e.target.value/10;el('s-ps-val').textContent=(+e.target.value/10).toFixed(1);initParticles();scheduleAutoSave();});
    el('s-particle-speed')?.addEventListener('input',e=>{settings.particlesConfig=settings.particlesConfig||{};settings.particlesConfig.speed=+e.target.value/10;el('s-pspeed-val').textContent=(+e.target.value/10).toFixed(1);initParticles();scheduleAutoSave();});
    el('s-particle-color')?.addEventListener('input',e=>{settings.particlesConfig=settings.particlesConfig||{};settings.particlesConfig.color=e.target.value;initParticles();scheduleAutoSave();});
    qsa('.shape-btn').forEach(b=>{b.addEventListener('click',()=>{const cfg=settings.particlesConfig=settings.particlesConfig||{};cfg.shapes=cfg.shapes||[];const sh=b.dataset.shape;const i=cfg.shapes.indexOf(sh);if(i>=0)cfg.shapes.splice(i,1);else cfg.shapes.push(sh);b.classList.toggle('active',cfg.shapes.includes(sh));initParticles();scheduleAutoSave();});});
    el('s-lang')?.addEventListener('change',e=>{lang=e.target.value;settings.language=lang;translate();scheduleAutoSave();});
  }
  if(tab==='account'){
    qsa('[data-acc-logout]').forEach(b=>{b.addEventListener('click',async()=>{await window.electronAPI.clearProviderSession(activeProfileId,b.dataset.accLogout).catch(()=>{});sessions[b.dataset.accLogout]=false;renderSettingsTab('account');updateSessionDots();});});
    el('s-logout-all')?.addEventListener('click',async()=>{await window.electronAPI.clearAllSessions(activeProfileId).catch(()=>{});sessions={};renderSettingsTab('account');updateSessionDots();});
    el('s-google-login')?.addEventListener('click',async()=>{await window.electronAPI.openGoogleAuthBrowser().catch(()=>{});setTimeout(()=>{sessions['youtube']=true;updateSessionDots();},30000);});
  }
  if(tab==='clock'){
    el('s-clock-show')?.addEventListener('change',e=>{settings.clock=settings.clock||{};settings.clock.enabled=e.target.checked;updateClock();scheduleAutoSave();});
    el('s-clock-digital')?.addEventListener('click',()=>{settings.clock=settings.clock||{};settings.clock.type='digital';renderSettingsTab('clock');updateClock();scheduleAutoSave();});
    el('s-clock-analog')?.addEventListener('click',()=>{settings.clock=settings.clock||{};settings.clock.type='analog';renderSettingsTab('clock');updateClock();scheduleAutoSave();});
    el('s-clock-secs')?.addEventListener('change',e=>{settings.clock=settings.clock||{};settings.clock.showSeconds=e.target.checked;scheduleAutoSave();});
    el('s-clock-color')?.addEventListener('input',e=>{settings.clock=settings.clock||{};settings.clock.color=e.target.value;el('s-clock-hex').value=e.target.value;el('clock').style.color=e.target.value;scheduleAutoSave();});
    el('s-clock-hex')?.addEventListener('change',e=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value)){settings.clock=settings.clock||{};settings.clock.color=e.target.value;el('s-clock-color').value=e.target.value;el('clock').style.color=e.target.value;scheduleAutoSave();}});
    el('s-clock-opacity')?.addEventListener('input',e=>{settings.clock=settings.clock||{};const op=1-(+e.target.value/100);settings.clock.opacity=op;el('s-co-val').textContent=e.target.value+'%';el('clock').style.opacity=op;if(+e.target.value>=100){settings.clock.enabled=false;updateClock();}scheduleAutoSave();});
    el('s-clock-size')?.addEventListener('input',e=>{settings.clock=settings.clock||{};settings.clock.size=+e.target.value;el('s-cs-val').textContent=e.target.value+'px';el('clock').style.fontSize=e.target.value+'px';scheduleAutoSave();});
  }
  if(tab==='plugins'){
    el('plugin-search')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();qsa('.plugin-item').forEach(i=>{i.style.display=(i.querySelector('.plugin-name').textContent.toLowerCase().includes(q)||i.dataset.pluginId.includes(q))?'':'none';});});
    qsa('[data-plugin-install]').forEach(b=>{b.addEventListener('click',()=>installPlugin(b.dataset.pluginInstall));});
    qsa('[data-plugin-remove]').forEach(b=>{b.addEventListener('click',()=>removePlugin(b.dataset.pluginRemove));});
  }
  if(tab==='more'){
    el('s-check-update')?.addEventListener('click',async()=>{
      el('s-update-result').textContent='Prüfe…';
      const r=await window.electronAPI.checkForUpdates().catch(()=>({available:false}));
      if(r.available){el('s-update-result').textContent=`🚀 Update v${r.version} verfügbar!`;el('update-badge').style.display='block';}
      else el('s-update-result').textContent='✓ Du hast bereits die aktuellste Version.';
    });
    el('s-check-vpn')?.addEventListener('click',async()=>{
      const r=await window.electronAPI.checkVpn().catch(()=>({}));
      if(r.error){el('s-vpn-result').innerHTML=`<span style="color:#ff5555">${r.error}</span>`;return;}
      el('s-vpn-result').innerHTML=`<div class="vpn-info">IP: ${r.ip||'?'} | Land: ${r.country||'?'}<br>ISP: ${r.org||'?'}<br>VPN: <span class="${r.isVpn?'vpn-status-ok':'vpn-status-warn'}">${r.isVpn?'Erkannt ✓':'Nicht erkannt'}</span></div>`;
    });
    el('s-rename-profile')?.addEventListener('click',()=>{const n=prompt('Neuer Profilname:');if(n){const prof=profiles.find(p=>p.id===activeProfileId);if(prof){prof.name=n;window.electronAPI.setProfiles(profiles).catch(()=>{});renderProfileSelect();}}});
    el('s-delete-profile')?.addEventListener('click',()=>showDeleteProfileModal(activeProfileId));
    el('s-restore-all')?.addEventListener('click',()=>{settings.deletedProviders=[];scheduleAutoSave();renderProviders();renderSettingsTab('more');});
    qsa('[data-restore]').forEach(b=>{b.addEventListener('click',()=>{settings.deletedProviders=(settings.deletedProviders||[]).filter(id=>id!==b.dataset.restore);scheduleAutoSave();renderProviders();renderSettingsTab('more');});});
    qsa('[data-del-custom]').forEach(b=>{b.addEventListener('click',()=>{delete(settings.customProviders=settings.customProviders||{})[b.dataset.delCustom];scheduleAutoSave();renderProviders();renderSettingsTab('more');});});
  }
}

async function installPlugin(id){
  const pl=PLUGINS.find(p=>p.id===id);if(!pl||!pl.url)return;
  showLoading(true);
  const r=await window.electronAPI.fetchAdblockList(pl.url).catch(()=>({ok:false}));
  showLoading(false);
  if(r.ok){
    if(!installedPlugins.includes(id))installedPlugins.push(id);
    localStorage.setItem('installedPlugins',JSON.stringify(installedPlugins));
    extraAdDomains=[...new Set([...extraAdDomains,...(r.domains||[])])];
    localStorage.setItem('totalAdDomains',String(extraAdDomains.length));
    await window.electronAPI.applyExtraAdDomains(extraAdDomains).catch(()=>{});
    toast(`✓ ${pl.name} installiert (${r.count} Domains)`);
    renderSettingsTab('plugins');
  }else{toast('Fehler beim Laden der Plugin-Liste');}
}
function removePlugin(id){installedPlugins=installedPlugins.filter(p=>p!==id);localStorage.setItem('installedPlugins',JSON.stringify(installedPlugins));renderSettingsTab('plugins');}

function showDeleteProfileModal(id){
  const prof=profiles.find(p=>p.id===id);if(!prof||id==='default')return;
  el('profile-delete-title').textContent=`Profil löschen`;
  el('profile-delete-text').textContent=`Möchtest du das Profil „${prof.name}" wirklich löschen? Alle Daten werden entfernt.`;
  el('profile-delete-overlay').classList.add('open');
  el('profile-delete-confirm').onclick=()=>{deleteProfile(id);el('profile-delete-overlay').classList.remove('open');closeSettings();};
  el('profile-delete-cancel').onclick=()=>el('profile-delete-overlay').classList.remove('open');
}

// ── CR WIDGET ─────────────────────────────────────────────────────────────────
async function loadCrWidget(){
  const list=el('cr-mini-list');if(!list)return;
  try{
    const data=await window.electronAPI.getUpcoming(1);
    const anime=(data.anime||[]).slice(0,10);
    if(!anime.length){list.innerHTML='<div style="font-size:10px;color:var(--text3);padding:4px 8px">Keine Daten</div>';return;}
    list.innerHTML=anime.map(item=>`<div class="cr-mini-item" data-cr="${item.id}" data-crt="${item.media_type||'tv'}">${item.poster_path?`<img class="cr-mini-poster" src="${TMDB_IMG}w92${item.poster_path}" onerror="this.style.display='none'" alt=""/>`:''}<div class="cr-mini-info"><div class="cr-mini-title">${item.title||item.name||''}</div><div class="cr-mini-date">${(item.first_air_date||item.release_date||'').slice(0,10)}</div></div></div>`).join('');
    qsa('.cr-mini-item',list).forEach(i=>{i.addEventListener('click',()=>openDetail({id:+i.dataset.cr,media_type:i.dataset.crt}));});
  }catch(e){}
}

// ── VIEW / NAV ────────────────────────────────────────────────────────────────
function showView(id){
  currentView=id;
  qsa('.view').forEach(v=>v.classList.toggle('active',v.id===`view-${id}`));
  qsa('.nav-btn[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===id));
}

function renderFavSub(){
  const favIds=settings.favorites||[];
  const provs=allProviders().filter(p=>favIds.includes(p.id));
  const list=el('fav-sub-list'),empty=el('fav-empty');
  if(!list)return;
  if(!provs.length){list.innerHTML='';empty.style.display='block';return;}
  empty.style.display='none';
  list.innerHTML=provs.map(p=>`<div class="nav-sub-item${currentProvider===p.id?' active':''}" data-fav-open="${p.id}">${settings.cardCustomNames?.[p.id]||p.name}</div>`).join('');
  qsa('[data-fav-open]',list).forEach(i=>{i.addEventListener('click',()=>openProvider(i.dataset.favOpen));});
}

// ── FULLSCREEN ────────────────────────────────────────────────────────────────
async function setFullscreen(fs){
  await window.electronAPI.setFullscreen(fs).catch(()=>{});
  el('sidebar').style.display=fs?'none':'';
  el('titlebar').style.display=fs?'none':'';
  el('stream-topbar').style.display=fs?'none':'';
  if(fs){
    const exitBtn=el('fullscreen-exit');
    document.addEventListener('mousemove',function fsMove(e){if(e.clientY<60){exitBtn.style.display='block';clearTimeout(fsMove._t);fsMove._t=setTimeout(()=>exitBtn.style.display='none',2000);}});
  }else{
    el('fullscreen-exit').style.display='none';
  }
}

// ── ONLINE STATUS ─────────────────────────────────────────────────────────────
async function checkOnline(){const ok=await window.electronAPI.checkOnline().catch(()=>false);el('offline-badge').style.display=ok?'none':'flex';}

// ── INIT ──────────────────────────────────────────────────────────────────────
async function init(){
  await loadSettings();
  profiles=await window.electronAPI.getProfiles().catch(()=>[]);
  if(!profiles?.length)profiles=[{id:'default',name:'Standardkonto',favorites:[],watchlist:[],searchHistory:[],viewHistory:[]}];
  activeProfileId=await window.electronAPI.getActiveProfile().catch(()=>'default');
  const storedTheme=await window.electronAPI.getTheme().catch(()=>'dark');
  settings.theme=storedTheme;
  sessions=await window.electronAPI.getAllSessions(activeProfileId).catch(()=>({}));
  extraAdDomains=JSON.parse(localStorage.getItem('extraAdDomains')||'[]');

  applyAllSettings();
  renderProfileSelect();

  // Profile-Select
  el('profile-select')?.addEventListener('change',e=>switchProfile(e.target.value));

  // Profil hinzufügen
  el('profile-add-btn')?.addEventListener('click',()=>{el('profile-name-input').value='';el('profile-modal-overlay').classList.add('open');});
  el('profile-modal-save')?.addEventListener('click',()=>{const n=el('profile-name-input').value.trim();if(n){createProfile(n);el('profile-modal-overlay').classList.remove('open');}});
  el('profile-modal-close')?.addEventListener('click',()=>el('profile-modal-overlay').classList.remove('open'));
  el('profile-modal-cancel')?.addEventListener('click',()=>el('profile-modal-overlay').classList.remove('open'));
  el('profile-delete-cancel')?.addEventListener('click',()=>el('profile-delete-overlay').classList.remove('open'));

  // Theme-Toggle
  el('theme-toggle').checked=(settings.theme||'dark')==='light';
  el('theme-toggle')?.addEventListener('change',e=>{applyTheme(e.target.checked?'light':'dark');scheduleAutoSave();});

  // Titlebar
  el('btn-minimize')?.addEventListener('click',()=>window.electronAPI.minimize().catch(()=>{}));
  el('btn-maximize')?.addEventListener('click',()=>window.electronAPI.maximize().catch(()=>{}));
  el('btn-close')?.addEventListener('click',()=>window.electronAPI.close().catch(()=>{}));

  // Nav
  qsa('.nav-btn[data-view]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const v=btn.dataset.view;
      if(v==='home'){showView('home');renderProviders();}
      else if(v==='watchlist'){showView('watchlist');renderWatchlist();}
      else if(v==='news'){showView('news');loadNews(newsType,newsTab);}
      else if(v==='upcoming'){showView('upcoming');loadUpcoming(upcomingType,upcomingMonths);}
      else if(v==='stats'){showView('stats');buildStats();}
      else showView(v);
    });
  });

  // Favoriten-Sub
  el('nav-favs-toggle')?.addEventListener('click',()=>{
    const sub=el('nav-favs-sub'),btn=el('nav-favs-toggle');
    const open=sub.classList.toggle('open');btn.classList.toggle('open',open);
    if(open)renderFavSub();
  });
  el('fav-search')?.addEventListener('input',e=>{const q=e.target.value.toLowerCase();qsa('.nav-sub-item').forEach(i=>{i.style.display=i.textContent.toLowerCase().includes(q)?'':'none';});});

  // Einstellungen
  el('btn-settings')?.addEventListener('click',openSettings);
  el('settings-close')?.addEventListener('click',closeSettings);
  el('settings-overlay')?.addEventListener('click',closeSettings);
  qsa('.settings-tab').forEach(t=>{t.addEventListener('click',()=>renderSettingsTab(t.dataset.stab));});

  // Stream-Buttons
  el('btn-back')?.addEventListener('click',()=>showView('home'));
  el('btn-stop')?.addEventListener('click',stopStream);
  el('btn-pip')?.addEventListener('click',openPip);
  el('pip-expand')?.addEventListener('click',expandPip);
  el('pip-close')?.addEventListener('click',closePip);
  el('btn-second-window')?.addEventListener('click',()=>{if(currentProvider)window.electronAPI.openSecondWindow({url:currentProvUrl,title:el('stream-title').textContent}).catch(()=>{});});
  el('btn-fullscreen')?.addEventListener('click',()=>window.electronAPI.isFullscreen().then(fs=>setFullscreen(!fs)).catch(()=>{}));
  el('btn-retry')?.addEventListener('click',()=>{if(currentProvUrl)el('main-webview').src=currentProvUrl;});
  el('btn-logout-provider')?.addEventListener('click',async()=>{if(!currentProvider)return;await window.electronAPI.clearProviderSession(activeProfileId,currentProvider).catch(()=>{});sessions[currentProvider]=false;updateSessionDots();if(currentProvUrl)el('main-webview').src=currentProvUrl;});
  el('fullscreen-exit')?.addEventListener('click',()=>setFullscreen(false));
  el('update-badge')?.addEventListener('click',()=>window.electronAPI.installUpdate().catch(()=>{}));

  // Keyboard shortcuts
  window.addEventListener('keydown',e=>{
    if(e.key==='F11'){e.preventDefault();window.electronAPI.isFullscreen().then(fs=>setFullscreen(!fs)).catch(()=>{});}
    if(e.key==='Escape')setFullscreen(false);
    if(e.ctrlKey&&e.key==='f'){e.preventDefault();el('search-input')?.focus();}
    if(e.ctrlKey&&e.key==='m')openPip();
  });

  // Detail
  el('detail-overlay')?.addEventListener('click',e=>{if(e.target===el('detail-overlay'))closeDetail();});
  el('detail-close')?.addEventListener('click',closeDetail);
  el('detail-where')?.addEventListener('click',()=>{if(currentDetailItem)window.electronAPI.openExternal(`https://www.werstreamt.es/suche/?q=${encodeURIComponent(el('detail-title').textContent)}`).catch(()=>{});});
  el('detail-google')?.addEventListener('click',()=>{if(currentDetailItem)window.electronAPI.openExternal(`https://www.google.com/search?q=${encodeURIComponent(el('detail-title').textContent)}`).catch(()=>{});});
  el('detail-bookmark')?.addEventListener('click',()=>{if(!currentDetailItem)return;const added=toggleBookmark(currentDetailItem);el('detail-bookmark').innerHTML=`🔖 ${added?T('bookmarked'):T('bookmark')}`;el('detail-bookmark').classList.toggle('bookmarked',added);if(!added&&currentView==='watchlist')renderWatchlist();});

  // News
  el('news-prev')?.addEventListener('click',()=>{newsIdx=Math.max(0,newsIdx-1);renderSlideshow('news',newsData[newsType]||[]);});
  el('news-next')?.addEventListener('click',()=>{const a=newsData[newsType]||[];newsIdx=Math.min(a.length-1,newsIdx+1);renderSlideshow('news',a);});
  qsa('[data-media-type][data-view-id="news"]').forEach(b=>{b.addEventListener('click',()=>{qsa('[data-view-id="news"]').forEach(x=>x.classList.toggle('active',x===b));newsType=b.dataset.mediaType;newsIdx=0;renderSlideshow('news',newsData[newsType]||[]);});});
  qsa('[data-news-tab]').forEach(t=>{t.addEventListener('click',()=>{qsa('[data-news-tab]').forEach(x=>x.classList.toggle('active',x===t));loadNews(newsType,t.dataset.newsTab);});});
  el('news-hidden-btn')?.addEventListener('click',()=>showHiddenPanel('news'));

  // Upcoming
  el('upcoming-prev')?.addEventListener('click',()=>{upcomingIdx=Math.max(0,upcomingIdx-1);renderSlideshow('upcoming',upcomingData[upcomingType]||[]);});
  el('upcoming-next')?.addEventListener('click',()=>{const a=upcomingData[upcomingType]||[];upcomingIdx=Math.min(a.length-1,upcomingIdx+1);renderSlideshow('upcoming',a);});
  qsa('[data-media-type][data-view-id="upcoming"]').forEach(b=>{b.addEventListener('click',()=>{qsa('[data-view-id="upcoming"]').forEach(x=>x.classList.toggle('active',x===b));upcomingType=b.dataset.mediaType;upcomingIdx=0;renderSlideshow('upcoming',upcomingData[upcomingType]||[]);});});
  qsa('[data-months]').forEach(b=>{b.addEventListener('click',()=>{qsa('[data-months]').forEach(x=>x.classList.toggle('active',x===b));loadUpcoming(upcomingType,+b.dataset.months);});});
  el('upcoming-hidden-btn')?.addEventListener('click',()=>showHiddenPanel('upcoming'));

  // Watchlist Filter/Sort
  qsa('[data-wl-type]').forEach(b=>{b.addEventListener('click',()=>{qsa('[data-wl-type]').forEach(x=>x.classList.toggle('active',x===b));wlFilter=b.dataset.wlType;renderWatchlist();});});
  el('watchlist-sort')?.addEventListener('change',e=>{wlSort=e.target.value;renderWatchlist();});

  // Card-Editor
  el('card-editor-close')?.addEventListener('click',()=>el('card-editor-overlay').classList.remove('open'));
  el('card-editor-overlay')?.addEventListener('click',e=>{if(e.target===el('card-editor-overlay'))el('card-editor-overlay').classList.remove('open');});
  el('edit-save')?.addEventListener('click',saveCardEditor);
  el('edit-reset')?.addEventListener('click',()=>{const id=editingProviderId;if(!id)return;['cardCustomNames','cardCustomTags','cardImages','cardLogos','cardBgColors','cardBgOpacity','cardImageOffsets'].forEach(k=>{if(settings[k])delete settings[k][id];});scheduleAutoSave();el('card-editor-overlay').classList.remove('open');renderProviders();});
  el('edit-delete')?.addEventListener('click',()=>{const id=editingProviderId;if(!id)return;settings.deletedProviders=settings.deletedProviders||[];settings.deletedProviders.push(id);if(settings.customProviders?.[id])delete settings.customProviders[id];scheduleAutoSave();el('card-editor-overlay').classList.remove('open');renderProviders();});
  el('edit-pos-x')?.addEventListener('input',e=>el('edit-pos-x-val').textContent=e.target.value);
  el('edit-pos-y')?.addEventListener('input',e=>el('edit-pos-y-val').textContent=e.target.value);
  el('edit-opacity')?.addEventListener('input',e=>el('edit-opacity-val').textContent=e.target.value+'%');
  el('edit-color')?.addEventListener('input',e=>el('edit-color-hex').value=e.target.value);
  el('edit-color-hex')?.addEventListener('change',e=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value))el('edit-color').value=e.target.value;});
  el('edit-logo-pick')?.addEventListener('click',async()=>{const url=await window.electronAPI.pickImage('logo').catch(()=>null);if(url){settings.cardLogos=settings.cardLogos||{};settings.cardLogos[editingProviderId]=url;el('edit-logo-preview').src=url;el('edit-logo-preview').classList.add('visible');}});
  el('edit-bg-pick')?.addEventListener('click',async()=>{const url=await window.electronAPI.pickImage('cardbg').catch(()=>null);if(url){settings.cardImages=settings.cardImages||{};settings.cardImages[editingProviderId]=url;el('edit-bg-preview').src=url;el('edit-bg-preview').classList.add('visible');}});

  // Add Provider
  el('add-provider-btn')?.addEventListener('click',()=>el('add-provider-overlay').classList.add('open'));
  el('add-provider-close')?.addEventListener('click',()=>el('add-provider-overlay').classList.remove('open'));
  el('add-provider-cancel')?.addEventListener('click',()=>el('add-provider-overlay').classList.remove('open'));
  el('add-provider-overlay')?.addEventListener('click',e=>{if(e.target===el('add-provider-overlay'))el('add-provider-overlay').classList.remove('open');});
  el('new-provider-color')?.addEventListener('input',e=>el('new-provider-color-hex').value=e.target.value);
  el('new-provider-color-hex')?.addEventListener('change',e=>{if(/^#[0-9a-f]{6}$/i.test(e.target.value))el('new-provider-color').value=e.target.value;});
  el('add-provider-save')?.addEventListener('click',()=>{
    const name=el('new-provider-name').value.trim(),url=el('new-provider-url').value.trim(),color=el('new-provider-color-hex').value||'#30c5bb';
    if(!name||!url)return;
    const id='custom_'+Date.now();
    settings.customProviders=settings.customProviders||{};
    settings.customProviders[id]={id,name,url,color,quality:'',tag:'Eigener Anbieter',isCustom:true};
    scheduleAutoSave();el('add-provider-overlay').classList.remove('open');
    el('new-provider-name').value='';el('new-provider-url').value='';
    renderProviders();
  });

  // Sort + Layout
  el('sort-alpha-btn')?.addEventListener('click',()=>{settings.sortAlpha=!settings.sortAlpha;el('sort-alpha-btn').classList.toggle('active',settings.sortAlpha);scheduleAutoSave();renderProviders();});
  if(settings.sortAlpha)el('sort-alpha-btn')?.classList.add('active');
  qsa('.layout-btn').forEach(b=>{b.addEventListener('click',()=>{settings.cardLayout=b.dataset.layout;qsa('.layout-btn').forEach(x=>x.classList.toggle('active',x===b));scheduleAutoSave();renderProviders();});});
  const curLayout=settings.cardLayout||'normal';qsa('.layout-btn').forEach(b=>b.classList.toggle('active',b.dataset.layout===curLayout));

  // CR Widget
  el('sidebar-cr-toggle')?.addEventListener('click',()=>{const body=el('sidebar-cr-body');const open=body.classList.toggle('open');el('sidebar-cr-toggle').querySelector('.chevron').style.transform=open?'rotate(180deg)':'';if(open)loadCrWidget();});
  el('cr-open-cr')?.addEventListener('click',e=>{e.preventDefault();openProvider('crunchyroll');});

  // Hidden Panel
  el('hidden-panel-close')?.addEventListener('click',()=>el('hidden-panel').classList.remove('open'));
  el('hidden-panel')?.addEventListener('click',e=>{if(e.target===el('hidden-panel'))el('hidden-panel').classList.remove('open');});

  // Clock Context
  el('clock')?.addEventListener('contextmenu',e=>{e.preventDefault();const cm=el('clock-context');cm.style.left=e.clientX+'px';cm.style.top=e.clientY+'px';cm.classList.add('open');});
  document.addEventListener('click',()=>el('clock-context')?.classList.remove('open'));
  el('clock-disable')?.addEventListener('click',()=>{settings.clock=settings.clock||{};settings.clock.enabled=false;updateClock();scheduleAutoSave();});

  // Clock Drag (nur wenn Clock-Tab aktiv)
  let cdrag=false,cox=0,coy=0,clx=0,cly=0;
  document.addEventListener('mousedown',e=>{
    const clk=el('clock');if(!clk)return;
    if(!settingsOpen||!qs('.settings-tab.active[data-stab="clock"]'))return;
    if(e.target!==clk&&!clk.contains(e.target))return;
    cdrag=true;cox=e.clientX-clk.offsetLeft;coy=e.clientY-clk.offsetTop;clk.classList.add('dragging');
  });
  document.addEventListener('mousemove',e=>{if(!cdrag)return;const clk=el('clock');clx=e.clientX-cox;cly=e.clientY-coy;clk.style.left=clx+'px';clk.style.top=cly+'px';});
  document.addEventListener('mouseup',()=>{if(!cdrag)return;cdrag=false;el('clock').classList.remove('dragging');settings.clock=settings.clock||{};settings.clock.position={x:clx,y:cly};scheduleAutoSave();});

  // PiP Drag
  (() => {
    const pip=el('pip-window'),bar=el('pip-topbar');if(!pip||!bar)return;
    let dr=false,pdx=0,pdy=0,px0=0,py0=0;
    bar.addEventListener('mousedown',e=>{dr=true;pdx=pip.offsetLeft;pdy=pip.offsetTop;px0=e.clientX;py0=e.clientY;});
    document.addEventListener('mousemove',e=>{if(!dr)return;pip.style.left=(pdx+e.clientX-px0)+'px';pip.style.top=(pdy+e.clientY-py0)+'px';pip.style.right='auto';pip.style.bottom='auto';});
    document.addEventListener('mouseup',()=>{dr=false;});
  })();

  // Update-Events
  window.electronAPI.onUpdateAvailable(()=>{el('update-badge').style.display='block';}).catch(()=>{});

  // Search
  initSearch();

  // Checks
  checkOnline();setInterval(checkOnline,30000);
  setTimeout(()=>window.electronAPI.checkVpn().then(r=>{if(r.isVpn)el('vpn-badge').style.display='flex';}).catch(()=>{}),8000);
  setInterval(refreshSessions,60000);

  // Achievements
  trackMeta('appStarts');setTimeout(checkAchievements,2000);

  // Provider rendern
  renderProviders();

  console.log('OmniHub v1.0.0 bereit ✓');
}

document.addEventListener('DOMContentLoaded', init);
