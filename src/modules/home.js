import { MOODS } from '../config.js';
import { state } from '../state.js';
import { getTodayStr, formatDate, applyWallpaperEffect, getEventsForDate, calcStreak } from '../utils.js';

export function renderTimeline() {
  const todayStr = getTodayStr();
  let todayEntries = state.entries.filter(e => e.date === todayStr).sort((a,b) => a.time.localeCompare(b.time));
  
  if (!todayEntries.length) {
    const mostRecent = state.entries.reduce((acc, e) => (!acc || e.date > acc) ? e.date : acc, null);
    todayEntries = state.entries.filter(e => e.date === mostRecent).sort((a,b) => a.time.localeCompare(b.time));
  }

  if (state.settings.wallpaperEnabled) {
    const entryWithImg = [...todayEntries].reverse().find(e => e.imgs && e.imgs.length > 0);
    if (entryWithImg) {
      applyWallpaperEffect(entryWithImg.imgs[0]);
    } else {
      applyWallpaperEffect(null);
    }
  } else {
    applyWallpaperEffect(null);
  }

  const container = document.getElementById('timelineContainer');
  if (!container) return;
  container.innerHTML = '';
  
  if (!todayEntries.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:#b0bec5">
        <div style="font-size:48px;margin-bottom:12px">🌸</div>
        <p style="font-size:14px;font-weight:600;color:#718096">Hôm nay chưa có nhật ký nào</p>
        <p style="font-size:12px;color:#a0aec0;margin-top:4px">Bấm nút ➕ ở dưới để bắt đầu nhé!</p>
      </div>`;
    return;
  }

  todayEntries.forEach((entry, i) => {
    const m = MOODS[entry.mood] || MOODS.peaceful;
    const isLast = i === todayEntries.length - 1;
    const imgs = entry.imgs || [];
    
    container.innerHTML += `
      <div class="timeline-item" onclick="window.openDayDetail('${entry.date}')">
        <div class="timeline-left">
          <span class="tl-time">${entry.time}</span>
          <div class="tl-emoji-marker">${m.emoji}</div>
          ${!isLast ? '<div class="tl-line"></div>' : ''}
        </div>
        <div class="timeline-card-v2">
          <div class="tl-card-main">
            <div class="tl-content-box">
              <div class="tl-text-v2">${entry.text || '...'}</div>
              ${imgs.length > 0 ? `
                <div class="tl-image-container-v2">
                  ${imgs.map(src => `<img src="${src}" onclick="event.stopPropagation(); window.openLightbox('${src}')" />`).join('')}
                </div>
              ` : ''}
              <div class="tl-card-footer">
                <button class="tl-action-btn" onclick="event.stopPropagation(); window.editEntry('${entry.id}')" title="Chỉnh sửa">✏️</button>
                <button class="tl-action-btn delete" onclick="event.stopPropagation(); window.deleteEntry('${entry.id}')" title="Xóa">🗑️</button>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  });
}

export function renderHighlights() {
  const container = document.getElementById('homeHighlights');
  if (!container) return;
  
  const todayStr = getTodayStr();
  const todaysEvents = getEventsForDate(state.customEvents, todayStr);

  if (todaysEvents.length === 0) {
    container.innerHTML = '';
    return;
  }

  let html = '';
  todaysEvents.forEach(ev => {
    html += `
      <div class="highlight-card" style="margin-bottom:12px;display:flex;align-items:center;background:white;padding:14px 18px;border-radius:20px;box-shadow:0 6px 12px rgba(181,131,245,0.08);border:1px solid rgba(181,131,245,0.1)">
        <span class="highlight-icon" style="font-size:24px;margin-right:14px;background:#f7f0ff;padding:12px;border-radius:16px">${ev.icon}</span>
        <div>
          <div class="highlight-title" style="font-size:15px;font-weight:800;color:#2d3748;margin-bottom:2px">${ev.title}</div>
          <div class="highlight-sub" style="font-size:12px;color:#718096">Sự kiện diễn ra vào hôm nay!</div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

export function renderStreak() {
  const streak = calcStreak(state.entries);
  const el = document.getElementById('streakBadge');
  if (!el) return;
  if (streak > 0) {
    el.style.display = 'flex';
    el.innerHTML = `🔥 ${streak} ngày liên tiếp`;
  } else {
    el.style.display = 'none';
  }
}
