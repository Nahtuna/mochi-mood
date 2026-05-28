import { showToast } from '../utils.js';

let cameraStream = null;
let cameraFacing = 'user';
let capturedDataUrl = null;
let pendingPhotos = [];
let camSessionPhotos = [];
let selectedFilter = 'none';
let usePolaroidFrame = false;

// Expose these helpers
export function setCameraFilter(filterName, btn) {
  selectedFilter = filterName;
  const video = document.getElementById('cameraVideo');
  if (video) {
    if (filterName === 'none') {
      video.style.filter = '';
    } else if (filterName === 'polaroid') {
      video.style.filter = 'sepia(0.24) contrast(1.15) saturate(0.85) brightness(0.96)';
    } else if (filterName === 'pink') {
      video.style.filter = 'hue-rotate(-12deg) saturate(1.15) brightness(1.04) contrast(0.96)';
    } else if (filterName === 'forest') {
      video.style.filter = 'contrast(0.92) saturate(0.72) sepia(0.12) hue-rotate(12deg)';
    }
  }
  
  // Cập nhật trạng thái active của các nút filter
  document.querySelectorAll('.filter-opt-btn').forEach(b => b.classList.remove('active'));
  if (btn) {
    btn.classList.add('active');
  } else {
    // Tìm và active nút tương ứng
    const foundBtn = Array.from(document.querySelectorAll('.filter-opt-btn')).find(b => b.getAttribute('onclick')?.includes(`'${filterName}'`));
    if (foundBtn) foundBtn.classList.add('active');
  }
  
  if ('vibrate' in navigator) navigator.vibrate(10);
}

export function togglePolaroidFrame() {
  usePolaroidFrame = !usePolaroidFrame;
  const btn = document.getElementById('polaroidFrameToggle');
  if (btn) {
    btn.textContent = usePolaroidFrame ? '🖼️ Khung: Bật' : '🖼️ Khung: Tắt';
    btn.classList.toggle('active', usePolaroidFrame);
  }
  
  // Hiển thị khung giả lập trong phần live preview
  const overlay = document.querySelector('.camera-frame-overlay');
  if (overlay) {
    overlay.classList.toggle('polaroid-frame-preview', usePolaroidFrame);
  }
  
  if ('vibrate' in navigator) navigator.vibrate(10);
}

export function playShutterSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {
    console.log('Web Audio shutter sound failed:', e);
  }
}

export function showCameraSource() {
  document.getElementById('cameraSourceModal')?.classList.add('open');
}

export function openAlbum() {
  document.getElementById('cameraSourceModal')?.classList.remove('open');
  document.getElementById('albumInput')?.click();
}

export function retakePhoto() {
  capturedDataUrl = null;
  const previewRow = document.getElementById('photoPreviewRow');
  if (previewRow) previewRow.style.display = 'none';
  startCameraStream();
}

export async function openLiveCamera() {
  document.getElementById('cameraSourceModal')?.classList.remove('open');
  camSessionPhotos = [];
  updateCamStrip();
  await startCameraStream();
  document.getElementById('cameraModal')?.classList.add('open');
}

export async function startCameraStream() {
  stopCameraStream();
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: cameraFacing, width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    const video = document.getElementById('cameraVideo');
    if (video) {
      video.srcObject = cameraStream;
      video.classList.toggle('mirrored', cameraFacing === 'user');
      video.style.display = 'block';
      
      // Áp dụng lại bộ lọc màu đang chọn
      setCameraFilter(selectedFilter, null);
    }
    const previewRow = document.getElementById('photoPreviewRow');
    if (previewRow) previewRow.style.display = 'none';
    const controls = document.querySelectorAll('.camera-controls');
    if (controls[0]) controls[0].style.display = 'flex';
  } catch (err) {
    showToast('❌ Lỗi camera: ' + err.message);
    document.getElementById('cameraModal')?.classList.remove('open');
  }
}

