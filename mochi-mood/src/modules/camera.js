import { showToast } from '../utils.js';

let cameraStream = null;
let cameraFacing = 'user';
let capturedDataUrl = null;
let pendingPhotos = [];
let camSessionPhotos = [];

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
  await startCameraStream();
}

export function takePhoto() {
  const video = document.getElementById('cameraVideo');
  const canvas = document.getElementById('cameraCanvas');
  if (!video || !canvas) return;
  
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  if (cameraFacing === 'user') {
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0);
  capturedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

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
