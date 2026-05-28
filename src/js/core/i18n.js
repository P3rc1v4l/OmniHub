// ═══ OmniHub v0.3.0 – core/i18n.js ═══
// Aus bundle.js extrahiert

// ═══════════════════════════════════════════════════════════════════
// OmniHub – Internationalisierung (DE / EN)
// ═══════════════════════════════════════════════════════════════════

const I18N = {
  de: {
    // Navigation
    home: 'Übersicht', watchlist: 'Gemerkt', news: 'Neuigkeiten',
    upcoming: 'Upcoming', stats: 'Statistiken', settings: 'Einstellungen',
    // Suche
    searchPlaceholder: 'Anbieter, Film, Serie, YouTube-URL…',
    searchNoResults: 'Keine Ergebnisse für',
    // Allgemein
    save: 'Speichern', cancel: 'Abbrechen', delete: 'Löschen',
    close: 'Schließen', open: 'Öffnen', add: 'Hinzufügen',
    edit: 'Bearbeiten', back: 'Zurück', loading: 'Lädt…',
    yes: 'Ja', no: 'Nein', confirm: 'Bestätigen',
    // Anbieter
    addProvider: '+ Anbieter', providerSaved: 'Anbieter gespeichert',
    // Profile
    newProfile: '+ Neues Profil', profileSaved: '✓ Profil gespeichert',
    profileDeleted: 'Profil gelöscht', profileRequired: 'Mindestens 1 Profil erforderlich',
    pinSet: 'PIN gesetzt', pinWrong: 'Falscher PIN', pinRemoved: 'PIN entfernt',
    // Watchlist
    added: 'Zur Watchlist hinzugefügt', removed: 'Von Watchlist entfernt',
    alreadyAdded: '✓ Bereits in deiner Watchlist',
    // Stream
    streamEnd: 'Stream beenden?',
    // Wochentage
    days: ['So','Mo','Di','Mi','Do','Fr','Sa'],
    // Einstellungen
    settingsTitle: 'Einstellungen', settingsSaved: '✓ Einstellungen gespeichert',
    // Update
    updateAvailable: '🚀 Update verfügbar',
    updateDownloading: '⬇ Wird heruntergeladen…',
    updateReady: '✓ Update bereit – jetzt neu starten',
    upToDate: '✓ Aktuellste Version',
    // Benachrichtigungen
    noNotifications: 'Keine Benachrichtigungen',
    // Achievements
    achievementUnlocked: 'Achievement freigeschaltet!',
    // WideVine
    widevineFound: '✓ WideVine CDM installiert und aktiv',
    widevineNotFound: '✗ WideVine CDM nicht gefunden',
    widevineGuide: 'Installationsanleitung öffnen',
    // Sonstiges
    changesSaved: '✓ Änderungen gespeichert',
    changesDiscarded: 'Änderungen verworfen',
    copied: '✓ In Zwischenablage kopiert',
    error: 'Fehler',
  },
  en: {
    home: 'Overview', watchlist: 'Saved', news: 'What\'s New',
    upcoming: 'Upcoming', stats: 'Statistics', settings: 'Settings',
    searchPlaceholder: 'Provider, Movie, Series, YouTube URL…',
    searchNoResults: 'No results for',
    save: 'Save', cancel: 'Cancel', delete: 'Delete',
    close: 'Close', open: 'Open', add: 'Add',
    edit: 'Edit', back: 'Back', loading: 'Loading…',
    yes: 'Yes', no: 'No', confirm: 'Confirm',
    addProvider: '+ Provider', providerSaved: 'Provider saved',
    newProfile: '+ New Profile', profileSaved: '✓ Profile saved',
    profileDeleted: 'Profile deleted', profileRequired: 'At least 1 profile required',
    pinSet: 'PIN set', pinWrong: 'Wrong PIN', pinRemoved: 'PIN removed',
    added: 'Added to watchlist', removed: 'Removed from watchlist',
    alreadyAdded: '✓ Already in your watchlist',
    streamEnd: 'End stream?',
    days: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
    settingsTitle: 'Settings', settingsSaved: '✓ Settings saved',
    updateAvailable: '🚀 Update available',
    updateDownloading: '⬇ Downloading…',
    updateReady: '✓ Update ready – restart now',
    upToDate: '✓ You have the latest version',
    noNotifications: 'No notifications',
    achievementUnlocked: 'Achievement unlocked!',
    widevineFound: '✓ WideVine CDM installed and active',
    widevineNotFound: '✗ WideVine CDM not found',
    widevineGuide: 'Open installation guide',
    changesSaved: '✓ Changes saved',
    changesDiscarded: 'Changes discarded',
    copied: '✓ Copied to clipboard',
    error: 'Error',
  },
};

function t(key) {
  const lang = (typeof settings !== 'undefined' && settings.language) || 'de';
  return (I18N[lang] || I18N.de)[key] || (I18N.de)[key] || key;
}
