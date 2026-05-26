// ============ MOCHI SHOP MODULE ============

import { state } from '../state.js';
import { showToast } from '../utils.js';

let activeShopTab = 'frames';

const FRAME_ITEMS = [
  { id: 'classic', name: 'Khung Classic', price: 0, desc: 'Khung cầu vồng nguyên bản xinh xắn', class: 'classic' },
  { id: 'royal', name: 'Khung Hoàng Gia 👑', price: 15, desc: 'Khung hoàng gia lấp lánh ánh kim', class: 'royal' },
  { id: 'sparkle', name: 'Khung Sparkle ✨', price: 30, desc: 'Khung kẹo ngọt lung linh hồng đào', class: 'sparkle' },
  { id: 'flower', name: 'Khung Anh Đào 🌸', price: 45, desc: 'Khung hoa anh đào nở rộ tinh tế', class: 'flower' },
  { id: 'galaxy', name: 'Khung Tinh Hà 🌌', price: 60, desc: 'Khung vũ trụ huyền bí xanh thẳm', class: 'galaxy' }
];

const WALLPAPER_ITEMS = [
  { id: 'lavender', name: 'Tím Oải Hương 💜', price: 10, desc: 'Giao diện màu tím pastel thư thái', bg: '#f3ebff', accent: '#9f7aea' },
  { id: 'peach', name: 'Cam Đào Ấm Áp 🍑', price: 10, desc: 'Giao diện màu cam sữa ngọt ngào', bg: '#fff5f5', accent: '#f6ad55' },
  { id: 'ocean', name: 'Đại Dương Bình Yên 🌊', price: 15, desc: 'Giao diện xanh mát tựa biển khơi', bg: '#ebf8ff', accent: '#4299e1' }
];

export function initShop() {
  updateDewsHeader();
  applySavedTheme();
}

export function updateDewsHeader() {
  const meBadge = document.getElementById('meDewsCount');
  const shopBadge = document.getElementById('shopDewsCount');
  if (meBadge) meBadge.textContent = state.dews;
  if (shopBadge) shopBadge.textContent = state.dews;
}

export function openMochiShop() {
  document.getElementById('mochiShopModal')?.classList.add('open');
  updateDewsHeader();
  window.switchShopTab(activeShopTab);
}

export function switchShopTab(tab) {
  activeShopTab = tab;
  document.querySelectorAll('.shop-tabs button').forEach(btn => btn.classList.remove('active'));
  
  const activeBtn = document.getElementById(`shopt-${tab}`);
  if (activeBtn) activeBtn.classList.add('active');
  
  renderShopItems();
}

