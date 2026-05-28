import { state } from '../state.js';
import { formatDate } from '../utils.js';

export function openPhotoGallery() {
  const container = document.getElementById('galleryGrid');
  const emptyEl = document.getElementById('galleryEmpty');
  if (!container) return;
  
  const allImgs = (state.entries || []).flatMap(e => (e.imgs || []).map(src => ({ src, date: e.date, id: e.id })));
  
  if (allImgs.length === 0) {
    container.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
  } else {
    if (emptyEl) emptyEl.style.display = 'none';
    container.innerHTML = allImgs.map(img => `
      <div class="gallery-item" onclick="window.openLightbox('${img.src}', '${formatDate(img.date)}')">
        <img src="${img.src}" loading="lazy">
      </div>
    `).join('');
  }
  
  document.getElementById('photoGalleryModal')?.classList.add('open');
}

export function openLightbox(src, info) {
  const lb = document.getElementById('lightboxOverlay');
  if (!lb) return;
  const img = document.getElementById('lightboxImg');
  if (img) img.src = src;
  const infoEl = document.getElementById('lightboxInfo');
  if (infoEl) infoEl.textContent = info || '';
  lb.classList.add('open');
}

export function closeLightbox() {
  document.getElementById('lightboxOverlay')?.classList.remove('open');
}
