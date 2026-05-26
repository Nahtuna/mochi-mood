// ============ SELF-CARE RITUALS MODULE (Phase 7) ============

import { state } from '../state.js';
import { showToast } from '../utils.js';

/**
 * Initializes and resets daily rituals if a new day has arrived
 */
export function initRituals() {
  const today = new Date().toDateString();
  
  if (state.ritualsDate !== today) {
    state.ritualsDate = today;
    // Reset all default rituals to uncompleted for the new day
    const resetList = state.rituals.map(item => ({
      ...item,
      completed: false
    }));
    state.rituals = resetList;
  }
}

/**
 * Toggles a self-care ritual by ID, updating states and triggering interactive rewards
 */
export function toggleRitual(id, event) {
  const updated = state.rituals.map(item => {
    if (item.id === id) {
      const targetState = !item.completed;
      
      if (targetState === true) {
        // Award a Sweet Dew and play interactive effects
        state.dews += 1;
        playPopSound();
        if (event) triggerBubbleEffect(event);
        showToast('✨ +1 Hạt sương ngọt ngào cho chú Mochi! 💧');
      } else {
        // Refund/deduct Sweet Dew
        state.dews = Math.max(0, state.dews - 1);
      }
      
      return { ...item, completed: targetState };
    }
    return item;
  });
  
  state.rituals = updated;
  renderRituals();
}

/**
 * Procedurally synthesizes a delightful bubble-pop audio effect offline using Web Audio API
 */
function playPopSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // Frequency sweeps upwards quickly to simulate a light, cute water bubble popping
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (err) {
    console.warn('[Mochi Audio] Bubble pop failed:', err);
  }
}

/**
 * Spawns dynamic floating bubble particles around the clicked target
 */
function triggerBubbleEffect(event) {
  const rect = event.target.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  
  // Create 8 lightweight floating bubbles
  for (let i = 0; i < 8; i++) {
    const bubble = document.createElement('div');
    bubble.className = 'ritual-bubble-particle';
    
    const size = Math.random() * 12 + 6; // random size 6px to 18px
    const angle = Math.random() * Math.PI * 2;
    const velocity = Math.random() * 70 + 30; // float speed
    
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    bubble.style.setProperty('--dx', `${Math.cos(angle) * velocity}px`);
    bubble.style.setProperty('--dy', `${-Math.abs(Math.sin(angle) * velocity) - 25}px`);
    
    document.body.appendChild(bubble);
    setTimeout(() => bubble.remove(), 800);
  }
}

/**
 * Renders the Self-Care Checklist in the main dashboard view
 */
export function renderRituals() {
  const container = document.getElementById('ritualsWidget');
  if (!container) return;
  
  const items = state.rituals || [];
  const completedCount = items.filter(r => r.completed).length;
  const progressPercent = items.length ? Math.round((completedCount / items.length) * 100) : 0;
  
  container.innerHTML = `
    <div class="rituals-card">
      <div class="rituals-header">
        <div class="rituals-header-info">
          <h3>🌱 Nghi thức tự yêu bản thân</h3>
          <p>Tưới mát tâm hồn mỗi ngày cùng Mochi</p>
        </div>
        <div class="dews-badge">
          <span class="dew-icon">💧</span>
          <span class="dew-count">${state.dews}</span>
        </div>
      </div>
      
      <!-- Progress Bar -->
      <div class="rituals-progress-container">
        <div class="rituals-progress-bar" style="width: ${progressPercent}%"></div>
        <span class="rituals-progress-text">${completedCount}/${items.length} hoàn thành (${progressPercent}%)</span>
      </div>
      
      <!-- Habits Checklist -->
      <div class="rituals-list">
        ${items.map(item => `
          <div class="ritual-item ${item.completed ? 'completed' : ''}" onclick="window.toggleRitual('${item.id}', event)">
            <div class="ritual-checkbox">
              <span class="check-mark">${item.completed ? '✓' : ''}</span>
            </div>
            <span class="ritual-text">${item.text}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
