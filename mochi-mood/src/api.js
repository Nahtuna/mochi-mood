import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { state } from './state.js';
import { showToast, logger } from './utils.js';

// Initialize Supabase client
let supabase;
if (window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  logger.error('Supabase library not loaded', new Error('Missing global supabase'));
  supabase = {
    from: () => ({ 
      select: () => ({ eq: () => ({ order: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded') }) }) }) }),
      insert: () => ({ select: () => Promise.resolve({ data: null, error: new Error('Supabase not loaded') }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not loaded') }) }),
      upsert: () => Promise.resolve({ error: new Error('Supabase not loaded') })
    }),
    storage: { from: () => ({ upload: () => Promise.resolve({ error: new Error('Supabase not loaded') }), getPublicUrl: () => ({ data: { publicUrl: null } }) }) }
  };
}
export const supabaseClient = supabase;

// ============ STORAGE ============
export async function uploadFileToStorage(file, folder = 'images') {
  if (!state.userId || state.userId === 'null') return null;
  try {
    const fileExt = file.type ? file.type.split('/')[1] : 'png';
    const fileName = `${state.userId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabaseClient.storage
      .from('mochi-mood')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabaseClient.storage
      .from('mochi-mood')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (err) {
    logger.error('Lỗi tải ảnh lên', err);
    return null;
  }
}

// ============ DATA LOADING ============
export async function loadFromStorage() {
  if (!state.userId || state.userId === 'null') {
    logger.warn('loadFromStorage aborted: No userId');
    return null;
  }
  
  try {
    logger.info('Đang tải dữ liệu từ Supabase...');
    
    // 1. Load Profile
    let { data: userData, error: userError } = await supabaseClient.from('users').select('*').eq('id', state.userId).maybeSingle();
    
    if (!userData && !userError) {
      logger.info('Đang tạo hồ sơ người dùng mới...');
      const { data: { session } } = await supabaseClient.auth.getSession();
      const defaultProfile = {
        id: state.userId,
        name: session?.user?.user_metadata?.display_name || session?.user?.email?.split('@')[0] || 'Mochi User',
        avatar_emoji: '🐰',
        avatar_frame: 'none',
        badges: [],
        created_at: new Date().toISOString()
      };
      const { data: newProfile, error: createError } = await supabaseClient.from('users').insert([defaultProfile]).select().maybeSingle();
      if (!createError && newProfile) userData = newProfile;
    }

    if (userData) {
      state.profile = { ...state.profile, ...userData };
      
      // 2. Load Partner
      if (userData.partner_id) {
        const { data: pProfile } = await supabaseClient.from('users').select('*').eq('id', userData.partner_id).maybeSingle();
        if (pProfile) {
          state.partnerProfile = pProfile;
          const { data: pEntries } = await supabaseClient.from('mood_entries')
            .select('*').eq('user_id', userData.partner_id).eq('shared', true)
            .order('date', { ascending: false }).order('time', { ascending: false }).limit(1);
          if (pEntries?.length) state.partnerLatestEntry = pEntries[0];
        }
      }
    }

    // 3. Load Entries
    const { data: entriesData } = await supabaseClient.from('mood_entries').select('*').eq('user_id', state.userId).order('date', { ascending: false }).order('time', { ascending: false });
    if (entriesData) state.entries = entriesData;

    // 4. Load Custom Events
    const { data: eventsData } = await supabaseClient.from('custom_events').select('*').eq('user_id', state.userId);
    if (eventsData) state.customEvents = eventsData;
    
    return { userData, entriesData, eventsData };
  } catch(e) {
    logger.error('Lỗi tải dữ liệu', e);
    return null;
  }
}

// ============ CRUD HELPERS ============
export async function saveEntryToDB(newEntry) {
  return await supabaseClient.from('mood_entries').insert([newEntry]).select();
}

export async function deleteEntryFromDB(id) {
  return await supabaseClient.from('mood_entries').delete().eq('id', id);
}

export async function updateEntryInDB(id, updatedEntry) {
  return await supabaseClient.from('mood_entries').update(updatedEntry).eq('id', id).select();
}

export async function saveCustomEventToDB(ev) {
  return await supabaseClient.from('custom_events').insert([ev]).select();
}

export async function deleteCustomEventFromDB(id) {
  return await supabaseClient.from('custom_events').delete().eq('id', id);
}

export async function saveMessageToDB(msg) {
  return await supabaseClient.from('messages').insert([msg]).select();
}

export async function loadChatHistoryFromDB(uId, pId) {
  return await supabaseClient.from('messages')
    .select('*')
    .or(`and(sender_id.eq.${uId},receiver_id.eq.${pId}),and(sender_id.eq.${pId},receiver_id.eq.${uId})`)
    .order('created_at', { ascending: true });
}

export async function saveProfileToDB(profileData) {
  if (!state.userId) return { error: new Error('No user ID') };
  return await supabaseClient.from('users').upsert({ id: state.userId, ...profileData });
}

// ============ AUTH ============
export async function signInWithGoogle() {
  return await supabaseClient.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
}

export async function signUp(email, password, options = {}) {
  return await supabaseClient.auth.signUp({ email, password, ...options });
}

export async function signIn(email, password) {
  return await supabaseClient.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  await supabaseClient.auth.signOut();
  const MOCHI_LS_KEYS = [
    'mochi_user_id', 'mochi_profile', 'mochi_wallpaper_enabled',
    'mochi_language', 'mochi_mood_set', 'mochi_reminder_time', 'mochi_security_enabled'
  ];
  MOCHI_LS_KEYS.forEach(key => localStorage.removeItem(key));
  logger.info('Đã đăng xuất và xóa dữ liệu local.');
}

export async function getSession() {
  const { data: { session } } = await supabaseClient.auth.getSession();
  return session;
}
