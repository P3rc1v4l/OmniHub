// ═══ OmniHub v0.3.0 – core/providers.js ═══
// Aus bundle.js extrahiert

// ═══════════════════════════════════════════════════════════════════
// OmniHub – Provider Definitionen
// Alle Streaming-Anbieter mit Metadaten
// ═══════════════════════════════════════════════════════════════════

const PROVIDERS_BASE = {
  // ── Video-On-Demand ──────────────────────────────────────────────
  netflix:       {name:'Netflix',         tag:'Serien & Filme',           url:'https://www.netflix.com',                 color:'#E50914', quality:'4K',   multiTab:false},
  prime:         {name:'Prime Video',     tag:'Amazon Originals',          url:'https://www.primevideo.com',              color:'#00A8E1', quality:'4K',   multiTab:false},
  disney:        {name:'Disney+',         tag:'Disney · Marvel · Star Wars',url:'https://www.disneyplus.com',            color:'#113CCF', quality:'4K',   multiTab:false},
  hbomax:        {name:'Max',             tag:'HBO & Warner Bros.',         url:'https://www.max.com',                    color:'#002BE7', quality:'4K',   multiTab:false},
  apple:         {name:'Apple TV+',       tag:'Apple Originals',           url:'https://tv.apple.com',                   color:'#000000', quality:'4K',   multiTab:false},
  paramountplus: {name:'Paramount+',      tag:'CBS & Paramount Originals', url:'https://www.paramountplus.com',           color:'#0064FF', quality:'1080p',multiTab:false},
  mubi:          {name:'MUBI',            tag:'Arthouse & Indie',          url:'https://mubi.com/de',                    color:'#29292B', quality:'1080p',multiTab:false},
  skygo:         {name:'Sky Go',          tag:'Sky Entertainment',          url:'https://www.sky.de/sky-go',              color:'#000000', quality:'1080p',multiTab:false},
  wow:           {name:'WOW',             tag:'Serien & Sport',            url:'https://www.wowtv.de',                   color:'#FF3366', quality:'1080p',multiTab:false},
  waipu:         {name:'Waipu TV',        tag:'Live-TV & Mediatheken',     url:'https://www.waipu.tv/tv-programm',       color:'#FF6600', quality:'1080p',multiTab:false},
  magenta:       {name:'MagentaTV',       tag:'Deutsche Telekom',          url:'https://www.magentatv.de',               color:'#E20074', quality:'4K',   multiTab:false},
  // ── Anime ─────────────────────────────────────────────────────────
  crunchyroll:   {name:'Crunchyroll',     tag:'Anime & Manga',             url:'https://www.crunchyroll.com',            color:'#F47521', quality:'1080p',multiTab:false},
  adn:           {name:'ADN',             tag:'Anime Digital Network',     url:'https://www.animedigitalnetwork.de',     color:'#0099FF', quality:'1080p',multiTab:false},
  // ── Live & Sport ──────────────────────────────────────────────────
  twitch:        {name:'Twitch',          tag:'Live-Streams & Gaming',     url:'https://www.twitch.tv',                  color:'#9146FF', quality:'1080p',multiTab:true, bgAudio:true},
  dazn:          {name:'DAZN',            tag:'Live-Sport',                url:'https://www.dazn.com',                   color:'#F8FF00', quality:'4K',   multiTab:false},
  // ── Video / YouTube ───────────────────────────────────────────────
  youtube:       {name:'YouTube',         tag:'Videos & Streams',          url:'https://www.youtube.com',                color:'#FF0000', quality:'4K',   multiTab:true, bgAudio:false},
  // ── Musik ─────────────────────────────────────────────────────────
  spotify:       {name:'Spotify',         tag:'Musik & Podcasts',          url:'https://open.spotify.com',               color:'#1DB954', quality:'',     multiTab:false, bgAudio:true},
  // ── Kostenlos ────────────────────────────────────────────────────
  ard:           {name:'ARD Mediathek',   tag:'Öffentlich-Rechtlich',      url:'https://www.ardmediathek.de',            color:'#003D73', quality:'HD',   multiTab:false},
  zdf:           {name:'ZDF Mediathek',   tag:'Öffentlich-Rechtlich',      url:'https://www.zdf.de',                     color:'#1A1B4B', quality:'HD',   multiTab:false},
  arte:          {name:'ARTE',            tag:'Kultur & Dokumentationen',  url:'https://www.arte.tv/de',                 color:'#E5281E', quality:'HD',   multiTab:false},
  funk:          {name:'Funk',            tag:'Content-Netzwerk ARD/ZDF',  url:'https://www.funk.net',                   color:'#000000', quality:'HD',   multiTab:false},
  kika:          {name:'KiKA',            tag:'Kinder-Mediathek',          url:'https://www.kika.de',                    color:'#00AA00', quality:'HD',   multiTab:false},
  joyn:          {name:'Joyn',            tag:'Free-TV & Mediathek',       url:'https://www.joyn.de',                    color:'#FF4C00', quality:'HD',   multiTab:false},
  rtl:           {name:'RTL+',            tag:'Entertainment & Serien',    url:'https://plus.rtl.de',                    color:'#FF0000', quality:'HD',   multiTab:false},
  // ── Inoffiziell ───────────────────────────────────────────────────
  burning:       {name:'Burning Series',  tag:'Serien-Streaming',          url:'https://bs.to',                          color:'#C0392B', quality:'',     multiTab:false},
  cineto:        {name:'Cine.to',         tag:'Filme & Serien',            url:'https://cine.to',                        color:'#1A1A2E', quality:'',     multiTab:false},
  movie2k:       {name:'Movie2k',         tag:'Filme & Serien',            url:'https://movie2k.ch',                     color:'#2C3E50', quality:'',     multiTab:false},
};

