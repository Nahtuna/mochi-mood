import { MOODS, DEFAULT_ACTIVITIES } from '../config.js';
import { state } from '../state.js';
import { showToast, initDate, launchConfetti, dataURLtoBlob, getTodayStr, formatDate } from '../utils.js';
import { saveEntryToDB, uploadFileToStorage, deleteEntryFromDB, updateEntryInDB, supabaseClient } from '../api.js';

export function showMoodPicker() {
  renderMoods();
  document.getElementById('moodPickerModal')?.classList.add('open');
}

export function renderMoods() {
  const grid = document.getElementById('moodPickerGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  Object.entries(MOODS).forEach(([key, m]) => {
    grid.innerHTML += `
      <div class="emoji-item" onclick="window.selectMood('${key}')">
        <div class="emoji-face" style="background: linear-gradient(135deg, ${m.color}cc, ${m.color})">${m.emoji}</div>
        <span>${m.label}</span>
      </div>`;
  });
}

export function closeMoodPicker(event) {
  const modal = document.getElementById('moodPickerModal');
  if (!event || event.target === modal) modal?.classList.remove('open');
}

export function selectMood(moodKey) {
  state.selectedMood = moodKey;
  document.getElementById('moodPickerModal')?.classList.remove('open');
  const m = MOODS[moodKey];
  const badge = document.getElementById('selectedMoodBadge');
  if (badge) {
    badge.textContent = `${m.emoji} ${m.label}`;
    badge.style.background = m.color + '99';
  }
  initDate();
  renderActivities();
  document.getElementById('writeModal')?.classList.add('open');
}

export function closeWriteModal(event) {
  const modal = document.getElementById('writeModal');
  if (!event || event.target === modal) {
    modal?.classList.remove('open');
    state.editingEntryId = null;
  }
}

export function editEntry(id) {
  const entry = state.entries.find(e => String(e.id) === String(id));
  if (!entry) return;

  state.editingEntryId = id;
  state.selectedMood = entry.mood;
  
  const m = MOODS[entry.mood];
  const badge = document.getElementById('selectedMoodBadge');
  if (badge) {
    badge.textContent = `${m.emoji} ${m.label}`;
    badge.style.background = m.color + '99';
  }

  const textarea = document.getElementById('writeTextarea');
  if (textarea) textarea.value = entry.text || '';

  renderActivities();
  setTimeout(() => {
    document.querySelectorAll('.act-chip').forEach(chip => {
      if (entry.activities?.includes(chip.textContent.trim())) {
        chip.classList.add('selected');
      }
    });
  }, 50);

  const imgList = document.getElementById('imgPreviewList');
  const previewArea = document.getElementById('imagePreviewArea');
  if (imgList) {
    imgList.innerHTML = (entry.imgs || []).map(src => `<img src="${src}" />`).join('');
    if (previewArea) previewArea.style.display = entry.imgs?.length ? 'block' : 'none';
  }

  document.getElementById('writeModal')?.classList.add('open');
}

export function toggleActivity(btn) { btn.classList.toggle('selected'); }

export function renderActivities() {
  const container = document.getElementById('activityChips');
  if (!container) return;
  container.innerHTML = '';
  const allActs = [...DEFAULT_ACTIVITIES, ...state.customActivities];
  allActs.forEach(act => {
    container.innerHTML += `<button class="act-chip" onclick="window.toggleActivity(this)">${act}</button>`;
  });
}

export function toggleCustomTagInput() {
  const row = document.getElementById('customTagInputRow');
  if (!row) return;
  row.style.display = row.style.display === 'none' ? 'flex' : 'none';
  if (row.style.display === 'flex') document.getElementById('customTagInput')?.focus();
}