export async function flipCamera() {
  cameraFacing = cameraFacing === 'environment' ? 'user' : 'environment';
  const btn = document.getElementById('flipBtn');
  if (btn) {
    btn.style.transform = 'rotateY(180deg)';
    setTimeout(() => btn.style.transform = '', 400);
  }
  if ('vibrate' in navigator) navigator.vibrate(15);
  await startCameraStream();
}

export function takePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  if (!video || !canvas) return;
  
  // 1. Phát âm thanh màn trập & Rung phản hồi
  playShutterSound();
  if ('vibrate' in navigator) navigator.vibrate([15, 30, 15]);

  // 2. Thiết lập kích thước
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  
  // 3. Xử lý gương nếu là camera trước
  if (cameraFacing === 'user') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  
  // 4. Áp dụng hiệu ứng bộ lọc màu lên Canvas
  let filterString = 'none';
  if (selectedFilter === 'polaroid') {
    filterString = 'sepia(0.24) contrast(1.15) saturate(0.85) brightness(0.96)';
  } else if (selectedFilter === 'pink') {
    filterString = 'hue-rotate(-12deg) saturate(1.15) brightness(1.04) contrast(0.96)';
  } else if (selectedFilter === 'forest') {
    filterString = 'contrast(0.92) saturate(0.72) sepia(0.12) hue-rotate(12deg)';
  }
  ctx.filter = filterString;
  
  // 5. Vẽ ảnh gốc từ stream video
  ctx.drawImage(video, 0, 0);
  
  // 6. Lồng khung ảnh Polaroid dễ thương nếu được bật
  if (usePolaroidFrame) {
    const frameCanvas = document.createElement('canvas');
    const fCtx = frameCanvas.getContext('2d');
    
    const borderWidth = Math.round(canvas.width * 0.05); // 5% border
    const borderTop = borderWidth;
    const borderBottom = Math.round(canvas.width * 0.16); // Thicker bottom (16%)
    
    frameCanvas.width = canvas.width + borderWidth * 2;
    frameCanvas.height = canvas.height + borderTop + borderBottom;
    
    // Tô nền trắng cho khung
    fCtx.fillStyle = '#ffffff';
    fCtx.fillRect(0, 0, frameCanvas.width, frameCanvas.height);
    
    // Vẽ viền mịn mờ bên ngoài khung
    fCtx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
    fCtx.lineWidth = 1;
    fCtx.strokeRect(0, 0, frameCanvas.width, frameCanvas.height);
    
    // Vẽ bức ảnh đã có filter vào giữa khung
    fCtx.drawImage(canvas, borderWidth, borderTop);
    
    // Vẽ viền mịn bên trong bức ảnh để tạo độ chân thật sâu sắc
    fCtx.strokeStyle = 'rgba(0, 0, 0, 0.06)';
    fCtx.lineWidth = 1.5;
    fCtx.strokeRect(borderWidth, borderTop, canvas.width, canvas.height);
    
    // Cập nhật lại canvas chính
    canvas.width = frameCanvas.width;
    canvas.height = frameCanvas.height;
    const mainCtx = canvas.getContext('2d');
    mainCtx.filter = 'none'; // reset filter
    mainCtx.drawImage(frameCanvas, 0, 0);
  }
  
  // 7. Tối ưu hóa & nén ảnh phía Client sang WebP chất lượng cao (0.80)
  capturedDataUrl = canvas.toDataURL('image/webp', 0.80);
  if (!capturedDataUrl.startsWith('data:image/webp')) {
    // Trình duyệt không hỗ trợ WebP, dùng JPEG (0.82) làm fallback
    capturedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
  }

  const preview = document.getElementById('capturedPreview');
  if (preview) {
    preview.src = capturedDataUrl;
    preview.style.transform = 'none';
  }
  document.getElementById('photoPreviewRow').style.display = 'block';
  video.style.display = 'none';
  const controls = document.querySelectorAll('.camera-controls');
  if (controls[0]) controls[0].style.display = 'none';

  const wrapper = document.querySelector('.camera-preview-wrapper');
  if (wrapper) {
    wrapper.style.transition = 'opacity 0.05s';
    wrapper.style.opacity = '0.1';
    setTimeout(() => { wrapper.style.opacity = '1'; }, 100);
  }
  stopCameraStream();
}

