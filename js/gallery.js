/* ==========================================================================
   CHROMA MEMORIES 17 — galeria "Memórias em luz"
   Monta uma exposição assimétrica a partir da lista do config.js, respeitando
   fotos verticais, horizontais e panorâmicas. Cada foto surge do escuro,
   revelada por um feixe de luz. As cores das fotografias nunca são alteradas.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.Chroma;
  var doc = document;
  var host = doc.querySelector('[data-gallery]');
  if (!C || !host) return;

  var cfg = C.config;
  var el = C.el;
  var pad2 = C.pad2;

  var GLOWS = ['var(--violet-rgb)', 'var(--cyan-rgb)', 'var(--emerald-rgb)', 'var(--magenta-rgb)',
    'var(--electric-rgb)', 'var(--lilac-rgb)', 'var(--turquoise-rgb)', 'var(--rose-rgb)'];
  var KIND_LABEL = { portrait: 'vertical', landscape: 'horizontal', pano: 'panorâmica', square: 'quadrada' };
  var DEFAULT_RATIO = { portrait: 4 / 5, landscape: 3 / 2, pano: 21 / 9, square: 1 };
  var RATIO_LIMITS = { portrait: [0.66, 0.87], landscape: [1.15, 1.8], pano: [1.95, 2.8], square: [0.87, 1.15] };

  var items = [];
  var note = null;

  /* ---------- Forma de cada foto ---------- */
  function kindOf(it) {
    if (it.format) return it.format;
    if (it.w && it.h) {
      var r = it.w / it.h;
      if (r >= 1.95) return 'pano';
      if (r > 1.15) return 'landscape';
      if (r < 0.87) return 'portrait';
      return 'square';
    }
    return 'portrait';
  }

  function ratioOf(it) {
    var k = kindOf(it);
    if (it.w && it.h) {
      var lim = RATIO_LIMITS[k];
      return Math.min(lim[1], Math.max(lim[0], it.w / it.h));
    }
    return DEFAULT_RATIO[k];
  }

  /* ---------- Composição: linhas assimétricas ---------- */
  function buildRows(list) {
    var rows = [], i = 0, flip = false;
    while (i < list.length) {
      var a = list[i], b = list[i + 1], c = list[i + 2];
      var ka = kindOf(a), kb = b && kindOf(b), kc = c && kindOf(c);
      if (ka === 'pano') {
        rows.push({ type: 'pano', items: [a], flip: flip });
        i += 1;
      } else if (ka === 'portrait' && kb === 'portrait' && kc === 'portrait') {
        rows.push({ type: 'trio', items: [a, b, c], flip: flip });
        i += 3;
      } else if (b && kb !== 'pano') {
        rows.push({ type: 'pair', items: [a, b], flip: flip });
        i += 2;
      } else {
        rows.push({ type: 'solo', items: [a], flip: flip });
        i += 1;
      }
      flip = !flip;
    }
    return rows;
  }

  /* Telas largas: grade de 12 colunas, com respiros e desníveis. */
  var PAIRS = {
    'portrait-portrait':   { col: ['2 / span 4', '7 / span 5'], dy: ['0', '14vh'] },
    'portrait-landscape':  { col: ['1 / span 4', '6 / span 7'], dy: ['12vh', '0'] },
    'landscape-portrait':  { col: ['1 / span 7', '9 / span 4'], dy: ['0', '16vh'] },
    'landscape-landscape': { col: ['1 / span 7', '8 / span 5'], dy: ['0', '20vh'] },
    'portrait-square':     { col: ['2 / span 4', '7 / span 5'], dy: ['10vh', '0'] },
    'square-portrait':     { col: ['1 / span 5', '8 / span 4'], dy: ['0', '12vh'] },
    'square-landscape':    { col: ['1 / span 5', '6 / span 7'], dy: ['14vh', '0'] },
    'landscape-square':    { col: ['1 / span 7', '8 / span 5'], dy: ['0', '14vh'] },
    'square-square':       { col: ['2 / span 5', '7 / span 5'], dy: ['0', '12vh'] }
  };
  var SOLO = { portrait: '4 / span 5', landscape: '2 / span 9', square: '3 / span 6', pano: '1 / -1' };

  function mirror(spec) {
    var m = /^(\d+)\s*\/\s*span\s*(\d+)$/.exec(spec);
    if (!m) return spec;
    var start = +m[1], span = +m[2];
    return (12 - (start + span - 1) + 1) + ' / span ' + span;
  }

  function largePlacement(row) {
    var out;
    if (row.type === 'pano') return [{ col: row.flip ? '1 / span 11' : '2 / span 11', dy: '0' }];
    if (row.type === 'trio') {
      out = [{ col: '1 / span 4', dy: '0' }, { col: '5 / span 4', dy: '16vh' }, { col: '9 / span 4', dy: '6vh' }];
      if (row.flip) { out[0].dy = '8vh'; out[1].dy = '0'; out[2].dy = '15vh'; }
      return out;
    }
    if (row.type === 'pair') {
      var key = kindOf(row.items[0]) + '-' + kindOf(row.items[1]);
      var t = PAIRS[key] || PAIRS['portrait-portrait'];
      out = [{ col: t.col[0], dy: t.dy[0] }, { col: t.col[1], dy: t.dy[1] }];
      if (row.flip) { out[0].col = mirror(out[0].col); out[1].col = mirror(out[1].col); }
      return out;
    }
    var solo = SOLO[kindOf(row.items[0])] || SOLO.portrait;
    return [{ col: row.flip ? mirror(solo) : solo, dy: '0' }];
  }

  /* Celulares: grade de 6 colunas, alternando alinhamentos. */
  function smallSingle(it, alt) {
    var k = kindOf(it);
    if (k === 'landscape' || k === 'pano') return { col: '1 / -1', bleed: k === 'pano' };
    if (k === 'square') return { col: alt ? '2 / span 5' : '1 / span 5' };
    return { col: alt ? '3 / span 4' : '1 / span 4' };
  }

  function smallPlacement(row) {
    var a = row.items[0], b = row.items[1];
    if (row.type === 'pano') return [{ col: '1 / -1', bleed: true }];
    if (row.type === 'trio') {
      return [
        { col: '1 / span 3' },
        { col: '4 / span 3', dy: '2.6rem' },
        { col: row.flip ? '3 / span 4' : '2 / span 4' }
      ];
    }
    if (row.type === 'pair') {
      var small = function (it) { return kindOf(it) === 'portrait' || kindOf(it) === 'square'; };
      if (small(a) && small(b)) return [{ col: '1 / span 3' }, { col: '4 / span 3', dy: '2.6rem' }];
      return [smallSingle(a, row.flip), smallSingle(b, !row.flip)];
    }
    return [smallSingle(a, row.flip)];
  }

  function place(it, lg, sm, order) {
    var s = it.fig.style;
    s.setProperty('--col-lg', lg.col);
    s.setProperty('--dy-lg', lg.dy || '0');
    s.setProperty('--col-sm', sm.col);
    s.setProperty('--dy-sm', sm.dy || '0');
    s.setProperty('--ratio', ratioOf(it).toFixed(4));
    s.setProperty('--sd', (order * 0.16).toFixed(2) + 's');
    it.fig.classList.toggle('shot--bleed', !!sm.bleed);
  }

  function render() {
    var list = items.filter(function (it) { return !it.removed; });
    var frag = doc.createDocumentFragment();
    buildRows(list).forEach(function (row) {
      var rowEl = el('div', { class: 'g-row g-row--' + row.type });
      var lgs = largePlacement(row);
      var sms = smallPlacement(row);
      row.items.forEach(function (it, k) {
        place(it, lgs[k], sms[k], k);
        rowEl.appendChild(it.fig);
      });
      frag.appendChild(rowEl);
    });
    host.textContent = '';
    host.appendChild(frag);
  }

  var scheduleRender = C.debounce(render, 120);

  /* ---------- Revelação: só acende quando está na tela E carregou ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var it = entry.target._chromaItem;
      io.unobserve(entry.target);
      if (!it) return;
      it.inView = true;
      it.fig.classList.add('is-near');
      tryLight(it);
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 }) : null;

  function observe(it) {
    it.fig._chromaItem = it;
    if (io) io.observe(it.fig);
    else { it.inView = true; it.fig.classList.add('is-near'); tryLight(it); }
  }

  function tryLight(it) {
    if (it.inView && (it.loaded || it.missing || it.placeholder)) it.fig.classList.add('is-lit');
  }

  /* ---------- Notas para quem está montando o site ---------- */
  function setNote(nodes) {
    if (!note) {
      note = el('p', { class: 'gallery__note' });
      host.parentNode.insertBefore(note, host.nextSibling);
    }
    note.textContent = '';
    nodes.forEach(function (n) { note.appendChild(typeof n === 'string' ? doc.createTextNode(n) : n); });
  }

  function updateMissingNote() {
    var missing = items.filter(function (it) { return it.missing; }).length;
    if (!missing || !cfg.placeholders) return;
    setNote([
      missing === 1 ? '1 fotografia listada em ' : missing + ' fotografias listadas em ',
      el('code', { text: 'config.js' }),
      missing === 1 ? ' não pôde ser exibida. ' : ' não puderam ser exibidas. ',
      'Confira o caminho, o nome (maiúsculas e minúsculas fazem diferença) e o formato (JPG, PNG ou WebP).'
    ]);
  }

  /* ---------- Foto real ---------- */
  function markMissing(it) {
    if (it.missing) return;
    it.missing = true;
    if (!cfg.placeholders) {
      it.removed = true;
      if (it.fig.parentNode) it.fig.parentNode.removeChild(it.fig);
      scheduleRender();
      return;
    }
    var frame = el('div', { class: 'shot__frame' }, [
      C.problemPlaceholder('photo', 'Foto ' + pad2(it.index + 1), it.photo.src)
    ]);
    if (it.frame && it.frame.parentNode === it.fig) it.fig.replaceChild(frame, it.frame);
    it.frame = frame;
    it.fig.classList.add('shot--missing');
    tryLight(it);
    updateMissingNote();
  }

  function openLightbox(it) {
    var list = items.filter(function (x) { return !x.missing && !x.removed && !x.placeholder; });
    var entries = list.map(function (x) {
      return {
        src: x.photo.src,
        alt: x.photo.alt,
        caption: x.photo.caption,
        glow: x.glow,
        origin: x.frame,
        focus: x.photo.focus
      };
    });
    C.lightbox.open(entries, list.indexOf(it), { label: 'Fotografia' });
  }

  function buildPhoto(p, i, total) {
    var it = { photo: p, index: i, format: p.format, w: 0, h: 0, glow: GLOWS[i % GLOWS.length] };
    var style = '--glow-rgb:' + it.glow + ';' + (p.focus ? '--focus:' + p.focus + ';' : '');
    var fig = el('figure', { class: 'shot', style: style });
    var name = 'Ampliar fotografia ' + (i + 1) + ' de ' + total + (p.alt ? ': ' + p.alt : '');
    var frame = el('button', { class: 'shot__frame', type: 'button', 'aria-label': name });
    var img = el('img', { alt: p.alt || ('Fotografia ' + (i + 1)), loading: 'lazy', decoding: 'async', draggable: 'false' });
    var zoom = el('span', { class: 'shot__zoom', 'aria-hidden': 'true' }, [C.icon('i-plus')]);
    frame.appendChild(img);
    frame.appendChild(el('span', { class: 'shot__veil', 'aria-hidden': 'true' }));
    frame.appendChild(zoom);
    fig.appendChild(frame);
    fig.appendChild(el('figcaption', { class: 'shot__cap' }, [
      el('span', { class: 'shot__no', text: pad2(i + 1) }),
      p.caption ? el('span', { class: 'shot__txt', text: p.caption }) : null
    ]));

    img.addEventListener('load', function () {
      it.loaded = true;
      if (!it.w && img.naturalWidth) {
        var before = kindOf(it);
        it.w = img.naturalWidth;
        it.h = img.naturalHeight;
        fig.style.setProperty('--ratio', ratioOf(it).toFixed(4));
        if (kindOf(it) !== before) scheduleRender();
      }
      tryLight(it);
    });
    img.addEventListener('error', function () { markMissing(it); });
    frame.addEventListener('click', function () { openLightbox(it); });
    img.src = p.thumb;

    it.fig = fig;
    it.frame = frame;
    return it;
  }

  /* Descobre a proporção de todas as fotos cedo (sem baixá-las inteiras),
     para a composição já nascer certa. */
  function probeAll() {
    var queue = items.slice();
    var active = 0, MAX = 3;
    var kindChanged = false;
    function next() {
      while (active < MAX && queue.length) {
        launch(queue.shift());
      }
      if (!active && !queue.length && kindChanged) render();
    }
    function launch(it) {
      active++;
      C.probeImage(it.photo.thumb, 9000).then(function (res) {
        active--;
        if (res.ok === false) {
          markMissing(it);
          kindChanged = true;
        } else if (res.w && !it.w) {
          var before = kindOf(it);
          it.w = res.w;
          it.h = res.h;
          it.fig.style.setProperty('--ratio', ratioOf(it).toFixed(4));
          if (kindOf(it) !== before) kindChanged = true;
        }
        next();
      });
    }
    next();
  }

  /* ---------- Sem fotos: espaços reservados elegantes ---------- */
  function renderPlaceholders() {
    var kinds = ['portrait', 'landscape', 'pano', 'portrait', 'portrait', 'landscape'];
    items = kinds.map(function (k, i) {
      var glow = GLOWS[i % GLOWS.length];
      var fig = el('figure', { class: 'shot shot--placeholder', style: '--glow-rgb:' + glow });
      var frame = el('div', { class: 'shot__frame' }, [
        C.placeholder({
          kind: 'photo',
          label: 'Foto ' + pad2(i + 1) + ' · ' + KIND_LABEL[k],
          hint: 'assets/fotos/',
          hintPrefix: 'Adicione em '
        })
      ]);
      fig.appendChild(frame);
      fig.appendChild(el('figcaption', { class: 'shot__cap' }, [
        el('span', { class: 'shot__no', text: pad2(i + 1) }),
        el('span', { class: 'shot__txt', text: 'Espaço reservado' })
      ]));
      return { photo: {}, format: k, index: i, fig: fig, frame: frame, placeholder: true, glow: glow };
    });
    render();
    items.forEach(observe);
    setNote([
      'Nenhuma fotografia configurada ainda. Copie os arquivos para ',
      el('code', { text: 'assets/fotos/' }),
      ' e liste-os em ',
      el('code', { text: 'config.js' }),
      ' — a exposição se monta sozinha.'
    ]);
  }

  /* ---------- Início ---------- */
  if (!cfg.photos.length) {
    if (cfg.placeholders) renderPlaceholders();
    else C.hideScene('memorias');
    return;
  }

  items = cfg.photos.map(function (p, i) { return buildPhoto(p, i, cfg.photos.length); });
  render();
  items.forEach(observe);
  probeAll();
})();
