/**
 * Premium Physics-Based Mood Jar
 * Uses Matter.js for realistic collisions, gravity, and friction.
 * Glassmorphism visual style with pouring, shake, and hover interactions.
 */
import { MOODS } from '../config.js';
import { state } from '../state.js';

// Matter.js aliases
const { Engine, Render, World, Bodies, Body, Events, Mouse, Composite, Vector } = Matter;

let engine = null;
let runner = null;
let animFrameId = null;
let emojiBodies = [];
let jarCanvas = null;
let jarCtx = null;
let dpr = 1;
let JAR_W = 300;
let JAR_H = 380;
let mousePos = { x: -999, y: -999 };
let isShaking = false;
let pourQueue = [];
let pourTimer = null;

// Jar geometry constants (logical coords)
const JAR = {
  neckTop: 60,
  neckW: 50,
  bodyTop: 100,
  bodyW: 120,
  bodyBottom: 340,
  bottomW: 100,
  wallThickness: 8,
};

function getJarLeftX(y) {
  const cx = JAR_W / 2;
  if (y <= JAR.bodyTop) return cx - JAR.neckW;
  if (y >= JAR.bodyBottom) return cx - JAR.bottomW;
  const t = (y - JAR.bodyTop) / (JAR.bodyBottom - JAR.bodyTop);
  const bulge = Math.sin(t * Math.PI) * 20;
  const baseW = JAR.neckW + (JAR.bodyW - JAR.neckW) * Math.min(t * 2, 1);
  const finalW = t > 0.7 ? baseW - (t - 0.7) / 0.3 * (baseW - JAR.bottomW) : baseW;
  return cx - finalW - bulge;
}

function getJarRightX(y) {
  return JAR_W - getJarLeftX(y);
}

export function initMoodJar() {
  jarCanvas = document.getElementById('moodJarCanvas');
  if (!jarCanvas) return;

  // Responsive sizing
  const container = jarCanvas.parentElement;
  JAR_W = Math.min(container.clientWidth - 20, 320);
  JAR_H = Math.round(JAR_W * 1.27);

  // HiDPI support
  dpr = window.devicePixelRatio || 1;
  jarCanvas.width = JAR_W * dpr;
  jarCanvas.height = JAR_H * dpr;
  jarCanvas.style.width = JAR_W + 'px';
  jarCanvas.style.height = JAR_H + 'px';
  jarCtx = jarCanvas.getContext('2d');
  jarCtx.scale(dpr, dpr);

  // Setup Matter.js engine
  if (engine) {
    Engine.clear(engine);
    emojiBodies = [];
  }
  engine = Engine.create({ gravity: { x: 0, y: 1.8 } });

  // Create jar walls as static bodies
  createJarWalls();

  // Interactions
  jarCanvas.removeEventListener('click', handleShake);
  jarCanvas.addEventListener('click', handleShake);
  jarCanvas.removeEventListener('mousemove', handleMouseMove);
  jarCanvas.addEventListener('mousemove', handleMouseMove);
  jarCanvas.removeEventListener('mouseleave', handleMouseLeave);
  jarCanvas.addEventListener('mouseleave', handleMouseLeave);
  jarCanvas.removeEventListener('touchstart', handleTouchShake);
  jarCanvas.addEventListener('touchstart', handleTouchShake, { passive: true });
  jarCanvas.removeEventListener('touchmove', handleTouchMove);
  jarCanvas.addEventListener('touchmove', handleTouchMove, { passive: true });

  // Start render loop
  if (animFrameId) cancelAnimationFrame(animFrameId);
  renderLoop();
}

function createJarWalls() {
  const walls = [];
  const opts = { isStatic: true, friction: 0.6, restitution: 0.3, render: { visible: false } };
  const cx = JAR_W / 2;

  // Bottom
  walls.push(Bodies.rectangle(cx, JAR.bodyBottom + 10, JAR.bottomW * 2 - 10, 20, opts));

  // Left wall segments
  const segments = 12;
  for (let i = 0; i < segments; i++) {
    const t1 = i / segments;
    const t2 = (i + 1) / segments;
    const y1 = JAR.bodyTop + t1 * (JAR.bodyBottom - JAR.bodyTop);
    const y2 = JAR.bodyTop + t2 * (JAR.bodyBottom - JAR.bodyTop);
    const x1L = getJarLeftX(y1), x2L = getJarLeftX(y2);
    const x1R = getJarRightX(y1), x2R = getJarRightX(y2);
    const angle_L = Math.atan2(y2 - y1, x2L - x1L);
    const angle_R = Math.atan2(y2 - y1, x2R - x1R);
    const lenL = Math.sqrt((x2L - x1L) ** 2 + (y2 - y1) ** 2);
    const lenR = Math.sqrt((x2R - x1R) ** 2 + (y2 - y1) ** 2);

    walls.push(Bodies.rectangle((x1L + x2L) / 2, (y1 + y2) / 2, lenL + 4, JAR.wallThickness, { ...opts, angle: angle_L }));
    walls.push(Bodies.rectangle((x1R + x2R) / 2, (y1 + y2) / 2, lenR + 4, JAR.wallThickness, { ...opts, angle: angle_R }));
  }

  Composite.add(engine.world, walls);
}