export function addMorePhoto() {
  if (capturedDataUrl) {
    camSessionPhotos.push(capturedDataUrl);
    capturedDataUrl = null;
    updateCamStrip();
  }
  document.getElementById('photoPreviewRow').style.display = 'none';
  startCameraStream();
}

export function doneMultiPhoto() {
  if (capturedDataUrl) camSessionPhotos.push(capturedDataUrl);
  pendingPhotos.push(...camSessionPhotos);
  attachPendingPhotos();
  camSessionPhotos = [];
  closeCameraModal();
  showToast(`📸 Đã thêm ${pendingPhotos.length || camSessionPhotos.length} ảnh!`);
}

export function updateCamStrip() {
  const strip = document.getElementById('camThumbnailStrip');
  const list = document.getElementById('camThumbList');
  const badge = document.getElementById('camPhotoCount');
  const doneCount = document.getElementById('camDoneCount');
  const countNum = document.getElementById('camCountNum');
  if (!strip || !list) return;
  
  const n = camSessionPhotos.length;
  strip.style.display = n > 0 ? 'block' : 'none';
  if (badge) badge.style.display = n > 0 ? 'block' : 'none';
  if (countNum) countNum.textContent = n;
  if (doneCount) doneCount.textContent = n;
  list.innerHTML = '';
  camSessionPhotos.forEach((src, i) => {
    const wrap = document.createElement('div');
    wrap.className = 'cam-thumb-item';
    const img = document.createElement('img'); img.src = src;
    const del = document.createElement('button');
    del.className = 'cam-thumb-del'; del.textContent = '×';
    del.onclick = () => { camSessionPhotos.splice(i, 1); updateCamStrip(); };
    wrap.appendChild(img); wrap.appendChild(del); list.appendChild(wrap);
  });
}

export function usePhoto() {
  if (!capturedDataUrl) return;
  pendingPhotos.push(capturedDataUrl);
  attachPendingPhotos();
  closeCameraModal();
  showToast('📸 Đã thêm ảnh vào nhật ký!');
}

export function closeCameraModal(event) {
  const modal = document.getElementById('cameraModal');
  if (event && event.target !== modal) return;
  stopCameraStream();
  capturedDataUrl = null;
  modal?.classList.remove('open');
  const previewRow = document.getElementById('photoPreviewRow');
  if (previewRow) previewRow.style.display = 'none';
  const video = document.getElementById('cameraVideo');
  if (video) video.style.display = 'block';
}

export function stopCameraStream() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(t => t.stop());
    cameraStream = null;
  }
}

export function useAlbumPhotos(event) {
  const files = event.target.files;
  if (!files || !files.length) return;
  let loaded = 0;
  const numFiles = files.length;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = e => {
      pendingPhotos.push(e.target.result);
      loaded++;
      if (loaded === numFiles) {
        attachPendingPhotos();
        showToast(`🖼️ Đã thêm ${loaded} ảnh!`);
      }
    };
    reader.readAsDataURL(file);
  });
  event.target.value = '';
}

export function attachPendingPhotos() {
  if (!pendingPhotos.length) return;
  const area = document.getElementById('imagePreviewArea');
  const list = document.getElementById('imgPreviewList');
  if (!area || !list) return;
  area.style.display = 'block';
  pendingPhotos.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'width:70px;height:70px;object-fit:cover;border-radius:12px;cursor:pointer;';
    img.title = 'Tap để xóa';
    img.onclick = () => { img.remove(); if (!list.children.length) area.style.display='none'; };
    list.appendChild(img);
  });
  pendingPhotos = [];
}
