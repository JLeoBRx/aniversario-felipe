/* ==========================================================================
   CHROMA MEMORIES 17 — "O filme dos melhores momentos"
   Filme principal com capa ampla + sequência de cartões. A reprodução só
   começa com o clique no play (nunca automaticamente). Ao fechar a sala de
   projeção o vídeo é pausado, o arquivo é desligado e o elemento removido.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.Chroma;
  var doc = document;
  var featureHost = doc.querySelector('[data-feature]');
  if (!C || !featureHost) return;

  var cfg = C.config;
  var el = C.el;
  var pad2 = C.pad2;

  var reelWrap = doc.querySelector('[data-reel-wrap]');
  var track = doc.querySelector('[data-reel]');
  var reelNav = reelWrap ? reelWrap.querySelector('.reel__nav') : null;
  var prevBtn = doc.querySelector('[data-reel-prev]');
  var nextBtn = doc.querySelector('[data-reel-next]');

  var dlg = doc.querySelector('[data-player]');
  var screen = dlg ? dlg.querySelector('[data-player-screen]') : null;
  var titleEl = dlg ? dlg.querySelector('[data-player-title]') : null;
  var errorEl = dlg ? dlg.querySelector('[data-player-error]') : null;
  var closeBtn = dlg ? dlg.querySelector('[data-player-close]') : null;

  var videos = cfg.videos;
  var mainIndex = -1;
  videos.some(function (v, i) { if (v.main) { mainIndex = i; return true; } return false; });
  if (mainIndex < 0 && videos.length) mainIndex = 0;
  var main = mainIndex >= 0 ? videos[mainIndex] : null;
  var others = videos.filter(function (v, i) { return i !== mainIndex; });

  /* ---------- Utilidades de mídia ---------- */
  function release(vid) {
    if (!vid) return;
    try { vid.pause(); } catch (e) { /* ignora */ }
    vid.removeAttribute('src');
    while (vid.firstChild) vid.removeChild(vid.firstChild);
    try { vid.load(); } catch (e) { /* ignora */ }
    if (vid.parentNode) vid.parentNode.removeChild(vid);
  }

  function withFrame(src, t) {
    return src.indexOf('#') === -1 ? src + '#t=' + t : src;
  }

  function playButton(label, disabled) {
    var btn = el(disabled ? 'span' : 'button', disabled
      ? { class: 'play play--disabled', 'aria-hidden': 'true' }
      : { class: 'play', type: 'button', 'aria-label': label });
    btn.appendChild(el('span', { class: 'play__ring', 'aria-hidden': 'true' }));
    btn.appendChild(el('span', { class: 'play__core', 'aria-hidden': 'true' }, [C.icon('i-play')]));
    return btn;
  }

  /* Miniatura: usa a capa (se houver) ou o próprio vídeo parado em 0,6 s,
     carregando só os metadados e só quando o cartão se aproxima da tela. */
  function mountThumb(card) {
    var v = card.video;
    C.onView(card.media, function () {
      if (v.poster) {
        var img = el('img', { alt: '', decoding: 'async' });
        img.addEventListener('error', function () {
          if (img.parentNode) img.parentNode.removeChild(img);
          mountVideoThumb(card);
        });
        img.src = v.poster;
        card.media.appendChild(img);
        probeMeta(card);
      } else {
        mountVideoThumb(card);
      }
    }, { margin: '400px 0px' });
  }

  function mountVideoThumb(card) {
    if (card.missing) return;
    var vid = doc.createElement('video');
    vid.muted = true;
    vid.defaultMuted = true;
    vid.playsInline = true;
    vid.preload = 'metadata';
    vid.setAttribute('muted', '');
    vid.setAttribute('playsinline', '');
    vid.setAttribute('preload', 'metadata');
    vid.setAttribute('tabindex', '-1');
    vid.setAttribute('aria-hidden', 'true');
    vid.setAttribute('disablepictureinpicture', '');
    vid.setAttribute('disableremoteplayback', '');
    vid.addEventListener('loadedmetadata', function () { onMeta(card, vid.duration, vid.videoWidth, vid.videoHeight); });
    vid.addEventListener('error', function () { release(vid); markMissing(card); });
    vid.src = withFrame(card.video.src, 0.6);
    card.media.appendChild(vid);
  }

  /* Com capa própria, um vídeo invisível lê só duração/formato e é liberado. */
  function probeMeta(card) {
    var vid = doc.createElement('video');
    vid.muted = true;
    vid.preload = 'metadata';
    vid.addEventListener('loadedmetadata', function () {
      onMeta(card, vid.duration, vid.videoWidth, vid.videoHeight);
      release(vid);
    });
    vid.addEventListener('error', function () { release(vid); markMissing(card); });
    vid.src = card.video.src;
  }

  function onMeta(card, duration, w, h) {
    var t = C.formatTime(duration);
    if (card.durEl) card.durEl.textContent = t;
    if (card.item && !card.video.format && w && h) {
      var vertical = h > w * 1.05;
      card.item.classList.toggle('reel__item--v', vertical);
      card.item.classList.toggle('reel__item--h', !vertical);
      if (card.metaEl) card.metaEl.textContent = vertical ? 'Vertical' : 'Horizontal';
      updateNav();
    }
  }

  function markMissing(card) {
    if (card.missing) return;
    card.missing = true;
    var ph = C.problemPlaceholder('video', card.isFeature ? 'Filme principal' : 'Vídeo ' + pad2(card.number), card.video.src);
    if (card.isFeature) {
      if (!cfg.placeholders) { featureHost.hidden = true; return; }
      card.screen.textContent = '';
      card.screen.classList.add('is-empty');
      card.screen.appendChild(ph);
      card.screen.appendChild(el('h3', { class: 'sr-only', id: 'feature-title', text: 'Filme principal: arquivo não encontrado' }));
      return;
    }
    if (!cfg.placeholders) {
      card.item.hidden = true;
      if (!track.querySelector('.reel__item:not([hidden])')) reelWrap.hidden = true;
      updateNav();
      return;
    }
    var box = el('div', { class: 'clip clip--empty' });
    var thumb = el('span', { class: 'clip__thumb' }, [ph]);
    box.appendChild(thumb);
    box.appendChild(el('span', { class: 'clip__title', text: card.title }));
    box.appendChild(el('span', { class: 'clip__meta', text: 'Vídeo indisponível' }));
    card.item.textContent = '';
    card.item.appendChild(box);
  }

  /* ---------- Filme principal ---------- */
  function renderFeature() {
    var art = el('article', { class: 'feature', 'aria-labelledby': 'feature-title' });
    var screenEl = el('div', { class: 'feature__screen' });
    art.appendChild(screenEl);

    if (!main) {
      if (!cfg.placeholders) { featureHost.hidden = true; return; }
      screenEl.classList.add('is-empty');
      screenEl.appendChild(C.placeholder({
        kind: 'video',
        label: 'Filme principal · capa ampla',
        title: 'Espaço reservado para o vídeo principal',
        hint: 'assets/videos/',
        hintPrefix: 'Adicione o MP4 em '
      }));
      art.appendChild(el('h3', { class: 'sr-only', id: 'feature-title', text: 'Filme principal (espaço reservado)' }));
      featureHost.appendChild(art);
      return;
    }

    var title = main.title || 'Filme principal';
    var media = el('div', { class: 'feature__media' });
    var dur = el('span', { class: 'feature__dur' });
    var play = playButton('Assistir: ' + title);
    screenEl.appendChild(media);
    screenEl.appendChild(el('div', { class: 'feature__shade', 'aria-hidden': 'true' }));
    screenEl.appendChild(el('div', { class: 'feature__meta' }, [
      el('p', { class: 'feature__kicker' }, [el('span', { text: 'Filme principal' }), dur]),
      el('h3', { class: 'feature__title', id: 'feature-title', text: title }),
      main.desc ? el('p', { class: 'feature__desc', text: main.desc }) : null
    ]));
    screenEl.appendChild(play);
    featureHost.appendChild(art);

    var card = { video: main, media: media, durEl: dur, screen: screenEl, button: play, isFeature: true, title: title, number: 1 };
    mountThumb(card);
    play.addEventListener('click', function () { openPlayer(card); });
    screenEl.addEventListener('click', function (e) {
      if (!card.missing && !play.contains(e.target)) openPlayer(card);
    });
  }

  /* ---------- Sequência de cartões ---------- */
  function renderReel() {
    if (!track || !reelWrap) return;
    track.textContent = '';

    if (!others.length) {
      if (!cfg.placeholders) { reelWrap.hidden = true; return; }
      ['horizontal', 'vertical', 'horizontal', 'vertical'].forEach(function (f, i) {
        var vertical = f === 'vertical';
        var li = el('li', { class: 'reel__item ' + (vertical ? 'reel__item--v' : 'reel__item--h') });
        li.appendChild(el('div', { class: 'clip clip--empty' }, [
          el('span', { class: 'clip__thumb' }, [C.placeholder({
            kind: 'video',
            label: 'Vídeo ' + pad2(i + 2) + ' · ' + f,
            hint: 'assets/videos/',
            hintPrefix: 'Adicione em '
          })]),
          el('span', { class: 'clip__title', text: 'Espaço reservado' }),
          el('span', { class: 'clip__meta', text: vertical ? 'Formato vertical · 9:16' : 'Formato horizontal · 16:9' })
        ]));
        track.appendChild(li);
      });
      updateNav();
      return;
    }

    others.forEach(function (v, i) {
      var number = i + 2;
      var vertical = v.format === 'vertical';
      var title = v.title || 'Vídeo ' + pad2(number);
      var li = el('li', { class: 'reel__item ' + (vertical ? 'reel__item--v' : 'reel__item--h') });
      var descId = v.desc ? 'clip-desc-' + number : null;
      var btn = el('button', { class: 'clip', type: 'button', 'aria-label': 'Assistir: ' + title, 'aria-describedby': descId });
      var media = el('span', { class: 'clip__media' });
      var dur = el('span', { class: 'clip__dur', 'aria-hidden': 'true' });
      var metaEl = el('span', { class: 'clip__meta', text: v.format ? (vertical ? 'Vertical' : 'Horizontal') : '' });
      btn.appendChild(el('span', { class: 'clip__thumb' }, [
        media,
        el('span', { class: 'clip__shade', 'aria-hidden': 'true' }),
        el('span', { class: 'clip__icon', 'aria-hidden': 'true' }, [C.icon('i-play')]),
        dur
      ]));
      btn.appendChild(el('span', { class: 'clip__title', text: title }));
      if (v.desc) btn.appendChild(el('span', { class: 'clip__desc', id: descId, text: v.desc }));
      btn.appendChild(metaEl);
      li.appendChild(btn);
      track.appendChild(li);

      var card = { video: v, media: media, durEl: dur, metaEl: metaEl, item: li, button: btn, isFeature: false, title: title, number: number };
      mountThumb(card);
      btn.addEventListener('click', function () { if (!card.missing) openPlayer(card); });
    });
    updateNav();
  }

  function updateNav() {
    if (!track || !reelNav) return;
    var max = track.scrollWidth - track.clientWidth;
    reelNav.classList.toggle('is-hidden', max <= 4);
    if (prevBtn) prevBtn.setAttribute('aria-disabled', track.scrollLeft <= 4 ? 'true' : 'false');
    if (nextBtn) nextBtn.setAttribute('aria-disabled', track.scrollLeft >= max - 4 ? 'true' : 'false');
  }

  function scrollReel(dir) {
    if (!track) return;
    var behavior = C.motion.reduced() ? 'auto' : 'smooth';
    try { track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: behavior }); }
    catch (e) { track.scrollLeft += dir * track.clientWidth * 0.8; }
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { if (prevBtn.getAttribute('aria-disabled') !== 'true') scrollReel(-1); });
  if (nextBtn) nextBtn.addEventListener('click', function () { if (nextBtn.getAttribute('aria-disabled') !== 'true') scrollReel(1); });
  if (track) track.addEventListener('scroll', function () { C.raf(updateNav); }, { passive: true });
  window.addEventListener('resize', C.debounce(updateNav, 150));

  /* ---------- Sala de projeção ---------- */
  var current = null;

  function showError(v) {
    if (!errorEl) return;
    errorEl.textContent = '';
    errorEl.appendChild(doc.createTextNode('Não foi possível reproduzir este vídeo ('));
    errorEl.appendChild(el('code', { text: v.src }));
    errorEl.appendChild(doc.createTextNode('). Confira se o arquivo existe e se está em MP4 com H.264 + AAC.'));
    errorEl.hidden = false;
    C.diagnose(v.src).then(function (status) {
      if (status === 'unknown' || errorEl.hidden) return;
      var info = C.problemText('video', v.src, status);
      errorEl.insertBefore(doc.createTextNode(info.title + '. '), errorEl.firstChild);
    });
  }

  function releaseCurrent() {
    var vid = current;
    current = null;
    release(vid);
  }

  function openPlayer(card) {
    if (!dlg || !screen || card.missing) return;
    var v = card.video;
    releaseCurrent();
    if (errorEl) { errorEl.hidden = true; errorEl.textContent = ''; }
    if (titleEl) titleEl.textContent = card.title;

    var vid = doc.createElement('video');
    vid.controls = true;
    vid.playsInline = true;
    vid.preload = 'auto';
    vid.setAttribute('playsinline', '');
    if (v.poster) vid.poster = v.poster;
    if (v.vtt) {
      vid.appendChild(el('track', { kind: 'subtitles', srclang: 'pt-BR', label: 'Português', src: v.vtt, default: true }));
    }
    vid.addEventListener('error', function () { showError(v); });
    vid.src = v.src;
    screen.textContent = '';
    screen.appendChild(vid);
    current = vid;

    C.modal.open(dlg, {
      returnFocus: card.button,
      onRequestClose: closePlayer,
      onClosed: releaseCurrent
    });

    /* Iniciado pelo clique do visitante: o navegador permite o som. Se ainda
       assim bloquear, os controles nativos ficam disponíveis. */
    try {
      var p = vid.play();
      if (p && p.catch) p.catch(function () { /* o visitante usa os controles */ });
    } catch (e) { /* ignora */ }
    setTimeout(function () {
      try { vid.focus({ preventScroll: true }); } catch (e) { /* ignora */ }
    }, 80);
  }

  function closePlayer() {
    if (current) { try { current.pause(); } catch (e) { /* ignora */ } }
    C.modal.close(dlg, 520);
  }

  if (closeBtn) closeBtn.addEventListener('click', closePlayer);
  if (dlg) {
    dlg.addEventListener('click', function (e) {
      var t = e.target;
      if (t === screen || (t.classList && (t.classList.contains('player__inner') || t.classList.contains('player__curtain')))) closePlayer();
    });
  }

  renderFeature();
  renderReel();
  C.videoPlayer = { close: closePlayer };
})();
