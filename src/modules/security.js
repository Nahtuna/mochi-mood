import { state } from '../state.js';
import { showToast } from '../utils.js';

let tempPin = '';
let isConfirming = false;
let initialPin = '';
let targetSecurityType = 'none'; // 'pin' or 'faceid'

// Passcode state during unlock screen
let unlockPinAttempt = '';

export function openPinSetup(type = 'pin') {
  targetSecurityType = type;
  tempPin = '';
  isConfirming = false;
  initialPin = '';
  
  const sub = document.getElementById('pinSetupSub');
  if (sub) sub.textContent = 'Nhập 4 chữ số để bảo vệ nhật ký của bạn';
  
  clearPinDots('setupPinDisplay');
  document.getElementById('pinSetupModal')?.classList.add('open');
}

function clearPinDots(displayId) {
  const display = document.getElementById(displayId);
  if (display) {
    display.querySelectorAll('.pin-dot').forEach(dot => dot.classList.remove('filled'));
  }
}

function updatePinDots(displayId, length) {
  const display = document.getElementById(displayId);
  if (display) {
    const dots = display.querySelectorAll('.pin-dot');
    dots.forEach((dot, index) => {
      dot.classList.toggle('filled', index < length);
    });
  }
}

export function pressSetupKey(key) {
  if (key === 'back') {
    tempPin = tempPin.slice(0, -1);
  } else if (/^\d$/.test(key)) {
    if (tempPin.length < 4) tempPin += key;
  }
  
  updatePinDots('setupPinDisplay', tempPin.length);
  
  if (tempPin.length === 4) {
    if (!isConfirming) {
      setTimeout(() => {
        initialPin = tempPin;
        tempPin = '';
        isConfirming = true;
        clearPinDots('setupPinDisplay');
        const sub = document.getElementById('pinSetupSub');
        if (sub) sub.textContent = '🔑 Nhập lại mã PIN để xác nhận';
      }, 250);
    } else {
      setTimeout(() => {
        if (tempPin === initialPin) {
          state.settings.securityPin = tempPin;
          state.settings.securityEnabled = true;
          state.settings.securityType = 'pin';
          showToast('🔑 Thiết lập mã PIN thành công!');
          
          document.getElementById('pinSetupModal')?.classList.remove('open');
          window.updateProfileUI?.();
          tempPin = '';
          isConfirming = false;
          initialPin = '';
        } else {
          // Shake effect
          const display = document.getElementById('setupPinDisplay');
          display?.classList.add('shake');
          setTimeout(() => display?.classList.remove('shake'), 400);
          
          showToast('❌ Mã PIN xác nhận không khớp. Thử lại!');
          tempPin = '';
          clearPinDots('setupPinDisplay');
        }
      }, 250);
    }
  }
}

// ================= UNLOCK LOCKSCREEN =================

export function checkSecurityLock() {
  if (state.settings.securityEnabled && state.settings.securityPin) {
    showLockScreen();
  }
}

export function showLockScreen() {
  unlockPinAttempt = '';
  clearPinDots('unlockPinDisplay');
  
  const overlay = document.getElementById('pinLockOverlay');
  if (overlay) {
    overlay.style.display = 'flex';
    overlay.classList.remove('unlocked');
  }
  
  const msg = document.getElementById('pinLockMessage');
  if (msg) msg.textContent = 'Nhập mã PIN để mở khóa 🔑';
  
  const bioBtn = document.getElementById('pinLockBioBtn');
  if (bioBtn) {
    bioBtn.style.visibility = 'hidden';
    bioBtn.style.pointerEvents = 'none';
  }
}

export function pressUnlockKey(key) {
  if (key === 'back') {
    unlockPinAttempt = unlockPinAttempt.slice(0, -1);
  } else if (/^\d$/.test(key)) {
    if (unlockPinAttempt.length < 4) unlockPinAttempt += key;
  }
  
  updatePinDots('unlockPinDisplay', unlockPinAttempt.length);
  
  if (unlockPinAttempt.length === 4) {
    setTimeout(() => {
      if (unlockPinAttempt === state.settings.securityPin) {
        unlockSuccess();
      } else {
        const display = document.getElementById('unlockPinDisplay');
        const content = document.getElementById('pinLockContent');
        content?.classList.add('shake');
        setTimeout(() => content?.classList.remove('shake'), 450);
        
        showToast('❌ Mã PIN không chính xác!');
        unlockPinAttempt = '';
        clearPinDots('unlockPinDisplay');
      }
    }, 200);
  }
}

function unlockSuccess() {
  const overlay = document.getElementById('pinLockOverlay');
  if (overlay) {
    overlay.classList.add('unlocked');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 600);
  }
  showToast('✨ Chào mừng bạn trở lại! 🧁');
}

export async function triggerBiometricUnlock() {
  // No-op after biometrics removal
}