/**
 * fillJar - Main API: pour emojis into the jar
 * @param {Array} moodData - Array of { emoji: '🌸', count: 5 }
 */
export function fillJar(moodData) {
  if (!engine) return; // Guard clause to prevent runtime errors when engine is not initialized
  // Clear existing
  emojiBodies.forEach(b => Composite.remove(engine.world, b.body));
  emojiBodies = [];
  if (pourTimer) clearInterval(pourTimer);
  pourQueue = [];

  if (!moodData || !moodData.length) return;

  // Build pour queue
  moodData.forEach(item => {
    for (let i = 0; i < item.count; i++) {
      pourQueue.push(item.emoji);
    }
  });

  // Shuffle for natural feel
  for (let i = pourQueue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pourQueue[i], pourQueue[j]] = [pourQueue[j], pourQueue[i]];
  }

  // Pour emojis one by one with burst effect
  let idx = 0;
  const burstSize = Math.max(1, Math.min(3, Math.floor(pourQueue.length / 8)));
  pourTimer = setInterval(() => {
    for (let b = 0; b < burstSize && idx < pourQueue.length; b++, idx++) {
      spawnEmoji(pourQueue[idx]);
    }
    if (idx >= pourQueue.length) clearInterval(pourTimer);
  }, 120);
}

function spawnEmoji(emoji) {
  const cx = JAR_W / 2;
  const size = 18 + Math.random() * 14; // 18-32px
  const radius = size / 2;
  const x = cx + (Math.random() - 0.5) * JAR.neckW;
  const y = JAR.neckTop - 20 - Math.random() * 40;

  const body = Bodies.circle(x, y, radius, {
    restitution: 0.45,
    friction: 0.4,
    frictionAir: 0.02,
    density: 0.002,
    render: { visible: false },
  });

  // Set initial rotational velocity
  Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.15);
  Body.setVelocity(body, { x: (Math.random() - 0.5) * 2, y: 2 + Math.random() * 3 });

  Composite.add(engine.world, body);
  emojiBodies.push({ body, emoji, size, alpha: 0, spawnTime: performance.now() });
}

function handleShake(e) {
  if (isShaking) return;
  isShaking = true;

  // Haptic-like visual feedback
  jarCanvas.style.transition = 'transform 0.05s';
  let shakeCount = 0;
  const shakeInterval = setInterval(() => {
    const dx = (Math.random() - 0.5) * 6;
    const dy = (Math.random() - 0.5) * 4;
    jarCanvas.style.transform = `translate(${dx}px, ${dy}px)`;
    shakeCount++;
    if (shakeCount > 8) {
      clearInterval(shakeInterval);
      jarCanvas.style.transform = '';
      isShaking = false;
    }
  }, 50);

  // Apply force to all emoji bodies
  emojiBodies.forEach(({ body }) => {
    const fx = (Math.random() - 0.5) * 0.08;
    const fy = -(0.04 + Math.random() * 0.06);
    Body.applyForce(body, body.position, { x: fx, y: fy });
    Body.setAngularVelocity(body, (Math.random() - 0.5) * 0.3);
  });
}

function handleTouchShake(e) {
  handleShake(e);
  if (e.touches && e.touches[0]) {
    const rect = jarCanvas.getBoundingClientRect();
    mousePos.x = (e.touches[0].clientX - rect.left) * (JAR_W / rect.width);
    mousePos.y = (e.touches[0].clientY - rect.top) * (JAR_H / rect.height);
  }
}

function handleMouseMove(e) {
  const rect = jarCanvas.getBoundingClientRect();
  mousePos.x = (e.clientX - rect.left) * (JAR_W / rect.width);
  mousePos.y = (e.clientY - rect.top) * (JAR_H / rect.height);
}

function handleTouchMove(e) {
  if (e.touches && e.touches[0]) {
    const rect = jarCanvas.getBoundingClientRect();
    mousePos.x = (e.touches[0].clientX - rect.left) * (JAR_W / rect.width);
    mousePos.y = (e.touches[0].clientY - rect.top) * (JAR_H / rect.height);
  }
}

