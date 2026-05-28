import { AVATAR_EMOJIS } from '../config.js';
import { state } from '../state.js';
import { showToast, formatDate, calcStreak } from '../utils.js';
import { saveProfileToDB, uploadFileToStorage } from '../api.js';
import { openPinSetup } from './security.js';

export function loadProfile() {
  try {
    const saved = localStorage.getItem('mochi_profile');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.profile = { ...state.profile, ...parsed };
      if (!state.profile.avatarImg && state.profile.avatarUrl) {
        state.profile.avatarImg = state.profile.avatarUrl;
      }
    }
  } catch(e) {}
  updateProfileUI();
}

export async function saveProfile() {
  try { 
    localStorage.setItem('mochi_profile', JSON.stringify(state.profile));
    await saveProfileToDB({
      name: state.profile.name,
      bio: state.profile.bio,
      avatar_emoji: state.profile.avatarEmoji,
      avatar_url: state.profile.avatarImg,
      avatar_frame: state.profile.avatarFrame
    });
  } catch(e) { console.error('Save profile error:', e); }
}

export function updateProfileUI() {
  const avWrap = document.querySelector('.avatar-wrapper');
  if (avWrap) {
    avWrap.className = 'avatar-wrapper ' + (state.profile.avatarFrame || 'none');
  }
  const previewFrame = document.getElementById('previewFrame');
  if (previewFrame) {
    previewFrame.className = 'premium-frame ' + (state.profile.avatarFrame || 'none');
  }
  const avEl = document.getElementById('profileAvatar');
  if (avEl) {
    if (state.profile.avatarImg) {
      avEl.style.fontSize = 'inherit';
      avEl.innerHTML = `<img src="${state.profile.avatarImg}" alt="avatar">`;
    } else {
      avEl.style.fontSize = '40px';
      avEl.textContent = state.profile.avatarEmoji;
    }
  }
  const nameEl = document.getElementById('profileName');
  if (nameEl) nameEl.textContent = state.profile.name;
  const bioEl = document.getElementById('profileBio');
  if (bioEl) bioEl.textContent = state.profile.bio;

  const pairMe = document.querySelector('.pair-avatar.me');
  if (pairMe) {
    if (state.profile.avatarImg) {
      pairMe.style.overflow = 'hidden';
      pairMe.innerHTML = `<img src="${state.profile.avatarImg}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else {
      pairMe.textContent = state.profile.avatarEmoji;
    }
  }

  const streak = calcStreak(state.entries);
  const streakEl = document.getElementById('meStreakNum');
  if (streakEl) streakEl.textContent = streak;
  const totalEl = document.getElementById('meTotalEntries');
  if (totalEl) totalEl.textContent = state.entries.length;
  const daysEl = document.getElementById('meTotalDays');
  if (daysEl) daysEl.textContent = new Set(state.entries.map(e => e.date)).size;

  updateBadges();
  updateSettingsUI();
}

export function updateSettingsUI() {
  const wpToggle = document.getElementById('wallpaperToggle');
  if (wpToggle) wpToggle.checked = state.settings.wallpaperEnabled;

  const langVal = document.getElementById('langValue');
  if (langVal) langVal.textContent = state.settings.language === 'vi' ? 'Tiếng Việt' : 'English';

  const moodVal = document.getElementById('moodSetValue');
  if (moodVal) moodVal.textContent = state.settings.moodSet.charAt(0).toUpperCase() + state.settings.moodSet.slice(1);

  const remVal = document.getElementById('reminderValue');
  if (remVal) remVal.textContent = state.settings.reminderTime;

  const secVal = document.getElementById('securityValue');
  if (secVal) {
    const type = state.settings.securityType || 'none';
    secVal.textContent = type === 'none' ? 'Tắt' : 'Mã PIN';
  }

  // Update Dews visual
  const meBadge = document.getElementById('meDewsCount');
  const shopBadge = document.getElementById('shopDewsCount');
  if (meBadge) meBadge.textContent = state.dews;
  if (shopBadge) shopBadge.textContent = state.dews;

  // Update locks in avatar frame picker
  const unlocked = state.unlockedFrames || ['none', 'classic'];
  const allOptIds = ['none', 'classic', 'royal', 'sparkle', 'flower', 'galaxy'];
  allOptIds.forEach(id => {
    const el = document.getElementById(`fopt-${id}`);
    if (el) {
      el.classList.remove('active');
      if (state.profile.avatarFrame === id) {
        el.classList.add('active');
      }
      
      const isUnlocked = unlocked.includes(id) || id === 'none' || id === 'classic';
      const label = el.querySelector('span');
      if (label) {
        const baseName = id === 'none' ? 'Trống' :
                         id === 'classic' ? 'Classic' :
                         id === 'royal' ? 'Royal' :
                         id === 'sparkle' ? 'Sparkle' :
                         id === 'flower' ? 'Anh Đào' : 'Tinh Hà';
        label.textContent = isUnlocked ? baseName : `${baseName} 🔒`;
      }
    }
  });
}

export function selectFrameOption(id) {
  const unlocked = state.unlockedFrames || ['none', 'classic'];
  if (!unlocked.includes(id) && id !== 'none' && id !== 'classic') {
    showToast('🔒 Khung này đang bị khóa! Hãy ghé Tiệm tạp hóa Mochi đổi hạt sương để mở khóa nhé 💧');
    return;
  }
  
  state.profile.avatarFrame = id;
  updateProfileUI();
  updateSettingsUI();
}


export function toggleWallpaper() {
  const isEnabled = document.getElementById('wallpaperToggle')?.checked;
  state.settings.wallpaperEnabled = isEnabled;
  showToast(isEnabled ? '✨ Đã bật hình nền theo ảnh' : '🌑 Đã tắt hình nền theo ảnh');
}

export function showLanguageModal() {
  showToast('🌐 Tính năng đa ngôn ngữ đang được cập nhật...');
}

export function showMoodSetModal() {
  showToast('😊 Bộ cảm xúc mới sẽ sớm xuất hiện!');
}

export function updateBadges() {
  const streak = calcStreak(state.entries);
  const uniqueMoods = new Set(state.entries.map(e => e.mood)).size;
  const hasPhoto = state.entries.some(e => e.imgs && e.imgs.length > 0);
  const isConnected = !!state.partnerProfile;

  const check = (id, condition) => {
    const el = document.getElementById(id);
    if (el) {
      if (condition) {
        el.classList.remove('locked');
        el.classList.add('earned');
      } else {
        el.classList.add('locked');
        el.classList.remove('earned');
      }
    }
  };

  check('badge-newbie', state.entries.length >= 1);
  check('badge-streak7', streak >= 7);
  check('badge-moods', uniqueMoods >= 5);
  check('badge-photo', hasPhoto);
  check('badge-partner', isConnected);
  check('badge-master', streak >= 30);
}

export function openAvatarEdit() {
  const modal = document.getElementById('avatarEditModal');
  if (!modal) return;
  modal.classList.add('open');

  const nameInput = document.getElementById('editNameInput');
  const bioInput = document.getElementById('editBioInput');
  if (nameInput) nameInput.value = state.profile.name;
  if (bioInput) bioInput.value = state.profile.bio;

  const preview = document.getElementById('previewFrame');
  if (preview) {
    preview.className = 'premium-frame ' + (state.profile.avatarFrame || 'none');
  }

  const big = document.getElementById('avatarPreviewBig');
  if (big) {
    if (state.profile.avatarImg) {
      big.style.fontSize = 'inherit';
      big.innerHTML = `<img src="${state.profile.avatarImg}" alt="avatar">`;
    } else {
      big.style.fontSize = '48px';
      big.textContent = state.profile.avatarEmoji;
    }
  }

  const grid = document.getElementById('avatarEmojiGrid');
  if (grid) {
    grid.innerHTML = AVATAR_EMOJIS.map(e =>
      `<button onclick="window.selectAvatarEmoji('${e}')" class="${e===state.profile.avatarEmoji?'active':''}" title="${e}">${e}</button>`
    ).join('');
  }

  document.querySelectorAll('.frame-opt').forEach(opt => {
    const frame = opt.getAttribute('onclick').match(/'([^']+)'/)[1];
    if (frame === (state.profile.avatarFrame || 'none')) {
      opt.classList.add('active');
    } else {
      opt.classList.remove('active');
    }
  });
}

export function selectAvatarEmoji(emoji) {
  state.profile.avatarImg = null;
  state.profile.avatarEmoji = emoji;
  const big = document.getElementById('avatarPreviewBig');
  if (big) {
    big.textContent = emoji;
    big.style.fontSize = '48px';
  }
  document.querySelectorAll('#avatarEmojiGrid button').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.trim() === emoji);
  });
}

export async function handleAvatarImgUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  showToast('⏳ Đang tải ảnh lên...');
  const publicUrl = await uploadFileToStorage(file, 'avatars');

  if (publicUrl) {
    state.profile.avatarImg = publicUrl;
    const big = document.getElementById('avatarPreviewBig');
    if (big) {
      big.style.fontSize = 'inherit';
      big.innerHTML = `<img src="${publicUrl}" alt="avatar">`;
    }
    showToast('📸 Đã tải ảnh lên!');
  } else {
    showToast('❌ Lỗi khi tải ảnh!');
  }
  event.target.value = '';
}

export async function saveAvatarEdit() {
  const name = document.getElementById('editNameInput')?.value.trim();
  const bio  = document.getElementById('editBioInput')?.value.trim();
  if (name) state.profile.name = name;
  if (bio)  state.profile.bio = bio;
  await saveProfile();
  updateProfileUI();
  document.getElementById('avatarEditModal')?.classList.remove('open');
  showToast('✨ Hồ sơ đã được cập nhật!');
}

export function closeAvatarEdit(event) {
  const modal = document.getElementById('avatarEditModal');
  if (!event || event.target === modal) {
    modal?.classList.remove('open');
  }
}



export function showSecurityModal() { 
  document.getElementById('securityModal')?.classList.add('open'); 
}

export function selectSecurityOption(option) {
  if (option === 'none') {
    state.settings.securityEnabled = false;
    state.settings.securityType = 'none';
    state.settings.securityPin = '';
    updateSettingsUI();
    document.getElementById('securityModal')?.classList.remove('open');
    showToast('🔒 Đã tắt bảo mật ứng dụng.');
  } else {
    openPinSetup(option);
    document.getElementById('securityModal')?.classList.remove('open');
  }
}
export function showNotifModal() { 
  const modal = document.getElementById('notifModal');
  if (modal) {
    modal.classList.add('open');
    const input = document.getElementById('reminderTime');
    if (input) input.value = state.settings.reminderTime;
  }
}

export function saveReminder() {
  const time = document.getElementById('reminderTime')?.value;
  if (time) {
    state.settings.reminderTime = time;
    updateSettingsUI();
    showToast(`🔔 Đã đặt nhắc nhở lúc ${time}`);
    if (Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }
  document.getElementById('notifModal')?.classList.remove('open');
}
