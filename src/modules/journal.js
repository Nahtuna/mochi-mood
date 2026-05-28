import { MOODS } from '../config.js';
import { state } from '../state.js';
import { formatDate } from '../utils.js';

export let journalView = 'list';

export function setView(v) {
  journalView = v;
  const listBtn = document.getElementById('listViewBtn');
  const gridBtn = document.getElementById('gridViewBtn');
  if (listBtn) listBtn.classList.toggle('active', v === 'list');
  if (gridBtn) gridBtn.classList.toggle('active', v === 'grid');
  renderJournal();
}

export function filterByMood(mood, btn) {
  state.currentFilter = mood;
  document.querySelectorAll('.filter-chips .chip').forEach(c => c.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderJournal();
}

export function filterJournal() {
  renderJournal();
}

export function renderJournal() {
  const q = (document.getElementById('journalSearch')?.value || '').toLowerCase();
  const grouped = {};
  
  state.entries.filter(e => {
    if (state.currentFilter !== 'all' && e.mood !== state.currentFilter) return false;
    if (q && !e.text.toLowerCase().includes(q)) return false;
    return true;
  }).forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  const list = document.getElementById('journalList');
  if (!list) return;
  list.className = `journal-list${journalView === 'grid' ? ' grid' : ''}`;
  const dates = Object.keys(grouped).sort((a,b) => b.localeCompare(a));
  
  if (!dates.length) {
    list.innerHTML = `<div style="text-align:center;padding:50px 20px;color:#718096">
      <div style="font-size:52px;margin-bottom:12px">📝</div>
      <p style="font-weight:600">Chưa có nhật ký nào</p>
      <p style="font-size:12px;color:#a0aec0;margin-top:6px">Viết nhật ký đầu tiên của bạn nhé 🌸</p>
    </div>`;
    return;
  }

  list.innerHTML = dates.map(date => {
    const dayEntries = grouped[date];
    const mainMood = MOODS[dayEntries[0].mood] || MOODS.peaceful;
    const preview = dayEntries.map(e => e.text).join(' · ').slice(0, 80);
    const acts = [...new Set(dayEntries.flatMap(e => e.activities))].slice(0, 3);
    return `
      <div class="journal-day-card" onclick="window.openDayDetail('${date}')">
        <div class="jdc-header">
          <span class="jdc-date">${formatDate(date)}</span>
          <span class="jdc-mood">${mainMood.emoji}</span>
        </div>
        <p class="jdc-preview">${preview}...</p>
        <div class="jdc-tags">${acts.map(a => `<span class="jdc-tag">${a}</span>`).join('')}</div>
      </div>`;
  }).join('');
}
