/* ==========================================================================
   CHROMA MEMORIES 17 — visualização ampliada (lightbox)
   Abre a partir da miniatura (zoom com recorte sincronizado), navega por
   setas, teclado (← → Home End, Esc fecha) e gesto de deslizar no celular.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.Chroma;
  var doc = document;
  var dlg = doc.querySelector('[data-lightbox]');
  if (!C || !dlg) return;

  /* A imagem é criada aqui (o HTML não deve ter <img> sem endereço). */
  var figure = dlg.querySelector('[data-lightbox-figure]');
  var img = C.el('img', { class: 'lightbox__img', alt: '', draggable: 'false' });
  figure.insertBefore(img, figure.firstChild);
  var countEl = dlg.querySelector('[data-lightbox-count]');
  var textEl = dlg.querySelector('[data-lightbox-text]');
  var stage = dlg.querySelector('[data-lightbox-stage]');
  var btnPrev = dlg.querySelector('[data-lightbox-prev]');
  var btnNext = dlg.querySelector('[data-lightbox-next]');
  var btnClose = dlg.querySelector('[data-lightbox-close]');

  /* Texto completo para leitores de tela ("Fotografia 3 de 12"). */
  var srEl = C.el('span', { class: 'sr-only' });
  if (countEl) {
    countEl.setAttribute('aria-hidden', 'true');
    countEl.parentNode.insertBefore(srEl, countEl.nextSibling);
  }

  var items = [];
  var index = 0;
  var label = 'Fotografia';
  var isOpen = false;
  var closing = false;
  var busy = false;
  var EASE_OUT = 'cubic-bezier(.16, 1, .3, 1)';
  var EASE_CINE = 'cubic-bezier(.7, 0, .18, 1)';

  function canAnimate() { return !!img.animate && !C.motion.reduced(); }

  function wrap(i) { return (i % items.length + items.length) % items.length; }

  function whenReady(cb) {
    var called = false;
    function go() { if (!called) { called = true; cb(); } }
    function decode() {
      if (img.decode) img.decode().then(go, go);
      else go();
    }
    if (img.complete && img.naturalWidth) { decode(); return; }
    var onLoad = function () { cleanup(); decode(); };
    var onError = function () { cleanup(); go(); };
    function cleanup() {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
    }
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
    setTimeout(function () { cleanup(); go(); }, 5000);
  }

  function setContent() {
    var it = items[index];
    var total = items.length;
    img.src = it.src;
    img.alt = it.alt || (label + ' ' + (index + 1) + ' de ' + total);
    if (countEl) countEl.textContent = C.pad2(index + 1) + ' / ' + C.pad2(total);
    srEl.textContent = label + ' ' + (index + 1) + ' de ' + total + (it.caption ? ': ' : '');
    if (textEl) textEl.textContent = it.caption || '';
    dlg.style.setProperty('--lb-rgb', it.glow || 'var(--violet-rgb)');
  }

  function preload(i) {
    if (items.length < 2) return;
    var it = items[wrap(i)];
    if (it && !it._preloaded) {
      it._preloaded = new Image();
      it._preloaded.decoding = 'async';
      it._preloaded.src = it.src;
    }
  }

  function visible(rect) {
    return rect && rect.width > 0 && rect.bottom > 0 && rect.top < window.innerHeight &&
      rect.right > 0 && rect.left < window.innerWidth;
  }

  /* Transformação que faz a imagem ampliada coincidir com a miniatura
     (inclusive o recorte de object-fit: cover e o ponto de foco). */
  function flipFrames(it) {
    var origin = it.origin;
    if (!origin || !doc.contains(origin)) return null;
    var from = origin.getBoundingClientRect();
    var to = img.getBoundingClientRect();
    if (!visible(from) || !to.width || !to.height) return null;
    var s = Math.max(from.width / to.width, from.height / to.height);
    var cw = Math.max(0, to.width - from.width / s);
    var ch = Math.max(0, to.height - from.height / s);
    var f = C.parseFocus(it.focus);
    var left = cw * f.x, right = cw - left, top = ch * f.y, bottom = ch - top;
    var dx = (from.left + from.width / 2) - (to.left + to.width / 2) - s * (left - right) / 2;
    var dy = (from.top + from.height / 2) - (to.top + to.height / 2) - s * (top - bottom) / 2;
    return [
      {
        transform: 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px) scale(' + s.toFixed(4) + ')',
        clipPath: 'inset(' + top.toFixed(1) + 'px ' + right.toFixed(1) + 'px ' + bottom.toFixed(1) + 'px ' + left.toFixed(1) + 'px)'
      },
      { transform: 'translate(0px, 0px) scale(1)', clipPath: 'inset(0px 0px 0px 0px)' }
    ];
  }

  function animateIn() {
    if (!canAnimate()) return;
    var frames = flipFrames(items[index]);
    if (frames) {
      img.animate(frames, { duration: 680, easing: EASE_CINE });
    } else {
      img.animate([
        { opacity: 0, transform: 'scale(.94)' },
        { opacity: 1, transform: 'scale(1)' }
      ], { duration: 520, easing: EASE_OUT });
    }
  }

  function open(list, start, opts) {
    if (!list || !list.length) return;
    items = list;
    index = Math.max(0, Math.min(list.length - 1, start || 0));
    label = (opts && opts.label) || 'Fotografia';
    isOpen = true;
    closing = false;
    busy = false;
    if (img.getAnimations) img.getAnimations().forEach(function (a) { a.cancel(); });
    img.style.transform = '';
    dlg.classList.toggle('is-single', items.length < 2);
    img.style.opacity = '0';
    setContent();
    C.modal.open(dlg, {
      returnFocus: items[index].origin,
      onRequestClose: close,
      onClosed: function () {
        isOpen = false;
        closing = false;
        if (img.getAnimations) img.getAnimations().forEach(function (a) { a.cancel(); });
        img.style.opacity = '';
        img.style.transform = '';
        img.removeAttribute('src');
      }
    });
    whenReady(function () {
      if (!isOpen) return;
      img.style.opacity = '';
      animateIn();
    });
    preload(index + 1);
    preload(index - 1);
  }

  function close() {
    if (!isOpen || closing) return;
    closing = true;
    if (canAnimate()) {
      var frames = flipFrames(items[index]);
      if (frames) {
        img.animate(frames.slice().reverse(), { duration: 460, easing: EASE_CINE, fill: 'forwards' });
      } else {
        img.animate([
          { opacity: 1, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(.96)' }
        ], { duration: 320, easing: EASE_OUT, fill: 'forwards' });
      }
    }
    C.modal.close(dlg, 430);
  }

  function show(next, dir) {
    if (busy || next === index) return;
    busy = true;
    var swap = function () {
      index = next;
      setContent();
      C.modal.setReturnFocus(dlg, items[index].origin);
      whenReady(function () {
        img.style.opacity = '';
        if (canAnimate()) {
          img.animate([
            { opacity: 0, transform: 'translateX(' + (dir * 36) + 'px)' },
            { opacity: 1, transform: 'translateX(0px)' }
          ], { duration: 460, easing: EASE_OUT });
        }
        busy = false;
      });
      preload(index + dir);
    };
    if (!canAnimate()) { swap(); return; }
    var out = img.animate([
      { opacity: 1, transform: 'translateX(0px)' },
      { opacity: 0, transform: 'translateX(' + (-dir * 36) + 'px)' }
    ], { duration: 190, easing: 'cubic-bezier(.4, 0, 1, 1)', fill: 'forwards' });
    out.onfinish = function () {
      img.style.opacity = '0';
      out.cancel();
      swap();
    };
  }

  function go(delta) {
    if (items.length < 2) return;
    show(wrap(index + delta), delta > 0 ? 1 : -1);
  }

  if (btnPrev) btnPrev.addEventListener('click', function () { go(-1); });
  if (btnNext) btnNext.addEventListener('click', function () { go(1); });
  if (btnClose) btnClose.addEventListener('click', close);

  dlg.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'Home') { e.preventDefault(); show(0, -1); }
    else if (e.key === 'End') { e.preventDefault(); show(items.length - 1, 1); }
  });

  /* Clique fora da imagem fecha. */
  var swiped = false;
  stage.addEventListener('click', function (e) {
    if (swiped) { swiped = false; return; }
    if (e.target === stage || (e.target.classList && e.target.classList.contains('lightbox__figure'))) close();
  });

  /* Deslizar: lados navegam, para baixo fecha. */
  var sx = 0, sy = 0, pid = null;
  stage.addEventListener('pointerdown', function (e) {
    swiped = false;
    if (e.pointerType === 'mouse' || pid !== null) { pid = null; return; }
    pid = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
  });
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerId !== pid || busy || C.motion.reduced()) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > Math.abs(dy)) img.style.transform = 'translateX(' + (dx * 0.35).toFixed(1) + 'px)';
    else if (dy > 0) img.style.transform = 'translateY(' + (dy * 0.3).toFixed(1) + 'px)';
  });
  function endSwipe(e, cancelled) {
    if (e.pointerId !== pid) return;
    pid = null;
    img.style.transform = '';
    if (cancelled) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2) { swiped = true; go(dx < 0 ? 1 : -1); }
    else if (dy > 90 && dy > Math.abs(dx) * 1.2) { swiped = true; close(); }
  }
  stage.addEventListener('pointerup', function (e) { endSwipe(e, false); });
  stage.addEventListener('pointercancel', function (e) { endSwipe(e, true); });

  C.lightbox = { open: open, close: close };
})();
