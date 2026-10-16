/* ==========================================================================
   CHROMA MEMORIES 17 — fogos de luz do encerramento
   Foguetes sobem e explodem em faíscas com rastro. Cada explosão usa uma
   família de cor da paleta (nunca laranja). Só roda enquanto há faíscas,
   para ao sair da tela e não acontece com movimento reduzido.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.Chroma;
  var doc = document;
  var canvas = doc.querySelector('[data-fireworks]');
  if (!C || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var section = canvas.parentNode;
  var touch = window.matchMedia && window.matchMedia('(hover: none)').matches;
  var PALETTES = [
    ['#ffffff', '#9ff3ff', '#2ee6ff'],
    ['#ffffff', '#d9c6ff', '#8b5cff'],
    ['#ffffff', '#ffb6dc', '#ff2bd6'],
    ['#ffffff', '#a6ffd9', '#14c98a'],
    ['#fffdf0', '#f4e7a1', '#ffffff'],
    ['#ffffff', '#9fc0ff', '#3d6bff']
  ];
  var GRAVITY = 0.00011;
  var W = 0, H = 0;
  var rockets = [], sparks = [];
  var running = false, last = 0, visible = false;
  var sprites = {};

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }

  function sprite(color) {
    if (sprites[color]) return sprites[color];
    var s = doc.createElement('canvas');
    s.width = s.height = 32;
    var g = s.getContext('2d');
    var grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
    grd.addColorStop(0, rgba(color, 1));
    grd.addColorStop(0.25, rgba(color, 0.75));
    grd.addColorStop(1, rgba(color, 0));
    g.fillStyle = grd;
    g.fillRect(0, 0, 32, 32);
    sprites[color] = s;
    return s;
  }

  function resize() {
    var r = section.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, touch ? 1.5 : 2);
    W = r.width;
    H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function launch(x, targetY, palette, delay) {
    rockets.push({
      x: x,
      y: H + 10,
      vx: (Math.random() - 0.5) * 0.04,
      vy: -(0.85 + Math.random() * 0.3),
      targetY: targetY,
      palette: palette,
      wait: delay || 0
    });
  }

  function burst(x, y, palette) {
    var count = touch ? 70 : 120;
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 0.06 + Math.pow(Math.random(), 0.6) * 0.24;
      sparks.push({
        x: x,
        y: y,
        px: x,
        py: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        ttl: 1100 + Math.random() * 1000,
        color: palette[(Math.random() * palette.length) | 0],
        size: 1 + Math.random() * 1.5,
        twinkle: Math.random() < 0.35
      });
    }
  }

  function step(dt) {
    /* Rastro: apaga o quadro anterior aos poucos. */
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,' + Math.min(0.5, 0.012 * dt) + ')';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';

    for (var r = rockets.length - 1; r >= 0; r--) {
      var k = rockets[r];
      if (k.wait > 0) { k.wait -= dt; continue; }
      k.x += k.vx * dt;
      k.y += k.vy * dt;
      ctx.globalAlpha = 0.9;
      ctx.drawImage(sprite('#ffffff'), k.x - 5, k.y - 5, 10, 10);
      ctx.globalAlpha = 0.35;
      ctx.drawImage(sprite(k.palette[2]), k.x - 9, k.y + 4, 18, 18);
      if (k.y <= k.targetY) {
        burst(k.x, k.y, k.palette);
        rockets.splice(r, 1);
      }
    }

    var drag = Math.pow(0.9982, dt);
    for (var i = sparks.length - 1; i >= 0; i--) {
      var p = sparks[i];
      p.life += dt;
      if (p.life >= p.ttl) { sparks.splice(i, 1); continue; }
      p.px = p.x;
      p.py = p.y;
      p.vx *= drag;
      p.vy = p.vy * drag + GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      var fade = 1 - p.life / p.ttl;
      var a = fade * (p.twinkle ? 0.55 + 0.45 * Math.sin(p.life * 0.05) : 1);
      ctx.globalAlpha = a * 0.55;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.px, p.py);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.globalAlpha = a;
      var d = p.size * 5;
      ctx.drawImage(sprite(p.color), p.x - d / 2, p.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function frame(t) {
    if (!running) return;
    var dt = last ? Math.min(48, t - last) : 16;
    last = t;
    step(dt);
    if (rockets.length || sparks.length) {
      window.requestAnimationFrame(frame);
    } else {
      running = false;
      ctx.clearRect(0, 0, W, H);
      /* Camada vazia também custa: some até a próxima celebração. */
      canvas.style.visibility = 'hidden';
    }
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    canvas.style.visibility = 'visible';
    window.requestAnimationFrame(frame);
  }

  /* Celebração: uma sequência de foguetes em posições e cores variadas. */
  function celebrate(count) {
    var dedication = doc.querySelector('.finale__dedication');
    if (C.motion.reduced() || !window.requestAnimationFrame) {
      if (dedication) {
        dedication.classList.add('is-glowing');
        setTimeout(function () { dedication.classList.remove('is-glowing'); }, 1400);
      }
      return;
    }
    if (!W) resize();
    var n = count || 3;
    var used = Math.floor(Math.random() * PALETTES.length);
    var narrow = W < 700;
    var side = Math.random() < 0.5 ? 0 : 1;
    for (var i = 0; i < n; i++) {
      var palette = PALETTES[(used + i) % PALETTES.length];
      /* As explosões emolduram o título pelos lados, sem cobrir o texto. */
      var x = narrow
        ? W * (0.12 + Math.random() * 0.76)
        : W * (side ? 0.68 + Math.random() * 0.24 : 0.08 + Math.random() * 0.24);
      var y = H * (narrow ? 0.03 + Math.random() * 0.12 : 0.07 + Math.random() * 0.24);
      side = 1 - side;
      launch(x, y, palette, i * (260 + Math.random() * 240));
    }
    start();
  }

  window.addEventListener('resize', C.debounce(function () {
    if (!running) resize();
  }, 200));

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (!visible && running) {
        rockets.length = 0;
        sparks.length = 0;
      }
    }).observe(section);
  }

  C.fireworks = {
    celebrate: function (count) {
      if ('IntersectionObserver' in window && !visible) return;
      resize();
      celebrate(count);
    }
  };
})();