function handleMouseLeave() {
  mousePos.x = -999;
  mousePos.y = -999;
}

function applyHoverRepulsion() {
  if (mousePos.x < 0) return;
  const repulseRadius = 50;
  const repulseStrength = 0.003;

  emojiBodies.forEach(({ body }) => {
    const dx = body.position.x - mousePos.x;
    const dy = body.position.y - mousePos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < repulseRadius && dist > 1) {
      const force = repulseStrength * (1 - dist / repulseRadius);
      Body.applyForce(body, body.position, {
        x: (dx / dist) * force,
        y: (dy / dist) * force,
      });
    }
  });
}

// =========== RENDERING ===========

function renderLoop() {
  Engine.update(engine, 1000 / 60);
  applyHoverRepulsion();
  draw();
  animFrameId = requestAnimationFrame(renderLoop);
}

function draw() {
  const ctx = jarCtx;
  ctx.clearRect(0, 0, JAR_W, JAR_H);

  drawJarBack(ctx);
  drawEmojis(ctx);
  drawJarFront(ctx);
  drawLid(ctx);
}

function drawJarBack(ctx) {
  const cx = JAR_W / 2;

  // Soft radial gradient background inside jar
  const innerGrad = ctx.createRadialGradient(cx, JAR_H * 0.6, 20, cx, JAR_H * 0.5, JAR_W * 0.5);
  innerGrad.addColorStop(0, 'rgba(247, 240, 255, 0.5)');
  innerGrad.addColorStop(0.5, 'rgba(232, 244, 253, 0.3)');
  innerGrad.addColorStop(1, 'rgba(255, 255, 255, 0.1)');

  ctx.save();
  buildJarPath(ctx);
  ctx.clip();
  ctx.fillStyle = innerGrad;
  ctx.fillRect(0, 0, JAR_W, JAR_H);
  ctx.restore();
}

function drawJarFront(ctx) {
  const cx = JAR_W / 2;

  // Glass outline
  ctx.save();
  buildJarPath(ctx);
  const glassGrad = ctx.createLinearGradient(0, JAR.bodyTop, JAR_W, JAR.bodyBottom);
  glassGrad.addColorStop(0, 'rgba(200, 180, 245, 0.25)');
  glassGrad.addColorStop(0.5, 'rgba(181, 131, 245, 0.15)');
  glassGrad.addColorStop(1, 'rgba(168, 212, 238, 0.2)');
  ctx.strokeStyle = glassGrad;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Left highlight reflection
  ctx.save();
  ctx.beginPath();
  const hlX = getJarLeftX(JAR.bodyTop + 40) + 12;
  ctx.moveTo(hlX, JAR.bodyTop + 30);
  ctx.quadraticCurveTo(hlX - 8, (JAR.bodyTop + JAR.bodyBottom) / 2, hlX + 5, JAR.bodyBottom - 40);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Small top-right highlight
  ctx.save();
  ctx.beginPath();
  const hrX = getJarRightX(JAR.bodyTop + 50) - 14;
  ctx.moveTo(hrX, JAR.bodyTop + 45);
  ctx.lineTo(hrX + 2, JAR.bodyTop + 80);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Frosted glass overlay
  ctx.save();
  buildJarPath(ctx);
  ctx.clip();
  const frostGrad = ctx.createLinearGradient(0, JAR.bodyTop, 0, JAR.bodyBottom);
  frostGrad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
  frostGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
  frostGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)');
  ctx.fillStyle = frostGrad;
  ctx.fillRect(0, 0, JAR_W, JAR_H);
  ctx.restore();
}

