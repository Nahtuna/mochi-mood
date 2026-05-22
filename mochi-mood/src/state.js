// ============ MOCHI REACTIVE STORE ============

const STORAGE_PREFIX = 'mochi_';
const PERSIST_KEYS = ['user_id', 'profile', 'settings', 'wallpaper_enabled', 'language', 'mood_set', 'reminder_time', 'security_enabled'];

const defaultState = {
  userId: localStorage.getItem('mochi_user_id'),
  entries: [],
  profile: {
    avatarEmoji: '🐰',
    avatarImg: null,
    avatarFrame: 'none',
    name: 'Mochi Chan',
    bio: 'Yêu cuộc sống từng khoảnh khắc nhỏ 🌸',
  },
  customActivities: [],
  customEvents: [],
  partnerProfile: null,
  partnerLatestEntry: null,
  currentTab: 'home',
  selectedMood: null,
  currentFilter: 'all',
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  detailDate: new Date().toISOString().slice(0, 10),
  chatHistory: [],
  settings: {
    wallpaperEnabled: localStorage.getItem('mochi_wallpaper_enabled') !== 'false',
    language: localStorage.getItem('mochi_language') || 'vi',
    moodSet: localStorage.getItem('mochi_mood_set') || 'mochi',
    reminderTime: localStorage.getItem('mochi_reminder_time') || '21:00',
    securityEnabled: localStorage.getItem('mochi_security_enabled') === 'true'
  },
  editingEntryId: null
};

// Handlers for side effects
const sideEffects = {
  userId: (val) => localStorage.setItem('mochi_user_id', val),
  settings: (val) => {
    if (val.wallpaperEnabled !== undefined) localStorage.setItem('mochi_wallpaper_enabled', val.wallpaperEnabled);
    if (val.language) localStorage.setItem('mochi_language', val.language);
    if (val.moodSet) localStorage.setItem('mochi_mood_set', val.moodSet);
    if (val.reminderTime) localStorage.setItem('mochi_reminder_time', val.reminderTime);
    if (val.securityEnabled !== undefined) localStorage.setItem('mochi_security_enabled', val.securityEnabled);
  }
};

const handler = {
  get(target, prop) {
    if (typeof target[prop] === 'object' && target[prop] !== null) {
      return new Proxy(target[prop], handler);
    }
    return target[prop];
  },
  set(target, prop, value) {
    target[prop] = value;
    
    // Trigger side effects
    if (sideEffects[prop]) {
      sideEffects[prop](value);
    }
    
    // Global notification (optional but useful for 10/10)
    // console.log(`[State] ${String(prop)} updated:`, value);
    
    return true;
  }
};

export const state = new Proxy(defaultState, handler);

// Compatibility Getters (to avoid breaking existing imports immediately)
// But we recommend using 'state' directly
export const getUserId = () => state.userId;
export const getEntries = () => state.entries;
export const getProfile = () => state.profile;

// Helper to update nested state easily
export function patchState(path, value) {
  const parts = path.split('.');
  let current = state;
  for (let i = 0; i < parts.length - 1; i++) {
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}
