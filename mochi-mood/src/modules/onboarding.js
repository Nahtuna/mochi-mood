import { TOUR_STEPS } from '../config.js';

let tourStep = 0;

export function startTour() {
  tourStep = 0;
  const overlay = document.getElementById('tourOverlay');
  if (overlay) overlay.style.display = 'block';
  renderTourStep();
}

export function renderTourStep() {
  const step    = TOUR_STEPS[tourStep];
  const tooltip = document.getElementById('tourTooltip');
  const hole    = document.getElementById('tourHole');
  const dotsEl  = document.getElementById('tourDots');
  const nextBtn = document.getElementById('tourNextBtn');
  if (!tooltip || !hole) return;

  const mascotEl = document.getElementById('tourMascot'); if (mascotEl) mascotEl.textContent = step.mascot;
  const textEl = document.getElementById('tourText'); if (textEl) textEl.textContent = step.text;
  if (nextBtn) nextBtn.textContent = tourStep === TOUR_STEPS.length - 1 ? 'Bắt đầu! 🎉' : 'Tiếp →';

  if (dotsEl) {
    dotsEl.innerHTML = TOUR_STEPS.map((_,i) =>
      `<div style="width:7px;height:7px;border-radius:50%;background:${i===tourStep?'#b583f5':'#e2e8f0'};transition:background 0.3s"></div>`
    ).join('');
  }

  tooltip.style.transform = '';
  if (step.targetId) {
    const target = document.getElementById(step.targetId);
    if (target) {
      const rect = target.getBoundingClientRect();
      const pad  = 2;
      hole.setAttribute('x',      rect.left   - pad);
      hole.setAttribute('y',      rect.top    - pad);
      hole.setAttribute('width',  rect.width  + pad * 2);
      hole.setAttribute('height', rect.height + pad * 2);

      const tw = 270;
      let tx = rect.left + rect.width / 2 - tw / 2;
      tx = Math.max(10, Math.min(tx, window.innerWidth - tw - 10));
      let ty = step.tooltipPos === 'top'
        ? rect.top  - pad - 175
        : rect.bottom + pad + 10;
      ty = Math.max(10, Math.min(ty, window.innerHeight - 220));
      tooltip.style.left = tx + 'px';
      tooltip.style.top  = ty + 'px';
    }
  } else {
    hole.setAttribute('width', 0);
    hole.setAttribute('height', 0);
    tooltip.style.left      = '50%';
    tooltip.style.top       = '50%';
    tooltip.style.transform = 'translate(-50%, -50%)';
  }

  tooltip.style.animation = 'none';
  void tooltip.offsetWidth;
  tooltip.style.animation = 'popIn 0.35s cubic-bezier(0.175,0.885,0.32,1.275) forwards';
}

export function nextTourStep() {
  tourStep++;
  if (tourStep >= TOUR_STEPS.length) skipTour();
  else renderTourStep();
}

export function skipTour() {
  const overlay = document.getElementById('tourOverlay');
  if (overlay) overlay.style.display = 'none';
  localStorage.setItem('mochi_tour_done', '1');
  const tooltip = document.getElementById('tourTooltip');
  if (tooltip) tooltip.style.transform = '';
}
