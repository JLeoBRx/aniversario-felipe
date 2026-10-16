/* ==========================================================================
   CHROMA MEMORIES 17 — efeitos e microinterações
   - Faixas em movimento que reagem à velocidade e ao sentido da rolagem
   - Contagem animada de "17 anos em números"
   - Números-fantasma das cenas com parallax
   - Cortina cinematográfica ao saltar entre cenas pelo menu
   - Luz que acompanha o cursor, anel "Ampliar/Assistir" e botões magnéticos
   - Fotos que inclinam em 3D com brilho e deslizam dentro da moldura
   Tudo desliga com movimento reduzido; efeitos de ponteiro só com mouse.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.Chroma;
  var doc = document;
  var root = doc.documentElement;
  if (!C) return;

  var fine = !!(window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  function reduced() { return C.motion.reduced(); }

  /* ------------------------------------------------------------------------
     Faixas em movimento
     ------------------------------------------------------------------------ */
  var marquees = C.$$('[data-marquee]').map(function (el) {
    return { el: el, track: el.querySelector('.marquee__track'), anim: null, rate: 1, visible: false };
  });
  var scrollDir = 1, velocity = 0, lastScroll = window.pageYOffset || 0, mqLoop = false;

  /* Uma volta inteira da faixa é invisível (as duas metades são iguais).
     Rodando para trás, a animação não pode chegar ao tempo zero (ali ela
     termina e a faixa congela), então ganha voltas de folga. */
  function rewindRoom(anim) {
    var timing = anim.effect && anim.effect.getTiming ? anim.effect.getTiming() : null;
    var lap = timing && typeof timing.duration === 'number' ? timing.duration : 0;
    var t = anim.currentTime;
    if (!lap || typeof t !== 'number' || t >= lap * 20) return;
    try { anim.currentTime = t + lap * 100; } catch (e) { /* ignora */ }
  }

  function animationOf(mq) {
    if (mq.anim && mq.anim.playState !== 'idle') return mq.anim;
    if (!mq.track || !mq.track.getAnimations) return null;
    var list = mq.track.getAnimations();
    mq.anim = list.length ? list[0] : null;
    if (mq.anim && mq.anim.addEventListener) {
      mq.anim.addEventListener('finish', function () { rewindRoom(this); });
    }
    return mq.anim;
  }

  function marqueeFrame() {
    velocity *= 0.9;
    var moving = velocity > 0.05;
    marquees.forEach(function (mq) {
      if (!mq.visible) return;
      var anim = animationOf(mq);
      if (!anim) return;
      var target = scrollDir * (1 + Math.min(velocity, 60) * 0.11);
      mq.rate += (target - mq.rate) * 0.1;
      if (Math.abs(target - mq.rate) > 0.01) moving = true;
      if (Math.abs(mq.rate - (mq.applied || 0)) > 0.04) {
        mq.applied = mq.rate;
        try { anim.playbackRate = mq.rate; } catch (e) { /* ignora */ }
      }
      if (mq.rate < 0) rewindRoom(anim);
    });
    if (moving && !reduced()) C.raf(marqueeFrame);
    else mqLoop = false;
  }

  window.addEventListener('scroll', function () {
    var y = window.pageYOffset || 0;
    var delta = y - lastScroll;
    lastScroll = y;
    if (Math.abs(delta) > 0.5) scrollDir = delta > 0 ? 1 : -1;
    velocity = Math.min(80, velocity + Math.abs(delta) * 0.6);
    if (!mqLoop && !reduced() && marquees.length) { mqLoop = true; C.raf(marqueeFrame); }
  }, { passive: true });

  if ('IntersectionObserver' in window) {
    var mqObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var mq = entry.target._mq;
        mq.visible = entry.isIntersecting;
        mq.el.classList.toggle('is-paused', !entry.isIntersecting);
      });
    });
    marquees.forEach(function (mq) { mq.el._mq = mq; mqObserver.observe(mq.el); });
  } else {
    marquees.forEach(function (mq) { mq.visible = true; });
  }

  /* ------------------------------------------------------------------------
     17 anos em números — contagem animada
     ------------------------------------------------------------------------ */
  var numbers = doc.querySelector('[data-numbers]');
  if (numbers) {
    var counters = C.$$('[data-count]', numbers);
    var format = function (n) {
      try { return n.toLocaleString('pt-BR'); } catch (e) { return String(n); }
    };
    if (!reduced() && 'IntersectionObserver' in window) counters.forEach(function (n) { n.textContent = '0'; });
    C.onView(numbers, function () {
      counters.forEach(function (n, i) {
        var end = +n.getAttribute('data-count');
        if (reduced()) { n.textContent = format(end); return; }
        var duration = 1700 + i * 260, start = null;
        setTimeout(function () {
          (function tick(t) {
            if (start === null) start = t;
            var p = Math.min(1, (t - start) / duration);
            var eased = 1 - Math.pow(1 - p, 4);
            n.textContent = format(Math.round(end * eased));
            if (p < 1) C.raf(tick);
          })(window.performance ? window.performance.now() : Date.now());
        }, 250 + i * 160);
      });
    }, { margin: '0px 0px -18% 0px' });
  }

  /* ------------------------------------------------------------------------
     Números-fantasma das cenas
     ------------------------------------------------------------------------ */
  C.$$('[data-ghost]').forEach(function (g) { C.parallax(g, 0.16); });

  /* ------------------------------------------------------------------------
     Cortina cinematográfica: corte entre cenas com cartão de capítulo
     ------------------------------------------------------------------------ */
  var curtain = doc.querySelector('[data-curtain]');
  if (curtain && C.jump) {
    var plainJump = C.jump;
    var cardNo = curtain.querySelector('.curtain__no');
    var cardName = curtain.querySelector('.curtain__name');
    var LABELS = {
      abertura: ['Cena 01', 'Abertura'],
      memorias: ['Cena 02', 'Memórias'],
      filme: ['Cena 03', 'O filme'],
      'os-melhores': ['Cena 04', 'Os melhores'],
      final: ['Cena 05', 'Final']
    };
    var cutting = false;
    C.jump = function (hash, opts) {
      var id = String(hash || '').replace(/^#/, '');
      var target = id ? doc.getElementById(id) : null;
      if (!target || cutting || reduced() || (opts && opts.instant)) { plainJump(hash, opts); return; }
      /* Perto o bastante: rolagem suave, sem corte. */
      if (Math.abs(target.getBoundingClientRect().top) < window.innerHeight * 1.15) { plainJump(hash, opts); return; }
      cutting = true;
      var label = LABELS[id] || ['', ''];
      cardNo.textContent = label[0];
      cardName.textContent = label[1];
      curtain.classList.remove('is-out');
      curtain.classList.add('is-active');
      C.nextFrame(function () { curtain.classList.add('is-in'); });
      setTimeout(function () {
        plainJump(hash, { instant: true });
        curtain.classList.remove('is-in');
        curtain.classList.add('is-out');
        setTimeout(function () {
          curtain.classList.remove('is-active', 'is-out');
          cutting = false;
        }, 720);
      }, 640);
    };
  }

  /* ------------------------------------------------------------------------
     Luz do cursor, anel sobre mídia e botões magnéticos (apenas mouse)
     ------------------------------------------------------------------------ */
  var MEDIA = 'button.shot__frame, button.honor__frame, button.clip, .feature__screen:not(.is-empty)';
  var MAGNETIC = '.btn, .round-btn, .play, .continue, .icon-btn, .menu-btn, .skip-intro';
  var TILT = 'button.shot__frame, button.honor__frame';

  if (fine) {
    root.classList.add('has-cursor');
    var glow = doc.querySelector('.cursor-glow');
    var ring = doc.querySelector('.cursor-ring');
    var ringLabel = ring ? ring.querySelector('.cursor-ring__label') : null;
    var px = 0, py = 0, gx = 0, gy = 0, rx = 0, ry = 0;
    var started = false, cursorLoop = false;
    var magnet = null, tilted = null;

    var cursorFrame = function () {
      gx += (px - gx) * 0.085;
      gy += (py - gy) * 0.085;
      rx += (px - rx) * 0.26;
      ry += (py - ry) * 0.26;
      if (glow) glow.style.transform = 'translate3d(' + gx.toFixed(1) + 'px,' + gy.toFixed(1) + 'px,0)';
      if (ring) {
        ring.style.setProperty('--rx', rx.toFixed(1) + 'px');
        ring.style.setProperty('--ry', ry.toFixed(1) + 'px');
      }
      if (Math.abs(px - gx) + Math.abs(py - gy) > 0.6 || Math.abs(px - rx) + Math.abs(py - ry) > 0.4) C.raf(cursorFrame);
      else cursorLoop = false;
    };

    var release = function (el) {
      if (el) el.style.translate = '';
    };

    var untilt = function (el) {
      if (!el) return;
      el.style.transform = '';
      el.classList.remove('is-tilting');
    };

    /* A seta do sistema só some sobre a mídia enquanto o anel está visível. */
    var ringOff = function () {
      if (ring) ring.classList.remove('is-on');
      root.classList.remove('ring-on');
    };

    doc.addEventListener('pointermove', function (e) {
      if (e.pointerType && e.pointerType !== 'mouse') { ringOff(); return; }
      if (reduced()) {
        if (glow) glow.classList.remove('is-on');
        ringOff();
        return;
      }
      px = e.clientX;
      py = e.clientY;
      if (!started) { started = true; gx = rx = px; gy = ry = py; }
      if (glow) glow.classList.add('is-on');
      if (!cursorLoop) { cursorLoop = true; C.raf(cursorFrame); }

      var target = e.target && e.target.closest ? e.target : null;

      /* Anel com rótulo sobre fotos e vídeos */
      var media = target ? target.closest(MEDIA) : null;
      if (ring) {
        if (media) {
          ringLabel.textContent = media.matches('button.clip, .feature__screen') ? 'Assistir' : 'Ampliar';
          ring.classList.add('is-on');
          root.classList.add('ring-on');
        } else {
          ringOff();
        }
      }

      /* Botões magnéticos */
      var mag = target ? target.closest(MAGNETIC) : null;
      if (magnet && magnet !== mag) release(magnet);
      magnet = mag;
      if (mag) {
        var r = mag.getBoundingClientRect();
        var dx = (px - (r.left + r.width / 2)) / r.width;
        var dy = (py - (r.top + r.height / 2)) / r.height;
        mag.style.translate = (dx * Math.min(14, r.width * 0.22)).toFixed(1) + 'px ' + (dy * Math.min(10, r.height * 0.3)).toFixed(1) + 'px';
      }

      /* Fotos que inclinam em direção ao ponteiro, com brilho */
      var frame = target ? target.closest(TILT) : null;
      if (frame && !frame.closest('.is-lit')) frame = null;
      if (tilted && tilted !== frame) untilt(tilted);
      tilted = frame;
      if (frame) {
        var b = frame.getBoundingClientRect();
        var x = (px - b.left) / b.width, y = (py - b.top) / b.height;
        frame.style.transform = 'perspective(900px) rotateX(' + ((0.5 - y) * 6).toFixed(2) + 'deg) rotateY(' + ((x - 0.5) * 8).toFixed(2) + 'deg)';
        var glare = frame.querySelector('.frame-glare');
        if (!glare) {
          glare = C.el('span', { class: 'frame-glare', 'aria-hidden': 'true' });
          frame.appendChild(glare);
        }
        glare.style.setProperty('--gx', (x * 100).toFixed(1) + '%');
        glare.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
        frame.classList.add('is-tilting');
      }
    }, { passive: true });

    doc.documentElement.addEventListener('pointerleave', function () {
      if (glow) glow.classList.remove('is-on');
      ringOff();
      release(magnet);
      magnet = null;
      untilt(tilted);
      tilted = null;
    });

    /* Diálogos abertos: o anel some para não ficar sobre a foto ampliada. */
    C.modal.onChange(function (open) {
      if (open) ringOff();
      if (open) { untilt(tilted); tilted = null; }
    });

    C.motion.onChange(function (isReduced) {
      if (!isReduced) return;
      release(magnet);
      magnet = null;
      untilt(tilted);
      tilted = null;
    });
  }

  /* ------------------------------------------------------------------------
     Fotos deslizam levemente dentro da moldura ao rolar (todas as telas)
     ------------------------------------------------------------------------ */
  var parallaxQueued = false;
  function frameParallax() {
    parallaxQueued = false;
    var frames = C.$$('.shot.is-lit button.shot__frame, .is-lit > button.honor__frame, .is-lit button.honor__frame');
    if (reduced()) {
      frames.forEach(function (f) { f.style.removeProperty('--ip'); });
      return;
    }
    var vh = window.innerHeight;
    var reads = frames.map(function (f) { return f.getBoundingClientRect(); });
    frames.forEach(function (f, i) {
      var r = reads[i];
      if (r.bottom < -50 || r.top > vh + 50) return;
      var offset = ((r.top + r.height / 2) - vh / 2) / vh;
      var max = r.height * 0.038;
      var shift = Math.max(-max, Math.min(max, -offset * max * 1.6));
      f.style.setProperty('--ip', shift.toFixed(1) + 'px');
    });
  }
  window.addEventListener('scroll', function () {
    if (!parallaxQueued) { parallaxQueued = true; C.raf(frameParallax); }
  }, { passive: true });
  C.motion.onChange(frameParallax);

  /* ------------------------------------------------------------------------
     Película do filme acompanha a rolagem dos cartões
     ------------------------------------------------------------------------ */
  var reelTrack = doc.querySelector('[data-reel]');
  var reelStrip = doc.querySelector('.reel__strip');
  if (reelTrack && reelStrip) {
    reelTrack.addEventListener('scroll', function () {
      reelStrip.style.setProperty('--strip-x', (-reelTrack.scrollLeft * 0.6).toFixed(0) + 'px');
    }, { passive: true });
  }

  /* ------------------------------------------------------------------------
     Botão "Celebrar"
     ------------------------------------------------------------------------ */
  var celebrateBtn = doc.querySelector('[data-celebrate]');
  if (celebrateBtn) {
    celebrateBtn.addEventListener('click', function () {
      if (C.fireworks) C.fireworks.celebrate(6);
    });
  }
})();