function drawLid(ctx) {
  const cx = JAR_W / 2;
  const lidY = JAR.neckTop - 2;
  const lidW = JAR.neckW * 2 + 20;
  const lidH = 22;
  const lidR = 8;

  // Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(139, 90, 43, 0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  // Cork/wooden lid
  const lidGrad = ctx.createLinearGradient(cx - lidW / 2, lidY, cx + lidW / 2, lidY);
  lidGrad.addColorStop(0, '#deb887');
  lidGrad.addColorStop(0.3, '#f0d4a0');
  lidGrad.addColorStop(0.5, '#f5deb3');
  lidGrad.addColorStop(0.7, '#f0d4a0');
  lidGrad.addColorStop(1, '#d2a970');
  ctx.fillStyle = lidGrad;

  ctx.beginPath();
  const lx = cx - lidW / 2, ly = lidY - lidH;
  ctx.moveTo(lx + lidR, ly);
  ctx.lineTo(lx + lidW - lidR, ly);
  ctx.arcTo(lx + lidW, ly, lx + lidW, ly + lidR, lidR);
  ctx.lineTo(lx + lidW, ly + lidH - lidR);
  ctx.arcTo(lx + lidW, ly + lidH, lx + lidW - lidR, ly + lidH, lidR);
  ctx.lineTo(lx + lidR, ly + lidH);
  ctx.arcTo(lx, ly + lidH, lx, ly + lidH - lidR, lidR);
  ctx.lineTo(lx, ly + lidR);
  ctx.arcTo(lx, ly, lx + lidR, ly, lidR);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Wood grain lines
  ctx.save();
  ctx.strokeStyle = 'rgba(139, 90, 43, 0.15)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const gy = lidY - lidH + 5 + i * 6;
    ctx.beginPath();
    ctx.moveTo(cx - lidW / 2 + 8, gy);
    ctx.lineTo(cx + lidW / 2 - 8, gy);
    ctx.stroke();
  }
  ctx.restore();

  // Lid knob
  ctx.save();
  ctx.fillStyle = '#c8956e';
  ctx.beginPath();
  ctx.ellipse(cx, lidY - lidH - 4, 12, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(cx - 3, lidY - lidH - 6, 4, 2, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function buildJarPath(ctx) {
  const cx = JAR_W / 2;
  ctx.beginPath();

  // Neck left
  ctx.moveTo(cx - JAR.neckW, JAR.neckTop);
  ctx.lineTo(cx - JAR.neckW, JAR.bodyTop);

  // Left curve down
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = JAR.bodyTop + t * (JAR.bodyBottom - JAR.bodyTop);
    ctx.lineTo(getJarLeftX(y), y);
  }

  // Bottom
  ctx.lineTo(getJarRightX(JAR.bodyBottom), JAR.bodyBottom);

  // Right curve up
  for (let i = steps; i >= 0; i--) {
    const t = i / steps;
    const y = JAR.bodyTop + t * (JAR.bodyBottom - JAR.bodyTop);
    ctx.lineTo(getJarRightX(y), y);
  }

  // Neck right
  ctx.lineTo(cx + JAR.neckW, JAR.neckTop);
  ctx.closePath();
}

function drawEmojis(ctx) {
  const now = performance.now();

  // Clip to jar interior
  ctx.save();
  buildJarPath(ctx);
  ctx.clip();

  emojiBodies.forEach(item => {
    const { body, emoji, size } = item;
    const elapsed = now - item.spawnTime;

    // Fade in
    item.alpha = Math.min(1, elapsed / 300);

    ctx.save();
    ctx.globalAlpha = item.alpha;
    ctx.translate(body.position.x, body.position.y);
    ctx.rotate(body.angle);
    ctx.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  });

  ctx.restore();
}

/**
 * Called from stats.js to update the jar with current month data
 */
export function updateMoodJar() {
  if (!document.getElementById('moodJarCanvas')) return; // Guard clause to prevent running when canvas is removed
  const currentMonthStr = `${state.calYear}-${String(state.calMonth + 1).padStart(2, '0')}`;
  const monthEntries = state.entries.filter(e => e.date.startsWith(currentMonthStr));

  // Build moodData from entries
  const counts = {};
  monthEntries.forEach(e => {
    const emoji = MOODS[e.mood]?.emoji;
    if (emoji) counts[emoji] = (counts[emoji] || 0) + 1;
  });

  const moodData = Object.entries(counts).map(([emoji, count]) => ({ emoji, count }));

  // Update top mood display
  const moodCounts = {};
  monthEntries.forEach(e => moodCounts[e.mood] = (moodCounts[e.mood] || 0) + 1);
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  const topEmojiEl = document.getElementById('topMoodEmoji');
  const topLabelEl = document.getElementById('topMoodLabel');
  if (topMood && MOODS[topMood[0]]) {
    if (topEmojiEl) topEmojiEl.textContent = MOODS[topMood[0]].emoji;
    if (topLabelEl) topLabelEl.textContent = `${MOODS[topMood[0]].label} (${topMood[1]} lần)`;
  } else {
    if (topEmojiEl) topEmojiEl.textContent = '✨';
    if (topLabelEl) topLabelEl.textContent = 'Bắt đầu viết để tích lũy hũ nhé!';
  }

  initMoodJar();
  setTimeout(() => fillJar(moodData), 300);
}

export function destroyMoodJar() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (pourTimer) clearInterval(pourTimer);
  if (engine) { Engine.clear(engine); engine = null; }
  emojiBodies = [];
}
