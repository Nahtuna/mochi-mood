// ============ UTILS & HELPERS ============

export const logger = {
  info: (msg, data) => console.log(`%c[Mochi Info] ${msg}`, 'color: #b583f5; font-weight: bold', data || ''),
  warn: (msg, data) => console.warn(`[Mochi Warn] ${msg}`, data || ''),
  error: (msg, err) => {
    console.error(`%c[Mochi Error] ${msg}`, 'color: #ff4d4f; font-weight: bold', err);
    showToast(`❌ ${msg}: ${err?.message || 'Lỗi không xác định'}`);
  }
};

export function dataURLtoBlob(dataurl) {
  var arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
  while(n--){ u8arr[n] = bstr.charCodeAt(n); }
  return new Blob([u8arr], {type:mime});
}

export function getTodayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
}

export function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} Tháng ${parseInt(m)}, ${y}`;
}

export function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg; 
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

export function launchConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = 375; canvas.height = 812;
  const particles = Array.from({length:60}, () => ({
    x: Math.random()*375, y: -10,
    vx: (Math.random()-0.5)*4, vy: Math.random()*4+2,
    color: ['#ffb3cc','#a8d8ff','#ffeaa7','#b2f0d0','#dda8f5'][Math.floor(Math.random()*5)],
    size: Math.random()*6+4, angle: Math.random()*360, spin: (Math.random()-0.5)*6
  }));
  function tick() {
    ctx.clearRect(0,0,375,812);
    particles.forEach(p => {
      p.x+=p.vx; p.y+=p.vy; p.angle+=p.spin;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.angle*Math.PI/180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
      ctx.restore();
    });
    if (particles.some(p=>p.y<812)) requestAnimationFrame(tick);
    else ctx.clearRect(0,0,375,812);
  }
  tick();
}

export function applyWallpaperEffect(imageUrl) {
  if (!imageUrl) {
    document.body.style.removeProperty('--wallpaper-color');
    return;
  }
  const img = new Image();
  img.crossOrigin = 'Anonymous';
  img.src = imageUrl;
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 10; canvas.height = 10;
    ctx.drawImage(img, 0, 0, 10, 10);
    const data = ctx.getImageData(0, 0, 10, 10).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < data.length; i += 4) {
      r += data[i]; g += data[i+1]; b += data[i+2];
    }
    r = Math.floor(r / (data.length / 4));
    g = Math.floor(g / (data.length / 4));
    b = Math.floor(b / (data.length / 4));
    document.body.style.setProperty('--wallpaper-color', `rgba(${r},${g},${b}, 0.12)`);
  };
  img.onerror = () => {
    document.body.style.removeProperty('--wallpaper-color');
  };
}

export function formatTime(isoString) {
  if (!isoString) return '';
  try {
    return new Date(isoString).toLocaleTimeString('vi-VN', {
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return ''; }
}

export function calcStreak(entries) {
  if (!entries.length) return 0;
  const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
  const today = getTodayStr();
  
  let streak = 0;
  let checkDate = today;
  
  // If no entry today, start checking from yesterday
  if (dates[0] !== today) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    checkDate = d.toISOString().slice(0, 10);
  }

  for (const date of dates) {
    if (date === checkDate) {
      streak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().slice(0, 10);
    } else if (date < checkDate) {
      break;
    }
  }
  return streak;
}

export function getEventsForDate(customEvents, dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const day = String(d.getDate());
  const mon = String(d.getMonth() + 1);
  return customEvents.filter(ev => {
    if (ev.repeat_type === 'none') return ev.date === dateStr;
    if (ev.repeat_type === 'monthly') return ev.day === day;
    if (ev.repeat_type === 'yearly') return ev.day === day && ev.month === mon;
    return false;
  });
}

/**
 * Tối ưu hóa URL ảnh của Supabase (yêu cầu Pro plan cho resize thực sự,
 * nhưng helper này vẫn hữu ích để chuẩn hóa URL)
 */
export function optimizeImageUrl(url, options = { width: 300, quality: 70 }) {
  if (!url || !url.includes('supabase.co')) return url;
  try {
    const u = new URL(url);
    if (options.width) u.searchParams.set('width', options.width);
    if (options.quality) u.searchParams.set('quality', options.quality);
    if (options.resize) u.searchParams.set('resize', options.resize);
    return u.toString();
  } catch (e) { return url; }
}

export function initGreeting() {
  const h = new Date().getHours();
  let g = h < 12 ? 'Chào buổi sáng! 🌸' : h < 18 ? 'Chào buổi chiều! ☀️' : 'Chào buổi tối! 🌙';
  const el = document.getElementById('greetingText');
  if (el) el.textContent = g;
}

export function initDate() {
  const d = new Date();
  const months = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const curDateEl = document.getElementById('currentDate');
  if (curDateEl) curDateEl.textContent = `${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
  
  const writeTimeEl = document.getElementById('writeTime');
  if (writeTimeEl) {
    writeTimeEl.textContent = `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
}
