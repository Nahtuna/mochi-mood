import { checkAuth, handleAuthSubmit, handleGoogleLogin, switchAuthTab, togglePasswordVisibility, logout } from './modules/auth.js';
import { loadFromStorage, signOut } from './api.js';
import { showToast, initGreeting, initDate } from './utils.js';
import { state } from './state.js';
import { renderTimeline, renderHighlights, renderStreak } from './modules/home.js';
import { renderJournal, setView, filterJournal, filterByMood } from './modules/journal.js';
import { 
  renderCalendar, changeMonth, statsScrollTo, openDayDetail, closeDayDetail, 
  prevDay, nextDay, openAddEventModal, selectEventIcon, saveCustomEvent, deleteCustomEvent,
  renderDayDetail, drawMoodJar, drawPieChart
} from './modules/stats.js';
import { 
  openAvatarEdit, closeAvatarEdit, handleAvatarImgUpload, saveAvatarEdit, updateProfileUI,
  toggleWallpaper, showLanguageModal, showMoodSetModal, showSecurityModal, showNotifModal, saveReminder,
  selectFrame, selectAvatarEmoji, selectSecurityOption
} from './modules/profile.js';
import { 
  renderPartnerWidget, renderPartnerInMe, copyMyId, connectPartner, 
  showSharedTimeline, switchSharedTab, sendHeartToPartner, joinWithCode, 
  shareViaApp, showPartnerChat, sendChatMsg, sendQuickReact, 
  showPartnerModal, showInviteModal, showJoinModal, copyInviteCode, disconnectPartner 
} from './modules/partner.js';
import { 
  showMoodPicker, closeMoodPicker, selectMood, closeWriteModal, editEntry, 
  toggleActivity, toggleCustomTagInput, addCustomTag, saveEntry, deleteEntry 
} from './modules/entry.js';
import { 
  showCameraSource, openAlbum, retakePhoto, openLiveCamera, flipCamera, 
  takePhoto, addMorePhoto, doneMultiPhoto, usePhoto, closeCameraModal, useAlbumPhotos 
} from './modules/camera.js';
import { openPhotoGallery, openLightbox, closeLightbox } from './modules/gallery.js';
import { startTour, nextTourStep, skipTour } from './modules/onboarding.js';

window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled Promise rejection:', event.reason);
  showToast('❌ Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.');
  event.preventDefault();
});

console.log('Mochi Mood: Initializing main.js...');

if ('serviceWorker' in navigator && false) { // Tạm thời tắt đăng ký SW để tránh cache trong lúc phát triển
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Mochi Mood SW registered!'))
      .catch(err => console.log('SW registration failed:', err));
  });
}

