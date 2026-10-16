/* ==========================================================================
   CHROMA MEMORIES 17 — abertura cinematográfica
   A coreografia vive no CSS (classe .intro-play). Aqui: câmera simulada
   (o 17 nasce no centro da tela e recua até seu lugar), pular/acelerar,
   rever a abertura e luz que acompanha o ponteiro.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.Chroma;
  var doc = document;
  var root = doc.documentElement;
  var hero = doc.getElementById('abertura');
  if (!C || !hero) return;

  var seventeen = hero.querySelector('[data-seventeen]');
  var skipBtn = hero.querySelector('[data-skip-intro]');
  var continueLink = hero.querySelector('[data-continue]');
  var lights = hero.querySelector('.opening__light');

  var TOTAL = 9400;          // mesma duração de --intro-total no CSS
  var FAST_FORWARD = 14;     // velocidade ao pular
  var state = 'idle';        // idle | playing | skipping | done
  var timers = [];
  var startWidth = window.innerWidth;

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }

  /* Câmera: mede a posição final do 17 e calcula de onde ele "nasce"
     (centro da tela, maior), para a animação intro-camera. */
  function measureCamera() {
    if (!seventeen) return;
    var r = seventeen.getBoundingClientRect();
    var vw = window.innerWidth, vh = window.innerHeight;
    if (!r.width || !r.height) return;
    var scale = Math.max(1, Math.min(1.3, (vw * 0.86) / r.width, (vh * 0.56) / r.height));
    seventeen.style.setProperty('--fx', (vw / 2 - (r.left + r.width / 2)).toFixed(1) + 'px');
    seventeen.style.setProperty('--fy', (vh / 2 - (r.top + r.height / 2)).toFixed(1) + 'px');
    seventeen.style.setProperty('--fs', scale.toFixed(3));
  }

  function play() {
    clearTimers();
    if (C.motion.reduced()) { finish(); return; }
    measureCamera();
    root.classList.remove('intro-pending', 'intro-done', 'particles-on');
    root.classList.add('intro-play');
    state = 'playing';
    startWidth = window.innerWidth;
    later(function () { root.classList.add('particles-on'); }, 600);
    later(finish, TOTAL + 250);
  }

  function finish() {
    clearTimers();
    var hadFocus = skipBtn && doc.activeElement === skipBtn;
    root.classList.remove('intro-pending', 'intro-play');
    root.classList.add('intro-done', 'particles-on');
    state = 'done';
    if (hadFocus && continueLink) {
      try { continueLink.focus({ preventScroll: true }); } catch (e) { continueLink.focus(); }
    }
  }

  /* "Pular abertura": acelera a coreografia inteira (como um avanço rápido
     de filme) em vez de cortar no seco. */
  function skip() {
    if (state !== 'playing') return;
    state = 'skipping';
    clearTimers();
    root.classList.add('particles-on');
    var sped = 0;
    if (typeof doc.getAnimations === 'function') {
      doc.getAnimations().forEach(function (anim) {
        var name = anim.animationName || '';
        if (name.indexOf('intro-') !== 0) return;
        try {
          if (anim.updatePlaybackRate) anim.updatePlaybackRate(FAST_FORWARD);
          else anim.playbackRate = FAST_FORWARD;
          sped++;
        } catch (e) { /* ignora */ }
      });
    }
    later(finish, sped ? Math.ceil(TOTAL / FAST_FORWARD) + 120 : 0);
  }

  if (skipBtn) skipBtn.addEventListener('click', skip);

  doc.addEventListener('keydown', function (e) {
    if ((e.key === 'Escape' || e.key === 'Esc') && state === 'playing' && !C.modal.isOpen()) skip();
  });

  /* A abertura nunca bloqueia o conteúdo: rolar a página acelera o final. */
  window.addEventListener('scroll', function () {
    if (state === 'playing' && (window.pageYOffset || 0) > window.innerHeight * 0.12) skip();
  }, { passive: true });

  window.addEventListener('resize', function () {
    if (state === 'playing' && Math.abs(window.innerWidth - startWidth) > 40) skip();
  });

  /* Pausa os loops de luz quando a abertura sai da tela (economia de bateria). */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      hero.classList.toggle('is-offscreen', !entries[0].isIntersecting);
    }).observe(hero);
  }

  /* Luzes acompanham o ponteiro com atraso suave (apenas mouse/trackpad). */
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine && lights) {
    var tx = 0, ty = 0, cx = 0, cy = 0, looping = false;
    var loop = function () {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      hero.style.setProperty('--mx', cx.toFixed(3));
      hero.style.setProperty('--my', cy.toFixed(3));
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) C.raf(loop);
      else looping = false;
    };
    hero.addEventListener('pointermove', function (e) {
      if (C.motion.reduced()) return;
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
      if (!looping) { looping = true; C.raf(loop); }
    });
  }

  /* Rever a abertura (botão do encerramento). */
  function scrollToTop(done) {
    if ((window.pageYOffset || 0) < 2) { done(); return; }
    try {
      window.scrollTo({ top: 0, behavior: C.motion.reduced() ? 'auto' : 'smooth' });
    } catch (e) {
      window.scrollTo(0, 0);
    }
    var started = Date.now();
    (function check() {
      if ((window.pageYOffset || 0) < 2 || Date.now() - started > 3000) { done(); return; }
      C.raf(check);
    })();
  }

  C.intro = {
    replay: function () {
      scrollToTop(function () {
        if (C.motion.reduced()) { finish(); return; }
        root.classList.remove('intro-done');
        root.classList.add('intro-pending');
        C.nextFrame(function () {
          play();
          if (skipBtn) { try { skipBtn.focus({ preventScroll: true }); } catch (e) { skipBtn.focus(); } }
        });
      });
    },
    skip: skip,
    state: function () { return state; }
  };

  var replayBtn = doc.querySelector('[data-replay]');
  if (replayBtn) replayBtn.addEventListener('click', C.intro.replay);

  /* Início: espera as fontes (no máximo 1,5 s) para o 17 nascer já desenhado. */
  function boot() {
    var atTop = (window.pageYOffset || 0) < 40;
    var pending = root.classList.contains('intro-pending');
    if (!pending || !atTop || C.motion.reduced()) { finish(); return; }

    var fontsReady = Promise.resolve();
    if (doc.fonts && doc.fonts.load) {
      fontsReady = Promise.all([
        doc.fonts.load('620 100px "Bodoni Moda"'),
        doc.fonts.load('italic 400 24px "Bodoni Moda"'),
        doc.fonts.load('800 24px "Archivo"')
      ]).catch(function () { /* segue com as fontes de reserva */ });
    }
    var timeout = new Promise(function (resolve) { setTimeout(resolve, 1500); });
    Promise.race([fontsReady, timeout]).then(function () {
      if ((window.pageYOffset || 0) > window.innerHeight * 0.3) { finish(); return; }
      play();
    });
  }
  boot();
})();
