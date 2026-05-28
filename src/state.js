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
    securityEnabled: localStorage.getItem('mochi_security_enabled') === 'true',
    securityType: localStorage.getItem('mochi_security_type') || 'none',
    securityPin: localStorage.getItem('mochi_security_pin') || ''
  },
  editingEntryId: null,
  dews: parseInt(localStorage.getItem('mochi_dews') || '0', 10),
  ritualsDate: localStorage.getItem('mochi_rituals_date') || '',
  rituals: (() => {
    try {
      const saved = localStorage.getItem('mochi_rituals');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 'water', text: '💧 Uống cốc nước ấm', completed: false },
      { id: 'stretch', text: '🧘 Giãn cơ nhẹ nhàng 2 phút', completed: false },
      { id: 'gratitude', text: '✍️ Viết 3 điều biết ơn', completed: false },
      { id: 'sleep', text: '🛌 Chúc ngủ ngon người thương', completed: false }
    ];
  })(),
  unlockedFrames: (() => {
    try {
      const saved = localStorage.getItem('mochi_unlocked_frames');
      return saved ? JSON.parse(saved) : ['none', 'classic'];
    } catch { return ['none', 'classic']; }
  })(),
  unlockedWallpapers: (() => {
    try {
      const saved = localStorage.getItem('mochi_unlocked_wallpapers');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  })(),
  activeWallpaper: localStorage.getItem('mochi_active_wallpaper') || 'none',
  mochiLevel: parseInt(localStorage.getItem('mochi_mochi_level') || '1', 10),
  mochiExp: parseInt(localStorage.getItem('mochi_mochi_exp') || '0', 10)
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
    if (val.securityType) localStorage.setItem('mochi_security_type', val.securityType);
    if (val.securityPin !== undefined) localStorage.setItem('mochi_security_pin', val.securityPin);
  },
  dews: (val) => localStorage.setItem('mochi_dews', val),
  ritualsDate: (val) => localStorage.setItem('mochi_rituals_date', val),
  rituals: (val) => localStorage.setItem('mochi_rituals', JSON.stringify(val)),
  unlockedFrames: (val) => localStorage.setItem('mochi_unlocked_frames', JSON.stringify(val)),
  unlockedWallpapers: (val) => localStorage.setItem('mochi_unlocked_wallpapers', JSON.stringify(val)),
  activeWallpaper: (val) => localStorage.setItem('mochi_active_wallpaper', val),
  mochiLevel: (val) => localStorage.setItem('mochi_mochi_level', val),
  mochiExp: (val) => localStorage.setItem('mochi_mochi_exp', val)
};

function createDeepProxy(obj, onChange, path = []) {
  return new Proxy(obj, {
    get(target, prop) {
      if (typeof target[prop] === 'object' && target[prop] !== null) {
        return createDeepProxy(target[prop], onChange, [...path, prop]);
      }
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      onChange(path, prop, value);
      return true;
    }
  });
}

const onChange = (path, prop, value) => {
  if (path[0] === 'settings' || prop === 'settings') {
    sideEffects.settings(state.settings);
  } else if (prop === 'userId' || path[0] === 'userId') {
    sideEffects.userId(value);
  } else if (prop === 'dews' || path[0] === 'dews') {
    sideEffects.dews(value);
  } else if (prop === 'ritualsDate' || path[0] === 'ritualsDate') {
    sideEffects.ritualsDate(value);
  } else if (prop === 'rituals' || path[0] === 'rituals') {
    sideEffects.rituals(value);
  } else if (prop === 'unlockedFrames' || path[0] === 'unlockedFrames') {
    sideEffects.unlockedFrames(state.unlockedFrames);
  } else if (prop === 'unlockedWallpapers' || path[0] === 'unlockedWallpapers') {
    sideEffects.unlockedWallpapers(state.unlockedWallpapers);
  } else if (prop === 'activeWallpaper' || path[0] === 'activeWallpaper') {
    sideEffects.activeWallpaper(state.activeWallpaper);
  } else if (prop === 'mochiLevel' || path[0] === 'mochiLevel') {
    sideEffects.mochiLevel(state.mochiLevel);
  } else if (prop === 'mochiExp' || path[0] === 'mochiExp') {
    sideEffects.mochiExp(state.mochiExp);
  }
};

export const state = createDeepProxy(defaultState, onChange);

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
