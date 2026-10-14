/* ==========================================================================
   CHROMA MEMORIES 17 — "Os melhores." e encerramento
   Homenagem: refletores acendem, um feixe de luz atravessa a foto dos dois
   e segue até os nomes, que se iluminam linha a linha.
   Final: o 17 é redesenhado em luz, um amanhecer cromático sobe e o texto
   aparece devagar, com fotografias em destaque ao redor.
   ========================================================================== */
(function () {
  'use strict';

  var C = window.Chroma;
  var doc = document;
  if (!C) return;

  var cfg = C.config;
  var el = C.el;

  /* ------------------------------------------------------------------------
     Homenagem
     ------------------------------------------------------------------------ */
  var section = doc.getElementById('os-melhores');
  var stage = doc.querySelector('[data-honor]');

  function initHonor() {
    var duoFig = stage.querySelector('[data-slot="juntos"]');
    var credits = stage.querySelector('.honor__credits');
    var portraits = stage.querySelector('.honor__portraits');
    var quote = section.querySelector('[data-honor-quote]');
    var gallery = []; // fotos disponíveis desta cena, na ordem de leitura

    var SLOTS = {
      juntos: {
        photo: cfg.honor.duo, label: 'Pedro Henrique & Vitor Luis', caption: null,
        title: 'Fotografia dos dois juntos', hint: 'assets/fotos/os-melhores/juntos.jpg',
        glow: 'var(--violet-rgb)', ratio: 4 / 5, limits: [0.7, 1.9]
      },
      pedroHenrique: {
        photo: cfg.honor.pedro, label: 'Pedro Henrique', caption: 'Pedro Henrique',
        title: 'Retrato', hint: 'assets/fotos/os-melhores/pedro-henrique.jpg',
        glow: 'var(--cyan-rgb)', ratio: 3 / 4, limits: [0.66, 1.05]
      },
      vitorLuis: {
        photo: cfg.honor.vitor, label: 'Vitor Luis', caption: 'Vitor Luis',
        title: 'Retrato', hint: 'assets/fotos/os-melhores/vitor-luis.jpg',
        glow: 'var(--magenta-rgb)', ratio: 3 / 4, limits: [0.66, 1.05]
      }
    };

    function layout() {
      stage.classList.toggle('no-duo', !duoFig || duoFig.hidden);
      if (portraits) {
        var any = Array.prototype.some.call(portraits.children, function (f) { return !f.hidden; });
        portraits.classList.toggle('is-empty', !any);
      }
    }

    function placeholderFrame(s, missing, src) {
      return el('div', {
        class: 'honor__frame honor__frame--ph',
        style: '--ratio:' + s.ratio + ';--glow-rgb:' + s.glow
      }, [missing
        ? C.problemPlaceholder('photo', s.label, src)
        : C.placeholder({ kind: 'photo', label: s.label, title: s.title, hint: s.hint, hintPrefix: 'Adicione em ' })]);
    }

    function fill(fig, key) {
      var s = SLOTS[key];
      var p = s.photo;
      fig.textContent = '';
      if (!p) {
        if (!cfg.placeholders) { fig.hidden = true; return; }
        fig.appendChild(placeholderFrame(s, false));
        if (s.caption) fig.appendChild(el('figcaption', { text: s.caption }));
        return;
      }

      var name = p.alt || s.label;
      var btn = el('button', {
        class: 'honor__frame',
        type: 'button',
        'aria-label': 'Ampliar fotografia: ' + name,
        style: '--ratio:' + s.ratio + ';--glow-rgb:' + s.glow + ';' + (p.focus ? '--focus:' + p.focus + ';' : '')
      });
      var img = el('img', { alt: name, decoding: 'async', loading: 'lazy', draggable: 'false' });
      btn.appendChild(img);
      btn.appendChild(el('span', { class: 'honor__veil', 'aria-hidden': 'true' }));
      fig.appendChild(btn);
      if (s.caption) fig.appendChild(el('figcaption', { text: s.caption }));

      var entry = { src: p.src, alt: name, caption: s.caption || s.label, glow: s.glow, origin: btn, focus: p.focus };
      gallery.push(entry);

      img.addEventListener('load', function () {
        if (!img.naturalWidth || !img.naturalHeight) return;
        var r = img.naturalWidth / img.naturalHeight;
        btn.style.setProperty('--ratio', Math.min(s.limits[1], Math.max(s.limits[0], r)).toFixed(4));
        if (key === 'juntos') stage.classList.toggle('is-wide', r > 1.15);
      });
      img.addEventListener('error', function () {
        var i = gallery.indexOf(entry);
        if (i !== -1) gallery.splice(i, 1);
        if (!cfg.placeholders) { fig.hidden = true; layout(); return; }
        fig.replaceChild(placeholderFrame(s, true, p.src), btn);
      });
      btn.addEventListener('click', function () {
        var list = gallery.slice();
        C.lightbox.open(list, Math.max(0, list.indexOf(entry)), { label: 'Fotografia' });
      });
      img.src = p.src;
    }

    Object.keys(SLOTS).forEach(function (key) {
      var fig = stage.querySelector('[data-slot="' + key + '"]');
      if (fig) fill(fig, key);
    });
    /* Ordem da visualização ampliada: os dois juntos primeiro. */
    gallery.sort(function (a, b) {
      var order = ['Pedro Henrique & Vitor Luis', 'Pedro Henrique', 'Vitor Luis'];
      return order.indexOf(a.caption) - order.indexOf(b.caption);
    });
    layout();

    /* Luz em etapas: refletores (cena), feixe + foto, nomes, citação. */
    C.onView(section, function () { section.classList.add('is-on'); }, { margin: '0px 0px -25% 0px' });
    if (duoFig && !duoFig.hidden) {
      C.onView(duoFig, function () {
        duoFig.classList.add('is-lit');
        stage.classList.add('is-beam');
      }, { margin: '0px 0px -28% 0px' });
    }
    C.onView(credits, function () {
      credits.classList.add('is-lit');
      stage.classList.add('is-beam');
    }, { margin: '0px 0px -22% 0px' });
    C.onView(quote, function () { quote.classList.add('is-in'); }, { margin: '0px 0px -15% 0px' });
  }

  if (section && stage) initHonor();

  /* ------------------------------------------------------------------------
     Encerramento
     ------------------------------------------------------------------------ */
  var finale = doc.querySelector('[data-finale]');

  function initFinale() {
    var host = finale.querySelector('[data-finale-photos]');
    var list = cfg.finalePhotos;
    if (!list.length) {
      var featured = cfg.photos.filter(function (p) { return p.featured; });
      list = featured.length ? featured : cfg.photos;
    }
    var FACTORS = { 1: 0.1, 2: 0.2, 3: 0.15, 4: 0.07 };
    /* Posições equilibradas conforme a quantidade de fotos disponíveis. */
    var SLOTS = { 1: [1], 2: [1, 4], 3: [1, 3, 2], 4: [1, 2, 3, 4] };
    var chosen = list.slice(0, 4);
    var slots = SLOTS[chosen.length] || [];
    chosen.forEach(function (p, i) {
      var slot = slots[i];
      var fig = el('figure', {
        class: 'fphoto fphoto--' + slot,
        style: p.focus ? '--focus:' + p.focus : null
      });
      var img = el('img', { alt: '', decoding: 'async', loading: 'lazy', draggable: 'false' });
      img.addEventListener('load', function () {
        if (img.naturalWidth && img.naturalHeight) {
          var r = img.naturalWidth / img.naturalHeight;
          fig.style.setProperty('--ratio', Math.min(1.5, Math.max(0.68, r)).toFixed(4));
        }
      });
      img.addEventListener('error', function () {
        if (fig.parentNode) fig.parentNode.removeChild(fig);
      });
      img.src = p.thumb || p.src;
      fig.appendChild(img);
      host.appendChild(fig);
      C.parallax(fig, FACTORS[slot]);
    });

    C.onView(finale, function () {
      finale.classList.add('is-lit');
      var slate = finale.querySelector('.slate');
      if (slate) slate.classList.add('is-in');
    }, { margin: '0px 0px -30% 0px' });
  }

  if (finale) initFinale();
})();