export function renderShopItems() {
  const container = document.getElementById('shopItemsContainer');
  if (!container) return;
  
  updateDewsHeader();
  
  if (activeShopTab === 'frames') {
    container.innerHTML = FRAME_ITEMS.map(item => {
      const isUnlocked = state.unlockedFrames.includes(item.id) || item.price === 0;
      const isEquipped = state.profile.avatarFrame === item.id;
      
      return `
        <div class="me-setting-item" style="padding:14px; margin-bottom:10px; background:rgba(255,255,255,0.6); border-radius:16px; border:1px solid rgba(0,0,0,0.03); display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="frame-circle ${item.class}" style="width:36px; height:36px;"></div>
            <div>
              <div style="font-weight:800; font-size:14px; color:var(--text)">${item.name}</div>
              <div style="font-size:11px; color:#a0aec0; margin-top:2px">${item.desc}</div>
            </div>
          </div>
          <div>
            ${isUnlocked ? (
              isEquipped ? 
                `<button style="background:#e2e8f0; color:#718096; border:none; padding:6px 12px; border-radius:12px; font-size:12px; font-weight:800; cursor:default;">Đang dùng</button>` :
                `<button onclick="window.equipFrame('${item.id}')" style="background:var(--accent-light); color:var(--accent); border:none; padding:6px 12px; border-radius:12px; font-size:12px; font-weight:800; cursor:pointer;">Sử dụng</button>`
            ) : (
              `<button onclick="window.buyFrame('${item.id}', ${item.price})" style="background:linear-gradient(135deg,#ff9a4d,#ff6b35); color:white; border:none; padding:6px 14px; border-radius:12px; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:4px;">💧 ${item.price}</button>`
            )}
          </div>
        </div>
      `;
    }).join('');
  } else if (activeShopTab === 'wallpapers') {
    container.innerHTML = WALLPAPER_ITEMS.map(item => {
      const isUnlocked = state.unlockedWallpapers.includes(item.id);
      const isActive = state.activeWallpaper === item.id;
      
      return `
        <div class="me-setting-item" style="padding:14px; margin-bottom:10px; background:rgba(255,255,255,0.6); border-radius:16px; border:1px solid rgba(0,0,0,0.03); display:flex; align-items:center; justify-content:space-between;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:36px; height:36px; border-radius:10px; background:${item.bg}; border: 2px solid ${item.accent}"></div>
            <div>
              <div style="font-weight:800; font-size:14px; color:var(--text)">${item.name}</div>
              <div style="font-size:11px; color:#a0aec0; margin-top:2px">${item.desc}</div>
            </div>
          </div>
          <div>
            ${isUnlocked ? (
              isActive ? 
                `<button onclick="window.applyWallpaper('none')" style="background:#e2e8f0; color:#718096; border:none; padding:6px 12px; border-radius:12px; font-size:12px; font-weight:800; cursor:pointer;">Đang dùng 🌟</button>` :
                `<button onclick="window.applyWallpaper('${item.id}')" style="background:var(--accent-light); color:var(--accent); border:none; padding:6px 12px; border-radius:12px; font-size:12px; font-weight:800; cursor:pointer;">Áp dụng</button>`
            ) : (
              `<button onclick="window.buyWallpaper('${item.id}', ${item.price})" style="background:linear-gradient(135deg,#b583f5,#7bc8f6); color:white; border:none; padding:6px 14px; border-radius:12px; font-size:12px; font-weight:800; cursor:pointer; display:flex; align-items:center; gap:4px;">💧 ${item.price}</button>`
            )}
          </div>
        </div>
      `;
    }).join('') + `
      <div style="text-align:center; font-size:11px; color:#a0aec0; margin-top:10px;">*Nhấn "Đang dùng 🌟" để quay lại giao diện tím nguyên bản của Mochi</div>
    `;
  } else if (activeShopTab === 'mascot') {
    const lvl = state.mochiLevel;
    const exp = state.mochiExp;
    
    // Choose avatar based on level
    let mascotIcon = '🥚';
    let mascotTitle = 'Mochi Sơ Sinh';
    if (lvl >= 3 && lvl < 6) { mascotIcon = '🐰'; mascotTitle = 'Mochi Mầm Nhỏ'; }
    else if (lvl >= 6 && lvl < 10) { mascotIcon = '🧁'; mascotTitle = 'Mochi Bánh Ngọt'; }
    else if (lvl >= 10) { mascotIcon = '👑'; mascotTitle = 'Mochi Hoàng Đế'; }
    
    container.innerHTML = `
      <div style="background:rgba(255,255,255,0.7); padding:20px; border-radius:24px; text-align:center; border:1px solid rgba(0,0,0,0.03);">
        <div style="font-size:72px; margin-bottom:10px; animation: bounce 2s infinite;">${mascotIcon}</div>
        <div style="font-weight:900; font-size:18px; color:var(--text)">${mascotTitle} (Cấp ${lvl})</div>
        <div style="font-size:12px; color:#718096; margin-top:4px">Càng chăm sóc bản thân, Mochi càng lớn nhanh!</div>
        
        <div style="margin:20px 0;">
          <div style="display:flex; justify-content:space-between; font-size:11px; font-weight:800; color:#718096; margin-bottom:6px">
            <span>EXP</span>
            <span>${exp}/100</span>
          </div>
          <div style="background:#edf2f7; height:12px; border-radius:10px; overflow:hidden;">
            <div style="background:linear-gradient(90deg, #b583f5, #7bc8f6); width:${exp}%; height:100%; border-radius:10px; transition: width 0.3s;"></div>
          </div>
        </div>
        
        <button onclick="window.feedMochi()" class="save-btn" style="width:100%; background:linear-gradient(135deg, #ff9a4d, #ff6b35); border-radius:16px; color:white; border:none; padding:12px; font-weight:800; cursor:pointer;">
          💧 Cho Mochi uống nước (-5 Hạt sương)
        </button>
        <div style="text-align:center; font-size:11px; color:#a0aec0; margin-top:8px;">Nhận +10 EXP cho bé Mochi khi cho uống sương ngọt ngào</div>
      </div>
    `;
  }
}