// Navigation
window.navigateTo = (tabId) => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`screen-${tabId}`);
  if (target) {
    target.classList.add('active');
    if (tabId === 'home') { renderTimeline?.(); renderHighlights?.(); }
    if (tabId === 'journal') renderJournal?.();
    if (tabId === 'stats') { renderCalendar?.(); drawMoodJar?.(); drawPieChart?.(); }
  }
  
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[onclick*="${tabId}"]`);
  if (navItem) navItem.classList.add('active');
};
window.switchTab = window.navigateTo;

// Global Exports
window.switchAuthTab = switchAuthTab;
window.handleAuthSubmit = handleAuthSubmit;
window.handleGoogleLogin = handleGoogleLogin;
window.togglePasswordVisibility = togglePasswordVisibility;
window.logout = logout;

window.showMoodPicker = showMoodPicker;
window.closeMoodPicker = closeMoodPicker;
window.selectMood = selectMood;
window.closeWriteModal = closeWriteModal;
window.editEntry = editEntry;
window.deleteEntry = deleteEntry;
window.saveEntry = saveEntry;
window.toggleActivity = toggleActivity;
window.toggleCustomTagInput = toggleCustomTagInput;
window.addCustomTag = addCustomTag;
window.setView = setView;
window.filterJournal = filterJournal;
window.filterByMood = filterByMood;

window.showCameraSource = showCameraSource;
window.openAlbum = openAlbum;
window.retakePhoto = retakePhoto;
window.openLiveCamera = openLiveCamera;
window.flipCamera = flipCamera;
window.takePhoto = takePhoto;
window.addMorePhoto = addMorePhoto;
window.doneMultiPhoto = doneMultiPhoto;
window.usePhoto = usePhoto;
window.closeCameraModal = closeCameraModal;
window.useAlbumPhotos = useAlbumPhotos;

window.changeMonth = changeMonth;
window.statsScrollTo = statsScrollTo;
window.openDayDetail = openDayDetail;
window.closeDayDetail = closeDayDetail;
window.prevDay = prevDay;
window.nextDay = nextDay;
window.openAddEventModal = openAddEventModal;
window.selectEventIcon = selectEventIcon;
window.saveCustomEvent = saveCustomEvent;
window.deleteCustomEvent = deleteCustomEvent;

window.copyMyId = copyMyId;
window.connectPartner = connectPartner;
window.showSharedTimeline = showSharedTimeline;
window.switchSharedTab = switchSharedTab;
window.sendHeartToPartner = sendHeartToPartner;
window.joinWithCode = joinWithCode;
window.shareViaApp = shareViaApp;
window.showPartnerChat = showPartnerChat;
window.sendChatMsg = sendChatMsg;
window.sendQuickReact = sendQuickReact;
window.showPartnerModal = showPartnerModal;
window.showInviteModal = showInviteModal;
window.showJoinModal = showJoinModal;
window.copyInviteCode = copyInviteCode;
window.disconnectPartner = disconnectPartner;

window.openAvatarEdit = openAvatarEdit;
window.closeAvatarEdit = closeAvatarEdit;
window.handleAvatarImgUpload = handleAvatarImgUpload;
window.saveAvatarEdit = saveAvatarEdit;
window.selectFrame = selectFrame;
window.toggleWallpaper = toggleWallpaper;
window.showLanguageModal = showLanguageModal;
window.showMoodSetModal = showMoodSetModal;
window.showSecurityModal = showSecurityModal;
window.showNotifModal = showNotifModal;
window.saveReminder = saveReminder;

window.openPhotoGallery = openPhotoGallery;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.startTour = startTour;
window.nextTourStep = nextTourStep;
window.skipTour = skipTour;

// Render functions needed by inline HTML and other modules
window.renderTimeline = renderTimeline;
window.renderJournal = renderJournal;
window.renderStreak = renderStreak;
window.renderHighlights = renderHighlights;
window.renderDayDetail = renderDayDetail;
window.drawMoodJar = drawMoodJar;
window.drawPieChart = drawPieChart;

// Profile extras
window.selectAvatarEmoji = selectAvatarEmoji;
window.selectSecurityOption = selectSecurityOption;

// Notification State
state.notifications = [
  { id: 1, title: 'Đã đến lúc viết nhật ký rồi! 🌸', time: '10 phút trước', icon: '📝', unread: true },
  { id: 2, title: 'Gấu vừa gửi một trái tim cho bạn ❤️', time: '2 giờ trước', icon: '🐻', unread: true }
];

window.toggleNotifCenter = function() {
  const modal = document.getElementById('notifCenterModal');
  if (modal) {
    modal.classList.add('open');
    renderNotifCenter();
  }
};

function renderNotifCenter() {
  const list = document.getElementById('notifCenterList');
  if (!list) return;
  
  if (state.notifications.length === 0) {
    list.innerHTML = '<div style="text-align:center;padding:40px;color:#a0aec0">Hộp thư trống trơn... 🌸</div>';
    return;
  }

  list.innerHTML = state.notifications.map(n => `
    <div class="notif-item ${n.unread ? 'unread' : ''}" onclick="window.markNotifRead(${n.id})">
      <div class="notif-icon">${n.icon}</div>
      <div class="notif-body">
        <div class="notif-title">${n.title}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    </div>
  `).join('');
  
  updateNotifBadge();
}

window.markNotifRead = function(id) {
  const n = state.notifications.find(x => x.id === id);
  if (n) n.unread = false;
  renderNotifCenter();
};

function updateNotifBadge() {
  const count = state.notifications.filter(n => n.unread).length;
  const badge = document.getElementById('notifCount');
  if (badge) {
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Initial badge update
setTimeout(updateNotifBadge, 1000);

// Update Exports
window.drawMoodJar = drawMoodJar;
window.renderNotifCenter = renderNotifCenter;
window.updateNotifBadge = updateNotifBadge;

// Utility functions
window.showToast = showToast;

// openModal helper
window.openModal = function(id) {
  document.getElementById(id)?.classList.add('open');
};

// closeModal helper (used by many HTML onclick attributes)
window.closeModal = function(id, event) {
  if (!event || event.target === document.getElementById(id)) {
    document.getElementById(id)?.classList.remove('open');
  }
};

// openPartnerTimeline alias
window.openPartnerTimeline = () => {
  if (window.showSharedTimeline) window.showSharedTimeline('both');
};

window.MochiState = state;

async function initApp() {
  console.log('Mochi Mood: Starting App Initialization...');
  
  try {
    initGreeting();
    initDate();

    const isLoggedIn = await checkAuth();
    if (!isLoggedIn) return;

    const data = await loadFromStorage();
    if (data) {
      renderTimeline();
      renderHighlights();
      renderStreak();
      renderJournal();
      renderCalendar();
      updateProfileUI();
      renderPartnerWidget();
      renderPartnerInMe();
    }
  } catch (err) {
    console.error('Mochi Mood: Initialization Error:', err);
  }
}

// Start App
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
