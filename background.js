document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  if (!body) return;

  const reduceMotionQuery = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReducedMotion = !!(reduceMotionQuery && reduceMotionQuery.matches);

  let overlay = document.querySelector('.math-lines-overlay');
  let canvas = overlay ? overlay.querySelector('.math-lines-canvas') : null;

  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'math-lines-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    canvas = document.createElement('canvas');
    canvas.id = 'mathLinesCanvas';
    canvas.className = 'math-lines-canvas';
    overlay.appendChild(canvas);
    body.insertBefore(overlay, body.firstChild || null);
  } else if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'mathLinesCanvas';
    canvas.className = 'math-lines-canvas';
    overlay.appendChild(canvas);
  }

  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const enableCanvasButterfly = false;
  if (!enableCanvasButterfly) {
    return;
  }

  if (document.getElementById('butterfly')) {
    return;
  }

  const rippleSettings = {
    maxRadius: 520,
    duration: 7200,
    minLine: 0.8,
    maxLine: 1.6,
    minAlpha: 0.12,
    maxAlpha: 0.26,
    interval: 3400,
    maxSimultaneous: 5,
    initial: 3
  };

  const butterflySettings = {
    pathRadius: 0.18,
    pathSpeed: 0.000045,
    bobAmp: 20,
    bobSpeed: 0.00065,
    wingSpan: 44,
    wingBeat: 0.006,
    rippleOffset: 18
  };

  let ripples = [];
  let butterfly = null;
  let dpr = 1;
  let rafId = null;
  let lastFrameTime = 0;
  let lastRippleTime = 0;

  function sizeCanvas() {
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.floor(rect.width * ratio);
    canvas.height = Math.floor(rect.height * ratio);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    return ratio;
  }

  function readColor(varName, fallback) {
    const styles = getComputedStyle(document.documentElement);
    const value = styles.getPropertyValue(varName);
    return (value && value.trim()) || fallback;
  }

  function getPalette() {
    const fallback = readColor('--text', '#111');
    return {
      ripple: readColor('--ripple-ink', fallback),
      waterGlow: readColor('--water-glow', 'rgba(255,255,255,0.35)'),
      butterflyWing: readColor('--butterfly-wing', fallback),
      butterflyHighlight: readColor('--butterfly-highlight', fallback),
      butterflyBody: readColor('--butterfly-body', fallback),
      butterflyShadow: readColor('--butterfly-shadow', 'rgba(0,0,0,0.45)')
    };
  }

  function easeOutCubic(t) {
    const p = Math.max(0, Math.min(1, t));
    return 1 - Math.pow(1 - p, 3);
  }

  function spawnRipple(timestamp, offset = 0, x, y) {
    const start = timestamp - offset * rippleSettings.duration;
    const alpha = rippleSettings.minAlpha + Math.random() * (rippleSettings.maxAlpha - rippleSettings.minAlpha);
    const lineWidth = (rippleSettings.minLine + Math.random() * (rippleSettings.maxLine - rippleSettings.minLine)) * dpr;
    const ripple = {
      start,
      alpha,
      lineWidth,
      x: typeof x === 'number' ? x : canvas.width * 0.55,
      y: typeof y === 'number' ? y : canvas.height * 0.45
    };
    ripples.push(ripple);
    if (ripples.length > rippleSettings.maxSimultaneous) {
      ripples.shift();
    }
  }

  function createButterfly() {
    const w = canvas.width;
    const h = canvas.height;
    const range = Math.min(w, h) * butterflySettings.pathRadius;
    return {
      angle: Math.random() * Math.PI * 2,
      wingPhase: Math.random() * Math.PI * 2,
      x: w * 0.55,
      y: h * 0.45,
      prevX: null,
      prevY: null,
      range
    };
  }

  function updateButterfly(delta, timestamp) {
    const w = canvas.width;
    const h = canvas.height;
    const centerX = w * 0.55;
    const centerY = h * 0.46 + Math.sin(timestamp * 0.0003) * 12;
    butterfly.range = Math.min(w, h) * butterflySettings.pathRadius;
    butterfly.angle = (butterfly.angle + butterflySettings.pathSpeed * delta) % (Math.PI * 2);
    const targetX = centerX + Math.cos(butterfly.angle) * butterfly.range;
    const targetY = centerY + Math.sin(butterfly.angle * 0.85) * butterfly.range * 0.45 + Math.sin(timestamp * 0.001) * 10;
    butterfly.prevX = butterfly.x;
    butterfly.prevY = butterfly.y;
    butterfly.x = targetX;
    butterfly.y = targetY;
    butterfly.wingPhase += butterflySettings.wingBeat * delta;
  }

  function drawWaterGlow(palette, focusX, focusY) {
    const radius = Math.max(canvas.width, canvas.height) * 0.7;
    const gradient = ctx.createRadialGradient(focusX, focusY, radius * 0.05, focusX, focusY, radius);
    gradient.addColorStop(0, palette.waterGlow);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  function drawRipples(palette, timestamp, staticMode) {
    ctx.strokeStyle = palette.ripple;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (staticMode) {
      for (let i = 0; i < rippleSettings.initial; i++) {
        spawnRipple(0, Math.random());
      }
    }

    ripples = ripples.filter(ripple => {
      const progress = (timestamp - ripple.start) / rippleSettings.duration;
      if (progress >= 1) return false;
      const eased = easeOutCubic(progress);
      const radius = 20 * dpr + rippleSettings.maxRadius * eased;
      const fade = Math.max(0, 1 - progress);

      ctx.globalAlpha = ripple.alpha * fade;
      ctx.lineWidth = ripple.lineWidth * (1 + progress * 0.4);
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = Math.min(0.5, ripple.alpha * fade * 1.1);
      ctx.lineWidth = ripple.lineWidth * 0.45;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      return true;
    });
    ctx.globalAlpha = 1;
  }

  function drawWingPath(scale, spread, inner = false) {
    const span = butterflySettings.wingSpan * scale;
    const depth = span * (inner ? 0.85 : 1);
    ctx.beginPath();
    ctx.moveTo(0, -0.05 * span);
    ctx.bezierCurveTo(spread * -0.2 * span, -0.18 * span, spread * -0.42 * span, -0.32 * span, spread * -0.52 * depth, -0.52 * depth);
    ctx.bezierCurveTo(spread * -0.75 * depth, -0.88 * depth, spread * -0.45 * span, -1.35 * depth, spread * -0.12 * span, -1.28 * depth);
    ctx.bezierCurveTo(spread * -0.42 * span, -1.0 * depth, spread * -0.62 * depth, -0.6 * depth, spread * -0.35 * span, -0.28 * span);
    ctx.bezierCurveTo(spread * -0.28 * span, -0.17 * span, spread * -0.12 * span, -0.06 * span, 0, 0);
    ctx.closePath();
  }

  function drawWingDetails(palette, spread, span) {
    const spots = [
      { x: -0.55, y: -0.95, r: 0.045 },
      { x: -0.7, y: -0.75, r: 0.04 },
      { x: -0.52, y: -0.6, r: 0.035 },
      { x: -0.38, y: -0.42, r: 0.03 },
      { x: -0.28, y: -0.28, r: 0.027 }
    ];
    ctx.fillStyle = '#fefefe';
    spots.forEach(spot => {
      ctx.beginPath();
      ctx.ellipse(spread * spot.x * span, spot.y * span, spot.r * span, spot.r * span * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = palette.butterflyBody;
    ctx.lineWidth = 1 * dpr;
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.moveTo(0, -0.15 * span);
    ctx.bezierCurveTo(spread * -0.3 * span, -0.55 * span, spread * -0.35 * span, -0.85 * span, spread * -0.18 * span, -1.15 * span);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawButterfly(palette, staticMode) {
    const dx = (butterfly.x - (butterfly.prevX ?? butterfly.x)) || 0.0001;
    const dy = (butterfly.y - (butterfly.prevY ?? butterfly.y)) || 0;
    const heading = Math.atan2(dy, dx);
    const wingSpread = staticMode ? 0.9 : 0.95 + 0.03 * Math.sin(butterfly.wingPhase);

    ctx.save();
    ctx.translate(butterfly.x, butterfly.y);
    ctx.rotate(heading - Math.PI / 2);

    ctx.fillStyle = palette.butterflyShadow;
    ctx.globalAlpha = 0.42;
    ctx.beginPath();
    ctx.ellipse(0, butterflySettings.rippleOffset * 0.55, 30 * dpr, 12 * dpr, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = palette.butterflyBody;
    ctx.lineWidth = 1.5 * dpr;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -butterflySettings.wingSpan * 0.45);
    ctx.lineTo(0, butterflySettings.wingSpan * 0.4);
    ctx.stroke();

    ['left', 'right'].forEach(side => {
      const spread = side === 'left' ? -wingSpread : wingSpread;

      ctx.fillStyle = palette.butterflyBody;
      ctx.globalAlpha = 1;
      drawWingPath(1.0, spread);
      ctx.fill();

      ctx.fillStyle = palette.butterflyWing;
      ctx.globalAlpha = 0.92;
      drawWingPath(0.92, spread, true);
      ctx.fill();

      ctx.fillStyle = palette.butterflyHighlight;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.ellipse(spread * -0.25 * butterflySettings.wingSpan, -0.85 * butterflySettings.wingSpan, 7 * dpr, 11 * dpr, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.85;
      drawWingDetails(palette, spread, butterflySettings.wingSpan);
      ctx.globalAlpha = 1;
    });

    ctx.fillStyle = palette.butterflyBody;
    ctx.beginPath();
    ctx.ellipse(0, -butterflySettings.wingSpan * 0.38, 2.8 * dpr, 6 * dpr, 0, 0, Math.PI * 2);
    ctx.ellipse(0, -butterflySettings.wingSpan * 0.15, 3.2 * dpr, 6.8 * dpr, 0, 0, Math.PI * 2);
    ctx.ellipse(0, butterflySettings.wingSpan * 0.05, 2.4 * dpr, 5.8 * dpr, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.butterflyBody;
    ctx.lineWidth = 1 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, -butterflySettings.wingSpan * 0.5);
    ctx.quadraticCurveTo(-6 * dpr, -butterflySettings.wingSpan * 0.65, -3 * dpr, -butterflySettings.wingSpan * 0.75);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -butterflySettings.wingSpan * 0.5);
    ctx.quadraticCurveTo(6 * dpr, -butterflySettings.wingSpan * 0.65, 3 * dpr, -butterflySettings.wingSpan * 0.75);
    ctx.stroke();

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function paintFrame(timestamp, delta, staticMode) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const palette = getPalette();
    const focusX = butterfly?.x ?? canvas.width * 0.55;
    const focusY = butterfly?.y ?? canvas.height * 0.45;

    drawWaterGlow(palette, focusX, focusY);

    if (!staticMode) {
      if (timestamp - lastRippleTime > rippleSettings.interval) {
        spawnRipple(timestamp, 0, focusX, focusY + butterflySettings.rippleOffset);
        lastRippleTime = timestamp;
      }
    }

    drawRipples(palette, timestamp, staticMode);
    drawButterfly(palette, staticMode);
  }

  function animate(timestamp = 0) {
    const delta = lastFrameTime ? Math.min(100, timestamp - lastFrameTime) : 16;
    lastFrameTime = timestamp || 0;
    updateButterfly(delta, timestamp);
    paintFrame(timestamp, delta, false);
    rafId = requestAnimationFrame(animate);
  }

  function renderStillFrame() {
    paintFrame(0, 0, true);
  }

  function resetScene() {
    dpr = sizeCanvas();
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    ripples = [];
    butterfly = createButterfly();
    lastRippleTime = 0;
    lastFrameTime = 0;

    for (let i = 0; i < rippleSettings.initial; i++) {
      spawnRipple(0, Math.random(), butterfly.x, butterfly.y + butterflySettings.rippleOffset);
    }

    if (prefersReducedMotion) {
      renderStillFrame();
    } else {
      animate(0);
    }
  }

  resetScene();
  window.addEventListener('resize', resetScene);

  if (window.MutationObserver) {
    const themeObserver = new MutationObserver(() => resetScene());
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  if (reduceMotionQuery) {
    const handleMotionChange = () => {
      prefersReducedMotion = reduceMotionQuery.matches;
      resetScene();
    };
    if (typeof reduceMotionQuery.addEventListener === 'function') {
      reduceMotionQuery.addEventListener('change', handleMotionChange);
    } else if (typeof reduceMotionQuery.addListener === 'function') {
      reduceMotionQuery.addListener(handleMotionChange);
    }
  }
});