export async function addCustomTag() {
  const input = document.getElementById('customTagInput');
  const val = input?.value.trim();
  if (!val) return;
  if (!state.customActivities.includes(val) && !DEFAULT_ACTIVITIES.includes(val)) {
    try {
      const newList = [...state.customActivities, val];
      await supabaseClient.from('users')
        .update({ custom_activities: newList })
        .eq('id', state.userId);
      state.customActivities = newList;
      renderActivities();
      showToast('🏷️ Đã thêm tag mới!');
    } catch (err) {
      showToast('❌ Lỗi lưu tag: ' + err.message);
    }
  }
  if (input) input.value = '';
  const row = document.getElementById('customTagInputRow');
  if (row) row.style.display = 'none';
}

export async function saveEntry() {
  const textarea = document.getElementById('writeTextarea');
  const text = textarea?.value.trim();
  if (!text) { showToast('⚠️ Hãy viết gì đó nhé!'); return; }
  const acts = [...document.querySelectorAll('.act-chip.selected')].map(c => c.textContent.trim());

  const imgList = document.getElementById('imgPreviewList');
  const allImgSrcs = [...(imgList?.querySelectorAll('img') || [])].map(img => img.src).filter(s => s);
  const existingUrls = allImgSrcs.filter(s => !s.startsWith('data:'));
  const base64Imgs = allImgSrcs.filter(s => s.startsWith('data:'));

  showToast('⏳ Đang lưu nhật ký...');
  
  const imageUrls = [...existingUrls];
  for (const b64 of base64Imgs) {
    const blob = dataURLtoBlob(b64);
    const url = await uploadFileToStorage(blob, 'mood-images');
    if (url) imageUrls.push(url);
  }

  const now = new Date();
  const today = getTodayStr();
  const shared = document.getElementById('shareWithPartner')?.checked !== false;
  
  const newEntry = {
    user_id: state.userId,
    date: today,
    time: `${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`,
    mood: state.selectedMood || 'peaceful',
    text: text,
    imgs: imageUrls,
    activities: acts,
    shared
  };

  let result;
  if (state.editingEntryId) {
    result = await updateEntryInDB(state.editingEntryId, newEntry);
  } else {
    result = await saveEntryToDB(newEntry);
  }
  
  const { data, error } = result;
  
  if (error) {
    console.error('Database Error:', error);
    showToast('❌ Lỗi lưu dữ liệu: ' + (error.message || 'Lỗi 400'));
    return;
  }

  if (data && data.length > 0) {
    if (state.editingEntryId) {
      const idx = state.entries.findIndex(e => String(e.id) === String(state.editingEntryId));
      if (idx !== -1) state.entries[idx] = data[0];
    } else {
      state.entries.unshift(data[0]);
    }
  }
  
  // Reset UI
  document.getElementById('writeModal')?.classList.remove('open');
  state.editingEntryId = null;
  if (textarea) textarea.value = '';
  document.querySelectorAll('.act-chip').forEach(c => c.classList.remove('selected'));
  const previewArea = document.getElementById('imagePreviewArea');
  if (previewArea) previewArea.style.display = 'none';
  if (imgList) imgList.innerHTML = '';
  
  if (window.renderTimeline) window.renderTimeline();
  if (window.renderJournal) window.renderJournal();
  if (window.renderStreak) window.renderStreak();
  
  showToast(imageUrls.length ? `✨ Đã lưu với ${imageUrls.length} ảnh!` : '✨ Đã lưu nhật ký!');
  if (Math.random() > 0.5) launchConfetti();
}

export async function deleteEntry(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa nhật ký này?')) return;
  
  const { error } = await deleteEntryFromDB(id);
  if (error) {
    showToast('❌ Lỗi khi xóa: ' + error.message);
    return;
  }

  state.entries = state.entries.filter(e => String(e.id) !== String(id));
  if (window.renderTimeline) window.renderTimeline();
  if (window.renderJournal) window.renderJournal();
  if (window.renderStreak) window.renderStreak();
  if (window.renderDayDetail) window.renderDayDetail();
  
  showToast('🗑️ Đã xóa nhật ký');
}