export function buyFrame(id, price) {
  if (state.dews < price) {
    showToast('❌ Bạn không đủ Hạt sương ngọt ngào! Hãy làm thêm nghi thức nhé. 💧');
    return;
  }
  
  state.dews -= price;
  state.unlockedFrames = [...state.unlockedFrames, id];
  showToast('🎉 Mở khóa Khung avatar thành công!');
  renderShopItems();
  window.updateProfileUI?.();
}

export function equipFrame(id) {
  if (!state.unlockedFrames.includes(id)) return;
  state.profile.avatarFrame = id;
  showToast('✨ Đã áp dụng khung ảnh đại diện mới!');
  renderShopItems();
  window.updateProfileUI?.();
}

export function buyWallpaper(id, price) {
  if (state.dews < price) {
    showToast('❌ Bạn không đủ Hạt sương ngọt ngào! Hãy làm thêm nghi thức nhé. 💧');
    return;
  }
  
  state.dews -= price;
  state.unlockedWallpapers = [...state.unlockedWallpapers, id];
  showToast('🎉 Mở khóa Giao diện thành công!');
  renderShopItems();
}

export function applyWallpaper(id) {
  if (id !== 'none' && !state.unlockedWallpapers.includes(id)) return;
  state.activeWallpaper = id;
  applySavedTheme();
  showToast('🎨 Đã thay đổi giao diện ứng dụng!');
  renderShopItems();
}

export function applySavedTheme() {
  const wp = state.activeWallpaper || 'none';
  const root = document.documentElement;
  
  if (wp === 'lavender') {
    root.style.setProperty('--bg-color', '#f3ebff');
    root.style.setProperty('--accent', '#9f7aea');
    root.style.setProperty('--accent-light', '#e9d8fd');
  } else if (wp === 'peach') {
    root.style.setProperty('--bg-color', '#fff5f5');
    root.style.setProperty('--accent', '#ed8936');
    root.style.setProperty('--accent-light', '#feebc8');
  } else if (wp === 'ocean') {
    root.style.setProperty('--bg-color', '#ebf8ff');
    root.style.setProperty('--accent', '#3182ce');
    root.style.setProperty('--accent-light', '#bee3f8');
  } else {
    // Reset to default pastel purple
    root.style.setProperty('--bg-color', '#faf5ff');
    root.style.setProperty('--accent', '#b583f5');
    root.style.setProperty('--accent-light', '#f3ebff');
  }
}

export function feedMochi() {
  if (state.dews < 5) {
    showToast('❌ Bạn không đủ Hạt sương! Mochi cần ít nhất 5 giọt nước để uống. 💧');
    return;
  }
  
  state.dews -= 5;
  let newExp = state.mochiExp + 10;
  
  if (newExp >= 100) {
    state.mochiLevel += 1;
    state.mochiExp = newExp - 100;
    showToast(`🎉 CHÚC MỪNG! Mochi đã tiến hóa lên Cấp ${state.mochiLevel}! 🐰✨`);
  } else {
    state.mochiExp = newExp;
    showToast('🧁 Mochi tu ừng ực... ngon tuyệt! (+10 EXP) 🐰💧');
  }
  
  renderShopItems();
  window.updateProfileUI?.();
}
