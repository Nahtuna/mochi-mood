import { MOODS } from '../config.js';
import { state } from '../state.js';
import { getTodayStr, formatDate, showToast, applyWallpaperEffect, getEventsForDate } from '../utils.js';
import { saveCustomEventToDB, deleteCustomEventFromDB } from '../api.js';

export function changeMonth(dir) {
  let newMonth = state.calMonth + dir;
  let newYear = state.calYear;
  if (newMonth < 0) { newMonth = 11; newYear--; }
  if (newMonth > 11) { newMonth = 0; newYear++; }
  state.calYear = newYear;
  state.calMonth = newMonth;
  renderCalendar();
}

export function renderCalendar() {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthEl = document.getElementById('calMonth');
  if (monthEl) monthEl.textContent = `${monthNames[state.calMonth]}, ${state.calYear}`;
  
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;
  
  const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  let html = days.map(d => `<div class="cal-header">${d}</div>`).join('');
  const firstDay = new Date(state.calYear, state.calMonth, 1).getDay();
  const daysInMonth = new Date(state.calYear, state.calMonth+1, 0).getDate();
  const todayStr = getTodayStr();

  for (let i = 0; i < firstDay; i++) html += '<div class="cal-day"></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${state.calYear}-${String(state.calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayEntries = state.entries.filter(e => e.date === dateStr);
    
    // Check custom events
    const hasEvent = getEventsForDate(state.customEvents, dateStr).length > 0;

    let moodEmoji = '';
    let moodStyle = '';
    if (dayEntries.length) {
      const counts = {};
      dayEntries.forEach(e => counts[e.mood] = (counts[e.mood]||0)+1);
      const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
      moodEmoji = MOODS[top].emoji;
      const moodColor = MOODS[top].color;
      // High-performance premium pastel glow style
      moodStyle = `background: ${moodColor}40; box-shadow: 0 4px 10px ${moodColor}33; border: 1.5px solid ${moodColor}66;`;
    }
    
    const isToday = dateStr === todayStr;
    
    html += `<div class="cal-day${moodEmoji?' has-mood':''}${isToday?' today':''}" onclick="window.openDayDetail('${dateStr}')" title="${dateStr}" style="cursor:pointer;position:relative;${moodStyle}">
      ${moodEmoji ? `<span class="day-emoji">${moodEmoji}</span><span class="day-num">${d}</span>` : `<span class="day-num" style="font-size:11px;color:#718096">${d}</span>`}
      ${hasEvent ? `<div style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:#b583f5"></div>` : ''}
    </div>`;
  }
  grid.innerHTML = html;
}

export function drawMoodJar() {
  // Mood Jar feature removed for clean, premium UI and optimized performance
}

let pieAnimReq = null;
let pieData = [];
let hoveredSlice = null;

export function drawPieChart() {
  const canvas = document.getElementById('moodPieChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  if (pieAnimReq) cancelAnimationFrame(pieAnimReq);
  
  const monthEntries = state.entries.filter(e => {
    const [y,m] = e.date.split('-');
    return parseInt(y)===state.calYear && parseInt(m)-1===state.calMonth;
  });
  
  if (!monthEntries.length) {
    ctx.clearRect(0,0,W,H);
    return;
  }

  const counts = {};
  monthEntries.forEach(e => counts[e.mood] = (counts[e.mood]||0)+1);
  const total = monthEntries.length;
  pieData = Object.entries(counts).map(([key,count]) => ({
    key, count, pct: count/total, color: MOODS[key].color, label: MOODS[key].label, emoji: MOODS[key].emoji
  })).sort((a,b)=>b.count-a.count);

  const cx = W/2, cy = H/2, r = Math.min(W,H)/2 - 15;
  
  // Interaction setup (Mouse + Touch)
  if (!canvas.dataset.listener) {
    const startHandler = (e) => { handlePieHover(e); };
    const moveHandler = (e) => { e.preventDefault(); handlePieHover(e); };
    const endHandler = () => { hoveredSlice = null; drawSlices(ctx, cx, cy, r, 1); hidePieTooltip(); };

    canvas.addEventListener('mousemove', handlePieHover);
    canvas.addEventListener('mouseleave', endHandler);
    
    // Support for touch devices
    canvas.addEventListener('touchstart', startHandler, { passive: false });
    canvas.addEventListener('touchmove', moveHandler, { passive: false });
    canvas.addEventListener('touchend', endHandler);
    
    canvas.dataset.listener = "true";
  }

  let progress = 0; const duration = 1000; const startTime = performance.now();
  function animate(time) {
    const elapsed = time - startTime;
    progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 4);
    drawSlices(ctx, cx, cy, r, easeProgress);
    if (progress < 1) pieAnimReq = requestAnimationFrame(animate);
  }
  pieAnimReq = requestAnimationFrame(animate);
}

function drawSlices(ctx, cx, cy, r, progress) {
  ctx.clearRect(0, 0, cx*2, cy*2);
  let startAngle = -Math.PI/2;
  
  pieData.forEach((item, idx) => {
    const sliceAngle = item.pct * 2 * Math.PI * progress;
    const isHovered = hoveredSlice === idx;
    const offset = isHovered ? 10 : 0; // Pop out effect
    
    const midAngle = startAngle + sliceAngle / 2;
    const ox = Math.cos(midAngle) * offset;
    const oy = Math.sin(midAngle) * offset;

    ctx.save();
    ctx.translate(ox, oy);
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    
    ctx.fillStyle = item.color;
    ctx.fill();
    ctx.strokeStyle = 'white'; ctx.lineWidth = 4; ctx.stroke();
    ctx.restore();
    
    startAngle += item.pct * 2 * Math.PI;
  });
}

function handlePieHover(e) {
  const canvas = e.target;
  const rect = canvas.getBoundingClientRect();
  
  // Handle both Mouse and Touch coordinates
  let clientX, clientY;
  if (e.touches && e.touches[0]) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = e.clientX;
    clientY = e.clientY;
  }

  const x = (clientX - rect.left) * (canvas.width / rect.width) - canvas.width/2;
  const y = (clientY - rect.top) * (canvas.height / rect.height) - canvas.height/2;
  const r = Math.sqrt(x*x + y*y);
  const maxR = canvas.width/2 - 15;
  
  if (r > maxR) { 
    if (hoveredSlice !== null) {
      hoveredSlice = null; 
      drawSlices(canvas.getContext('2d'), canvas.width/2, canvas.height/2, maxR, 1);
      hidePieTooltip();
    }
    return; 
  }

  let angle = Math.atan2(y, x);
  if (angle < -Math.PI/2) angle += 2 * Math.PI; // Normalize
  
  let currentAngle = -Math.PI/2;
  let found = null;
  pieData.forEach((item, idx) => {
    const nextAngle = currentAngle + item.pct * 2 * Math.PI;
    if (angle >= currentAngle && angle < nextAngle) found = idx;
    currentAngle = nextAngle;
  });

  if (found !== hoveredSlice) {
    hoveredSlice = found;
    drawSlices(canvas.getContext('2d'), canvas.width/2, canvas.height/2, maxR, 1);
    if (found !== null) showPieTooltip(clientX, clientY, pieData[found]);
    else hidePieTooltip();
  }
}

function showPieTooltip(clientX, clientY, data) {
  const tooltip = document.getElementById('pieTooltip');
  if (!tooltip) return;
  tooltip.style.display = 'block';
  tooltip.innerHTML = `<span style="font-size:22px">${data.emoji}</span> <div style="margin-top:4px"><b>${data.label}</b></div><div style="font-size:16px;font-weight:900;color:#b583f5">${Math.round(data.pct*100)}%</div>`;
  
  // Position tooltip relative to event
  const offset = 15;
  tooltip.style.left = (clientX + offset) + 'px';
  tooltip.style.top = (clientY + offset) + 'px';
}

function hidePieTooltip() {
  const tooltip = document.getElementById('pieTooltip');
  if (tooltip) tooltip.style.display = 'none';
}

export function statsScrollTo(targetId) {
  const screen = document.getElementById('screen-stats');
  const target = document.getElementById(targetId);
  if (!screen || !target) return;

  const btnMap = { statsCalCard: 'statsBtnCal', statsPieCard: 'statsBtnMood' };
  if (window.setStatsIconActive) {
    window.setStatsIconActive(btnMap[targetId]);
    setTimeout(() => {
      const btn = document.getElementById(btnMap[targetId]);
      if (btn) btn.classList.remove('active');
    }, 800);
  }

  target.style.transition = 'box-shadow 0.3s';
  target.style.boxShadow = '0 0 0 3px #b583f5, 0 4px 20px rgba(181,131,245,0.4)';
  setTimeout(() => { target.style.boxShadow = ''; }, 1200);

  const targetTop = target.offsetTop - screen.offsetTop;
  screen.scrollTo({ top: targetTop - 12, behavior: 'smooth' });
}

export function openDayDetail(date) {
  state.detailDate = date;
  renderDayDetail();
  document.getElementById('dayDetailModal')?.classList.add('open');
}

export function closeDayDetail(event) {
  if (!event || event.target === document.getElementById('dayDetailModal'))
    document.getElementById('dayDetailModal')?.classList.remove('open');
}

export function prevDay() {
  const d = new Date(state.detailDate); d.setDate(d.getDate()-1);
  state.detailDate = d.toISOString().slice(0,10); renderDayDetail();
}

export function nextDay() {
  const d = new Date(state.detailDate); d.setDate(d.getDate()+1);
  state.detailDate = d.toISOString().slice(0,10); renderDayDetail();
}

export function renderDayDetail() {
  const d = new Date(state.detailDate + 'T00:00:00');
  const dows = ['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy'];
  const detailDateEl = document.getElementById('detailDate');
  if (detailDateEl) detailDateEl.textContent = formatDate(state.detailDate);
  const detailDowEl = document.getElementById('detailDow');
  if (detailDowEl) detailDowEl.textContent = dows[d.getDay()];

  const dayEntries = state.entries.filter(e => e.date === state.detailDate).sort((a,b) => b.time.localeCompare(a.time));
  
  // Wallpaper Effect
  if (state.settings.wallpaperEnabled) {
    const entryWithImg = dayEntries.find(e => e.imgs && e.imgs.length > 0);
    if (entryWithImg) {
      applyWallpaperEffect(entryWithImg.imgs[0]);
    } else {
      applyWallpaperEffect(null);
    }
  }

  const moodCounts = {};
  dayEntries.forEach(e => { moodCounts[e.mood] = (moodCounts[e.mood]||0)+1; });
  const mainMoodKey = Object.entries(moodCounts).sort((a,b)=>b[1]-a[1])[0]?.[0];

  let html = '';
  
  // New: Mood Clock (24h axis)
  if (dayEntries.length > 0) {
    html += `<div class="day-clock-wrapper">
      <div class="clock-label">Nhịp điệu tâm trạng (24h)</div>
      <div class="clock-axis">
        ${[0, 6, 12, 18, 23].map(h => `<span class="clock-hour-mark">${h}h</span>`).join('')}
        <div class="clock-line"></div>
        ${dayEntries.map(e => {
          const [h, m] = e.time.split(':').map(Number);
          const percent = ((h * 60 + m) / (24 * 60)) * 100;
          return `<div class="clock-mood-dot" style="left:${percent}%; background:${MOODS[e.mood].color}; shadow:0 0 8px ${MOODS[e.mood].color}88" title="${e.time}">
            <span class="clock-dot-emoji">${MOODS[e.mood].emoji}</span>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  if (mainMoodKey) html += `<div class="detail-mood-badge" style="background:${MOODS[mainMoodKey].color}15; color:${MOODS[mainMoodKey].color}">Tâm trạng chủ đạo: ${MOODS[mainMoodKey].emoji} ${MOODS[mainMoodKey].label}</div>`;

  // Custom Events
  const dayEvents = getEventsForDate(state.customEvents, state.detailDate);

  if (dayEvents.length > 0) {
    html += `<div class="detail-stat-title">🗓️ Sự kiện trong ngày</div>`;
    dayEvents.forEach(ev => {
      let repeatLabel = ev.repeat_type === 'none' ? 'Một lần' : (ev.repeat_type === 'monthly' ? 'Hàng tháng' : 'Hàng năm');
      html += `<div class="timeline-item" style="margin-bottom:8px">
        <div class="timeline-left">
          <span class="tl-time" style="color:#b583f5;font-weight:800">${ev.icon}</span>
          <div class="tl-emoji-marker" style="border-color:#b583f5">${ev.icon}</div>
        </div>
        <div class="timeline-card" style="margin-bottom:8px;flex-direction:row;align-items:center;justify-content:space-between">
          <div>
            <div style="font-weight:700;color:#2d3748;font-size:14px">${ev.title}</div>
            <div style="font-size:11px;color:#a0aec0;margin-top:2px">Lặp lại: ${repeatLabel}</div>
            <button class="tl-action-btn delete" onclick="window.deleteCustomEvent('${ev.id}')" style="margin-top:4px;">🗑️</button>
          </div>
        </div></div>`;
    });
  }

  if (dayEntries.length) {
    html += `<div class="detail-stat-title">📖 Nhật ký trong ngày</div>`;
    dayEntries.forEach(e => {
      const m = MOODS[e.mood] || MOODS.peaceful;
      const imgs = e.imgs || [];
      html += `<div class="timeline-item" style="margin-bottom:4px">
        <div class="timeline-left">
          <span class="tl-time">${e.time}</span>
          <div class="tl-emoji-marker">${m.emoji}</div>
        </div>
        <div class="timeline-card-v2" style="margin-bottom:8px;">
          <div class="tl-card-main">
            <div class="tl-content-box">
              <div class="tl-text-v2">${e.text}</div>
              ${imgs.length > 0 ? `
                <div class="tl-image-container-v2">
                  ${imgs.map(src => `<img src="${src}" onclick="window.openLightbox('${src}')" />`).join('')}
                </div>` : ''}
              <div class="tl-card-footer">
                <button class="tl-action-btn" onclick="window.editEntry('${e.id}'); window.closeDayDetail();" title="Chỉnh sửa">✏️</button>
                <button class="tl-action-btn delete" onclick="window.deleteEntry('${e.id}')" title="Xóa">🗑️</button>
              </div>
            </div>
          </div>
        </div></div>`;
    });
  } else {
    html += `<div style="text-align:center;padding:30px;color:#718096;font-size:14px">😴 Chưa có nhật ký ngày này</div>`;
  }

  // Mini pie
  if (dayEntries.length > 0) {
    html += `<div class="detail-stat-title" style="margin-top:12px">📊 Thống kê</div>`;
    const total = dayEntries.length;
    html += Object.entries(moodCounts).map(([key, count]) => {
      const m = MOODS[key]; const pct = Math.round(count/total*100);
      return `<div class="legend-item" style="margin-bottom:6px">
        <div class="legend-dot" style="background:${m.color}"></div>
        <span>${m.emoji} ${m.label}</span>
        <span style="margin-left:auto;font-weight:800;color:#5b9bd5">${pct}%</span>
      </div>`;
    }).join('');
  }

  const content = document.getElementById('dayDetailContent');
  if (content) content.innerHTML = html;
}

export function openAddEventModal() {
  document.getElementById('eventModal')?.classList.add('open');
}

export function selectEventIcon(icon, el) {
  document.querySelectorAll('.event-icon-opt').forEach(opt => opt.classList.remove('active'));
  if (el) el.classList.add('active');
  window._selectedEventIcon = icon;
}

export async function saveCustomEvent() {
  const title = document.getElementById('eventNameInput')?.value.trim();
  const icon = window._selectedEventIcon || '📌';
  const repeatType = document.getElementById('eventRepeatSelect')?.value || 'none';
  
  if (!title) return showToast('⚠️ Hãy nhập tên sự kế nhé!');
  
  const newEv = {
    user_id: state.userId,
    title,
    icon,
    repeat_type: repeatType,
    date: state.detailDate,
    day: String(new Date(state.detailDate + 'T00:00:00').getDate()),
    month: String(new Date(state.detailDate + 'T00:00:00').getMonth() + 1)
  };

  showToast('⏳ Đang lưu sự kiện...');
  const { data, error } = await saveCustomEventToDB(newEv);
  
  if (error) {
    showToast('❌ Lỗi lưu sự kiện: ' + error.message);
    return;
  }
  
  if (data && data.length > 0) {
    state.customEvents = [...state.customEvents, data[0]];
    renderCalendar();
    renderDayDetail();
    if (window.renderHighlights) window.renderHighlights();
    document.getElementById('addEventModal')?.classList.remove('open');
    showToast('✅ Đã thêm sự kiện!');
  }
}

export async function deleteCustomEvent(id) {
  if (!confirm('Bạn có chắc muốn xóa sự kiện này?')) return;
  const { error } = await deleteCustomEventFromDB(id);
  if (error) {
    showToast('❌ Lỗi khi xóa sự kiện: ' + error.message);
    return;
  }
  state.customEvents = state.customEvents.filter(ev => String(ev.id) !== String(id));
  renderCalendar();
  renderDayDetail();
  if (window.renderHighlights) window.renderHighlights();
  showToast('🗑️ Đã xóa sự kiện');
}