// TMDB Provider-ID → OmniHub-ID Mapping
const TMDB_PMAP = {
  8:   'netflix',     9:   'prime',       337: 'disney',
  384: 'hbomax',      2:   'apple',       531: 'paramountplus',
  100: 'mubi',        29:  'skygo',       546: 'wow',
  386: 'dazn',        67:  'crunchyroll', 283: 'adn',
  192: 'youtube',     78:  'twitch',
};

// Kategorie-Zuordnung
const PROVIDER_CAT_MAP = {
  netflix:'video',   prime:'video',      disney:'video',   hbomax:'video',
  apple:'video',     paramountplus:'video', mubi:'video',  skygo:'video',
  wow:'video',       waipu:'live',       magenta:'live',
  crunchyroll:'anime', adn:'anime',
  twitch:'live',     dazn:'live',
  youtube:'video',   spotify:'music',
  ard:'free',        zdf:'free',         arte:'free',      funk:'free',
  kika:'free',       joyn:'free',        rtl:'free',
  burning:'video',   cineto:'video',     movie2k:'video',
};

const PROVIDER_CATEGORIES = {
  all:    {de:'Alle',         en:'All',           icon:'🌐'},
  video:  {de:'Streaming',    en:'Streaming',      icon:'🎬'},
  anime:  {de:'Anime',        en:'Anime',          icon:'⛩️'},
  live:   {de:'Live & Sport', en:'Live & Sport',   icon:'📡'},
  music:  {de:'Musik',        en:'Music',          icon:'🎵'},
  free:   {de:'Kostenlos',    en:'Free',           icon:'🆓'},
  custom: {de:'Eigene',       en:'Custom',         icon:'⚙️'},
};

function getProviderCategory(id) {
  if (typeof settings !== 'undefined' && settings.providerCategories?.[id])
    return settings.providerCategories[id];
  return PROVIDER_CAT_MAP[id] || 'video';
}

function getFavicon(id, p) {
  const FAVICON_MAP = {
    apple:'tv.apple.com', adn:'animedigitalnetwork.de', ard:'ardmediathek.de',
    arte:'arte.tv', burning:'bs.to', cineto:'cine.to', crunchyroll:'crunchyroll.com',
    dazn:'dazn.com', disney:'disneyplus.com', funk:'funk.net',
    hbomax:'max.com', joyn:'joyn.de', kika:'kika.de', magenta:'magentatv.de',
    mubi:'mubi.com', movie2k:'movie2k.ch', netflix:'netflix.com',
    paramountplus:'paramountplus.com', prime:'primevideo.com', rtl:'plus.rtl.de',
    skygo:'sky.de', spotify:'open.spotify.com', twitch:'twitch.tv',
    waipu:'waipu.tv', wow:'wowtv.de', youtube:'youtube.com', zdf:'zdf.de',
    spotify:'open.spotify.com',
  };
  const domain = FAVICON_MAP[id];
  if (domain) return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  if (p?.logoUrl) return p.logoUrl;
  return `https://www.google.com/s2/favicons?domain=${(new URL(p?.url||'https://example.com').hostname)}&sz=64`;
}

function PROVIDERS() {
  const custom = (typeof customProviders !== 'undefined') ? customProviders : {};
  return { ...PROVIDERS_BASE, ...custom };
}
