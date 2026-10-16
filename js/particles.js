/* ==========================================================================
   CHROMA MEMORIES 17 — partículas de luz
   Canvas fixo atrás do conteúdo. Poucas partículas, sprites pré-desenhados,
   30 fps em telas de toque, pausa com a aba oculta, com diálogos abertos ou
   com movimento reduzido. As cores acompanham a paleta de cada cena.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.Chroma;
  var doc = document;
  var canvas = doc.querySelector('[data-particles]');
  if (!C || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  /* Paletas por cena — sem laranja; vermelho só como rosa-rubi, sempre
     longe de amarelos (que aparecem apenas como luz pálida). */
  var PALETTES = {
    abertura: ['#ffffff', '#bfe9ff', '#5fe0ff', '#8b7bff', '#d24dff', '#ff7fd0'],
    memorias: ['#ffffff', '#cfe8ff', '#7ff5d8', '#3ddc97', '#5fe0ff', '#b9a3ff'],
    filme:    ['#ffffff', '#cfd6e8', '#9fc0ff', '#4d7bff', '#7fa7ff', '#ff6f9f'],
    melhores: ['#ffffff', '#5fe0ff', '#ff6fd0', '#b48bff', '#fff3b8', '#d9c6ff'],
    final:    ['#ffffff', '#5fe0ff', '#7ff5d8', '#b48bff', '#ff7fd0', '#fff6b0']
  };

  var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
  var FRAME_MS = touch ? 1000 / 30 : 0;

  var W = 0, H = 0, DPR = 1;
  var parts = [];
  var palette = PALETTES[C.scene.current()] || PALETTES.abertura;
  var shifting = false, shiftTimer = 0;
  var running = false, rafId = 0, last = 0;
  var dialogsOpen = false;
  var sprites = {};
  var meteors = [], nextMeteor = 0;

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function sprite(color) {
    if (sprites[color]) return sprites[color];
    var s = doc.createElement('canvas');
    s.width = s.height = 64;
    var g = s.getContext('2d');
    var grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, rgba(color, 1));
    grd.addColorStop(0.16, rgba(color, 0.85));
    grd.addColorStop(0.4, rgba(color, 0.2));
    grd.addColorStop(1, rgba(color, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
    sprites[color] = s;
    return s;
  }

  function pick() { return palette[(Math.random() * palette.length) | 0]; }

  function spawn(p, anywhere) {
    var bokeh = Math.random() < 0.09;
    p.z = 0.25 + Math.random() * 0.75;
    p.bokeh = bokeh;
    p.r = bokeh ? 6 + Math.random() * 16 : (0.5 + Math.random() * 1.5) * (0.6 + p.z * 0.6);
    p.x = Math.random() * W;
    p.y = anywhere ? Math.random() * H : H + 20 + Math.random() * 60;
    p.vx = (Math.random() - 0.5) * 0.012;
    p.vy = -(0.006 + Math.random() * 0.02) * (0.4 + p.z);
    p.tw = Math.random() * Math.PI * 2;
    p.ts = 0.0006 + Math.random() * 0.0016;
    p.a = bokeh ? 0.05 + Math.random() * 0.08 : 0.35 + Math.random() * 0.55;
    p.c = pick();
    return p;
  }

  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    /* Barras do navegador no celular mudam só a altura: não recria tudo. */
    if (w === W && Math.abs(h - H) < 140 && parts.length) return;
    W = w;
    H = h;
    DPR = Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    var target = Math.round(Math.max(26, Math.min(touch ? 52 : 110, (W * H) / 13000)));
    while (parts.length < target) parts.push(spawn({}, true));
    if (parts.length > target) parts.length = target;
    if (!running) draw(0);
  }

  /* Estrelas cadentes: de vez em quando, um risco de luz atravessa o céu. */
  function spawnMeteor() {
    var fromLeft = Math.random() < 0.5;
    var angle = (fromLeft ? 24 : 156) + (Math.random() * 14 - 7);
    var rad = angle * Math.PI / 180;
    var speed = 0.85 + Math.random() * 0.6;
    meteors.push({
      x: fromLeft ? Math.random() * W * 0.55 : W * 0.45 + Math.random() * W * 0.55,
      y: Math.random() * H * 0.38,
      vx: Math.cos(rad) * speed,
      vy: Math.sin(rad) * speed,
      len: 110 + Math.random() * 150,
      life: 0,
      ttl: 650 + Math.random() * 550,
      tint: pick()
    });
  }

  function drawMeteors(dt, now) {
    if (dt) {
      if (!nextMeteor) nextMeteor = now + 2500 + Math.random() * 3000;
      if (now >= nextMeteor) {
        spawnMeteor();
        nextMeteor = now + 4200 + Math.random() * 6500;
      }
    }
    for (var i = meteors.length - 1; i >= 0; i--) {
      var m = meteors[i];
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.life += dt;
      var k = m.life / m.ttl;
      if (k >= 1) { meteors.splice(i, 1); continue; }
      var alpha = k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8;
      var sp = Math.sqrt(m.vx * m.vx + m.vy * m.vy) || 1;
      var tx = m.x - (m.vx / sp) * m.len, ty = m.y - (m.vy / sp) * m.len;
      var g = ctx.createLinearGradient(m.x, m.y, tx, ty);
      g.addColorStop(0, rgba('#ffffff', 0.9 * alpha));
      g.addColorStop(0.25, rgba(m.tint, 0.45 * alpha));
      g.addColorStop(1, rgba(m.tint, 0));
      ctx.globalAlpha = 1;
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(m.x, m.y);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.drawImage(sprite('#ffffff'), m.x - 7, m.y - 7, 14, 14);
    }
  }

  function draw(dt, now) {
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    var sy = window.pageYOffset || 0;
    var span = H + 80;
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (dt) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.tw += p.ts * dt;
        if (p.y < -40) spawn(p, false);
        if (p.x < -40) p.x = W + 30;
        else if (p.x > W + 40) p.x = -30;
        if (shifting && Math.random() < 0.025) p.c = pick();
      }
      /* Profundidade: partículas próximas se movem mais com a rolagem. */
      var y = p.y - ((sy * p.z * 0.12) % span);
      if (y < -40) y += span;
      var twinkle = p.bokeh ? 1 : 0.55 + 0.45 * Math.sin(p.tw);
      var d = p.r * (p.bokeh ? 2.2 : 5.5);
      ctx.globalAlpha = p.a * twinkle;
      ctx.drawImage(sprite(p.c), p.x - d / 2, y - d / 2, d, d);
    }
    if (dt || meteors.length) drawMeteors(dt, now || 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(t) {
    if (!running) return;
    rafId = window.requestAnimationFrame(frame);
    if (!last) last = t;
    var dt = t - last;
    if (FRAME_MS && dt < FRAME_MS - 2) return;
    last = t;
    draw(Math.min(dt, 64), t);
  }

  function start() {
    if (running || doc.hidden || dialogsOpen || C.motion.reduced() || !window.requestAnimationFrame) return;
    running = true;
    last = 0;
    rafId = window.requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = 0;
  }

  doc.addEventListener('visibilitychange', function () {
    if (doc.hidden) stop();
    else start();
  });

  C.motion.onChange(function (isReduced) {
    if (isReduced) { stop(); draw(0); }
    else start();
  });

  C.modal.onChange(function (open) {
    dialogsOpen = open;
    if (open) stop();
    else start();
  });

  C.scene.onChange(function (name) {
    palette = PALETTES[name] || palette;
    shifting = true;
    clearTimeout(shiftTimer);
    shiftTimer = setTimeout(function () { shifting = false; }, 3500);
    if (!running) {
      parts.forEach(function (p) { p.c = pick(); });
      draw(0);
    }
  });

  /* Com movimento reduzido, o céu fica parado mas acompanha a rolagem. */
  window.addEventListener('scroll', function () {
    if (!running) C.raf(function () { draw(0); });
  }, { passive: true });

  window.addEventListener('resize', C.debounce(resize, 160));
  resize();
  start();
})();
