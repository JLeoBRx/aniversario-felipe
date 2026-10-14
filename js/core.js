/* ==========================================================================
   CHROMA MEMORIES 17 — núcleo
   Utilidades, leitura do config.js, preferência de movimento, revelações ao
   rolar, troca de cenas (cores + navegação), menu, diálogos e parallax.

   Scripts clássicos (sem módulos e sem compilação) para que o site funcione
   também abrindo o index.html direto do computador (file://).
   ========================================================================== */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var C = window.Chroma = window.Chroma || {};

  /* ------------------------------------------------------------------------
     Utilidades
     ------------------------------------------------------------------------ */
  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  function append(node, children) {
    if (children === null || children === undefined) return;
    if (!Array.isArray(children)) children = [children];
    children.forEach(function (child) {
      if (child === null || child === undefined || child === false) return;
      node.appendChild(typeof child === 'string' || typeof child === 'number'
        ? doc.createTextNode(String(child))
        : child);
    });
  }

  /* Cria elementos sem innerHTML: textos do config nunca viram HTML. */
  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var val = attrs[key];
        if (val === null || val === undefined || val === false) return;
        if (key === 'class') node.className = val;
        else if (key === 'text') node.textContent = val;
        else node.setAttribute(key, val === true ? '' : String(val));
      });
    }
    append(node, children);
    return node;
  }

  var SVGNS = 'http://www.w3.org/2000/svg';
  function icon(id, cls) {
    var svg = doc.createElementNS(SVGNS, 'svg');
    svg.setAttribute('class', cls || 'icon');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var use = doc.createElementNS(SVGNS, 'use');
    use.setAttribute('href', '#' + id);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', '#' + id);
    svg.appendChild(use);
    return svg;
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds <= 0) return '';
    var s = Math.round(seconds);
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var r = s % 60;
    return (h ? h + ':' + pad2(m) : m) + ':' + pad2(r);
  }

  function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

  var raf = window.requestAnimationFrame
    ? window.requestAnimationFrame.bind(window)
    : function (fn) { return setTimeout(function () { fn(Date.now()); }, 16); };

  function nextFrame(fn) { raf(function () { raf(fn); }); }

  function debounce(fn, wait) {
    var t = 0;
    return function () {
      var args = arguments, self = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  /* Lê "50% 30%" (ponto de foco) como frações 0..1. */
  function parseFocus(str) {
    var out = { x: 0.5, y: 0.5 };
    if (!str) return out;
    var parts = String(str).trim().split(/\s+/);
    var map = { left: 0, center: 0.5, right: 1, top: 0, bottom: 1 };
    function val(p) {
      if (p in map) return map[p];
      var n = parseFloat(p);
      return isFinite(n) && /%$/.test(p) ? clamp(n / 100, 0, 1) : null;
    }
    var a = val(parts[0]), b = parts[1] !== undefined ? val(parts[1]) : 0.5;
    if (a !== null) out.x = a;
    if (b !== null) out.y = b;
    return out;
  }

  C.$ = $;
  C.$$ = $$;
  C.el = el;
  C.icon = icon;
  C.pad2 = pad2;
  C.formatTime = formatTime;
  C.clamp = clamp;
  C.raf = raf;
  C.nextFrame = nextFrame;
  C.debounce = debounce;
  C.parseFocus = parseFocus;

  /* ------------------------------------------------------------------------
     Preferência de movimento (sistema + botão "Reduzir movimento")
     ------------------------------------------------------------------------ */
  var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var savedMotion = null;
  try { savedMotion = window.localStorage.getItem('chroma-motion'); } catch (e) { /* armazenamento indisponível */ }
  var reduced = savedMotion ? savedMotion === 'reduced' : !!(motionQuery && motionQuery.matches);
  var motionListeners = [];

  function applyMotion() {
    root.classList.toggle('motion-reduced', reduced);
    $$('[data-motion-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', reduced ? 'true' : 'false');
      if (btn.hasAttribute('title')) btn.title = reduced ? 'Movimento reduzido — clique para ativar' : 'Reduzir movimento';
    });
    motionListeners.forEach(function (fn) { fn(reduced); });
  }

  C.motion = {
    reduced: function () { return reduced; },
    set: function (value) {
      reduced = !!value;
      savedMotion = reduced ? 'reduced' : 'full';
      try { window.localStorage.setItem('chroma-motion', savedMotion); } catch (e) { /* ignora */ }
      applyMotion();
    },
    onChange: function (fn) { motionListeners.push(fn); }
  };

  if (motionQuery) {
    var onQuery = function (e) {
      if (savedMotion) return; // a escolha feita no site vale mais
      reduced = e.matches;
      applyMotion();
    };
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', onQuery);
    else if (motionQuery.addListener) motionQuery.addListener(onQuery);
  }

  doc.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-motion-toggle]') : null;
    if (btn) C.motion.set(!reduced);
  });
  applyMotion();

  /* ------------------------------------------------------------------------
     Configuração (config.js) — normalizada e tolerante a erros de digitação
     ------------------------------------------------------------------------ */
  var raw = window.CHROMA_CONFIG;
  var configOk = !!raw && typeof raw === 'object';
  if (!configOk) raw = {};

  function str(v) {
    if (typeof v === 'string') return v.trim();
    if (typeof v === 'number') return String(v);
    return '';
  }

  var FORMATS = {
    vertical: 'portrait', retrato: 'portrait', 'em pé': 'portrait',
    horizontal: 'landscape', paisagem: 'landscape', deitada: 'landscape',
    panoramica: 'pano', 'panorâmica': 'pano', panorama: 'pano',
    quadrada: 'square', quadrado: 'square'
  };
  function format(v) { return FORMATS[str(v).toLowerCase()] || null; }

  function photo(item) {
    if (typeof item === 'string') item = { arquivo: item };
    if (!item || typeof item !== 'object') return null;
    var src = str(item.arquivo || item.src || item.caminho || item.foto);
    if (!src) return null;
    return {
      src: src,
      thumb: str(item.miniatura) || src,
      caption: str(item.legenda),
      alt: str(item.descricao) || str(item.legenda),
      format: format(item.formato),
      focus: str(item.foco),
      featured: item.destaque === true
    };
  }

  function video(item) {
    if (typeof item === 'string') item = { arquivo: item };
    if (!item || typeof item !== 'object') return null;
    var src = str(item.arquivo || item.src || item.caminho || item.video);
    if (!src) return null;
    var f = format(item.formato);
    return {
      src: src,
      title: str(item.titulo),
      desc: str(item.descricao),
      poster: str(item.capa),
      format: f === 'portrait' ? 'vertical' : (f ? 'horizontal' : null),
      main: item.principal === true,
      vtt: str(item.legendasVTT || item.legendasVtt)
    };
  }

  function list(arr, fn) { return Array.isArray(arr) ? arr.map(fn).filter(Boolean) : []; }

  var honor = raw.homenagem && typeof raw.homenagem === 'object' ? raw.homenagem : {};
  var finale = raw.encerramento && typeof raw.encerramento === 'object' ? raw.encerramento : {};

  C.config = {
    ok: configOk,
    placeholders: raw.mostrarEspacosReservados !== false,
    photos: list(raw.fotos, photo),
    videos: list(raw.videos, video),
    honor: {
      duo: photo(honor.juntos),
      pedro: photo(honor.pedroHenrique),
      vitor: photo(honor.vitorLuis)
    },
    finalePhotos: list(finale.fotos, photo)
  };

  /* ------------------------------------------------------------------------
     Avisos discretos (ex.: config.js com erro de digitação)
     ------------------------------------------------------------------------ */
  var noticeEl = $('[data-notice]');
  C.notice = function (nodes) {
    if (!noticeEl) return;
    noticeEl.textContent = '';
    append(noticeEl, nodes);
    var close = el('button', { type: 'button', text: 'Fechar' });
    close.addEventListener('click', function () { noticeEl.hidden = true; });
    noticeEl.appendChild(close);
    noticeEl.hidden = false;
  };
  if (!configOk) {
    C.notice([
      'Não foi possível ler o arquivo ', el('code', { text: 'config.js' }),
      '. Confira se não falta uma vírgula, aspas ou colchete. Enquanto isso, o site mostra os espaços reservados.'
    ]);
    if (window.console) console.warn('[Chroma Memories] config.js ausente ou com erro de sintaxe.');
  }

  /* ------------------------------------------------------------------------
     Espaço reservado (visor de câmera) — usado por galeria, vídeos e homenagem
     ------------------------------------------------------------------------ */
  C.placeholder = function (o) {
    o = o || {};
    var hint = null;
    if (o.hint) {
      hint = el('span', { class: 'ph__hint' }, [
        o.hintPrefix || (o.missing ? 'Procurado em ' : 'Adicione em '),
        el('code', { text: o.hint })
      ]);
    }
    var note = o.missing ? el('span', { class: 'ph__note', text: o.note || '' }) : null;
    if (note && !o.note) note.hidden = true;
    return el('div', { class: 'ph' + (o.missing ? ' ph--missing' : '') }, [
      el('div', { class: 'ph__inner' }, [
        icon(o.kind === 'video' ? 'i-film' : 'i-photo', 'ph__icon'),
        o.label ? el('span', { class: 'ph__label', text: o.label }) : null,
        o.title ? el('span', { class: 'ph__title', text: o.title }) : null,
        hint,
        note
      ])
    ]);
  };

  /* Quando uma mídia não abre, tenta dizer o motivo: arquivo ausente
     (404) ou formato que o navegador não exibe. Em file:// não há como
     perguntar ao servidor, então a mensagem fica genérica. */
  C.diagnose = function (src) {
    return new Promise(function (resolve) {
      if (!/^https?:$/.test(location.protocol) || !window.fetch) { resolve('unknown'); return; }
      fetch(src, { method: 'HEAD', cache: 'no-store' }).then(function (res) {
        if (res.status === 404 || res.status === 410) resolve('missing');
        else resolve(res.ok ? 'present' : 'unknown');
      }, function () { resolve('unknown'); });
    });
  };

  function extension(src) {
    var clean = String(src).split('#')[0].split('?')[0];
    var dot = clean.lastIndexOf('.');
    return dot === -1 ? '' : clean.slice(dot + 1).toLowerCase();
  }

  function problemText(kind, src, status) {
    var ext = extension(src);
    var title = status === 'missing' ? 'Arquivo não encontrado'
      : status === 'present' ? 'Formato não suportado neste navegador'
      : (kind === 'video' ? 'Vídeo indisponível' : 'Imagem indisponível');
    var tip = '';
    if (kind === 'photo' && (ext === 'heic' || ext === 'heif')) tip = 'Fotos HEIC do iPhone precisam ser convertidas para JPG.';
    else if (kind === 'video' && /^(mov|avi|mkv|wmv|3gp|m4v|flv)$/.test(ext)) tip = 'Converta o vídeo para MP4 (H.264 + AAC).';
    else if (kind === 'video' && status !== 'missing') tip = 'Use MP4 com vídeo H.264 e áudio AAC.';
    else if (kind === 'photo' && status !== 'missing') tip = 'Use JPG, PNG ou WebP.';
    return { title: title, tip: tip };
  }
  C.problemText = problemText;

  /* Espaço reservado de erro: começa genérico e se ajusta com o diagnóstico. */
  C.problemPlaceholder = function (kind, label, src) {
    var first = problemText(kind, src, 'unknown');
    var ph = C.placeholder({ kind: kind, label: label, title: first.title, hint: src, hintPrefix: 'Procurado em ', note: first.tip, missing: true });
    C.diagnose(src).then(function (status) {
      var info = problemText(kind, src, status);
      var t = ph.querySelector('.ph__title');
      var n = ph.querySelector('.ph__note');
      if (t) t.textContent = info.title;
      if (n) { n.textContent = info.tip; n.hidden = !info.tip; }
    });
    return ph;
  };

  /* Descobre as dimensões de uma imagem assim que o cabeçalho chega,
     interrompendo o download (a imagem em si carrega depois, sob demanda). */
  C.probeImage = function (src, timeout) {
    return new Promise(function (resolve) {
      var im = new Image();
      var done = false, poll = 0, timer = 0;
      function end(result, abort) {
        if (done) return;
        done = true;
        clearInterval(poll);
        clearTimeout(timer);
        im.onload = im.onerror = null;
        if (abort) { try { im.src = ''; } catch (e) { /* ignora */ } }
        resolve(result);
      }
      im.onload = function () { end({ ok: true, w: im.naturalWidth, h: im.naturalHeight }, false); };
      im.onerror = function () { end({ ok: false, w: 0, h: 0 }, false); };
      im.decoding = 'async';
      im.src = src;
      if (im.complete && im.naturalWidth) {
        end({ ok: true, w: im.naturalWidth, h: im.naturalHeight }, false);
        return;
      }
      poll = setInterval(function () {
        if (im.naturalWidth) end({ ok: true, w: im.naturalWidth, h: im.naturalHeight }, true);
      }, 40);
      timer = setTimeout(function () { end({ ok: null, w: 0, h: 0 }, true); }, timeout || 8000);
    });
  };

  /* ------------------------------------------------------------------------
     Observadores de visibilidade
     ------------------------------------------------------------------------ */
  var hasIO = 'IntersectionObserver' in window;

  /* Executa cb uma única vez quando o elemento entra na tela. */
  C.onView = function (node, cb, opts) {
    if (!node) return;
    opts = opts || {};
    if (!hasIO) { cb(); return; }
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          io.disconnect();
          cb();
          return;
        }
      }
    }, { rootMargin: opts.margin || '0px', threshold: opts.threshold || 0 });
    io.observe(node);
  };

  var revealIO = hasIO ? new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-in');
        revealIO.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }) : null;

  C.reveal = function (node) {
    if (!node) return;
    if (revealIO) revealIO.observe(node);
    else node.classList.add('is-in');
  };
  $$('[data-reveal]').forEach(C.reveal);

  /* Esconde uma cena inteira (ex.: galeria sem fotos e sem espaços reservados). */
  C.hideScene = function (id) {
    var section = doc.getElementById(id);
    if (!section) return;
    section.hidden = true;
    var skip = $('.skip-link');
    if (skip && skip.getAttribute('href') === '#' + id) {
      var next = section.nextElementSibling;
      while (next && (next.hidden || next.tagName !== 'SECTION')) next = next.nextElementSibling;
      if (next && next.id) skip.setAttribute('href', '#' + next.id);
    }
    var prev = section.previousElementSibling;
    if (prev && prev.classList.contains('thread')) prev.hidden = true;
    $$('a[href="#' + id + '"]').forEach(function (a) {
      var li = a.closest ? a.closest('li') : null;
      (li || a).hidden = true;
    });
  };

  /* ------------------------------------------------------------------------
     Cenas: cor da atmosfera, navegação ativa, rótulo da cena
     ------------------------------------------------------------------------ */
  var SCENE_LABELS = {
    abertura: '01 · Abertura',
    memorias: '02 · Memórias',
    filme: '03 · O filme',
    melhores: '04 · Os melhores',
    final: '05 · Final'
  };
  var sceneLabel = $('[data-scene-label]');
  var currentScene = doc.body.getAttribute('data-scene') || 'abertura';
  var sceneListeners = [];

  function paintScene(name) {
    doc.body.setAttribute('data-scene', name);
    var section = $('main > section[data-scene="' + name + '"]');
    var id = section ? section.id : '';
    $$('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === name) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    $$('.menu__link').forEach(function (a) {
      if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
    if (sceneLabel) sceneLabel.textContent = SCENE_LABELS[name] || '';
  }

  function setScene(name) {
    if (!name || name === currentScene) return;
    currentScene = name;
    paintScene(name);
    sceneListeners.forEach(function (fn) { fn(name); });
  }

  C.scene = {
    current: function () { return currentScene; },
    onChange: function (fn) { sceneListeners.push(fn); }
  };
  paintScene(currentScene);

  if (hasIO) {
    var sceneIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setScene(entry.target.getAttribute('data-scene'));
      });
    }, { rootMargin: '-46% 0px -46% 0px', threshold: 0 });
    $$('main > section[data-scene]').forEach(function (s) { sceneIO.observe(s); });
  }

  /* ------------------------------------------------------------------------
     Diálogos (menu, lightbox, player): abrir/fechar com transição,
     bloqueio de rolagem e devolução do foco.
     ------------------------------------------------------------------------ */
  var openDialogs = [];
  var modalListeners = [];

  function finalizeDialog(dialog) {
    var st = dialog._chroma;
    if (!st || st.finalized) return;
    st.finalized = true;
    dialog.classList.remove('is-open');
    openDialogs = openDialogs.filter(function (d) { return d !== dialog; });
    if (!openDialogs.length) root.classList.remove('is-locked');
    var rf = st.returnFocus;
    if (rf && typeof rf.focus === 'function' && doc.contains(rf)) {
      try { rf.focus({ preventScroll: true }); } catch (e) { rf.focus(); }
    }
    if (st.opts.onClosed) st.opts.onClosed();
    modalListeners.forEach(function (fn) { fn(openDialogs.length > 0); });
  }

  C.modal = {
    open: function (dialog, opts) {
      if (!dialog) return;
      opts = opts || {};
      dialog._chroma = {
        opts: opts,
        returnFocus: opts.returnFocus || doc.activeElement,
        finalized: false
      };
      if (!dialog._chromaBound) {
        dialog._chromaBound = true;
        dialog.addEventListener('cancel', function (e) {
          e.preventDefault();
          var st = dialog._chroma;
          if (st && st.opts.onRequestClose) st.opts.onRequestClose();
          else C.modal.close(dialog);
        });
        /* Se o navegador fechar o diálogo por conta própria, ainda limpamos tudo. */
        dialog.addEventListener('close', function () { finalizeDialog(dialog); });
      }
      root.classList.add('is-locked');
      try {
        if (typeof dialog.showModal === 'function') { if (!dialog.open) dialog.showModal(); }
        else dialog.setAttribute('open', '');
      } catch (e) {
        dialog.setAttribute('open', '');
      }
      if (openDialogs.indexOf(dialog) === -1) openDialogs.push(dialog);
      nextFrame(function () { dialog.classList.add('is-open'); });
      modalListeners.forEach(function (fn) { fn(true); });
    },

    close: function (dialog, delay) {
      if (!dialog || !dialog._chroma || dialog._chroma.finalized) return;
      var session = dialog._chroma;
      dialog.classList.remove('is-open');
      var wait = reduced ? 40 : (typeof delay === 'number' ? delay : 420);
      setTimeout(function () {
        /* Reaberto durante a transição de saída: não fecha a nova sessão. */
        if (dialog._chroma !== session || session.finalized) return;
        var nativeClose = typeof dialog.close === 'function' && dialog.open;
        try {
          if (nativeClose) dialog.close();
          else dialog.removeAttribute('open');
        } catch (e) {
          dialog.removeAttribute('open');
        }
        if (!nativeClose) finalizeDialog(dialog);
      }, wait);
    },

    setReturnFocus: function (dialog, node) {
      if (dialog && dialog._chroma) dialog._chroma.returnFocus = node;
    },

    isOpen: function () { return openDialogs.length > 0; },
    onChange: function (fn) { modalListeners.push(fn); }
  };

  /* ------------------------------------------------------------------------
     Menu (telas menores)
     ------------------------------------------------------------------------ */
  var menu = $('#menu');
  var menuOpenBtn = $('[data-menu-open]');
  var menuCloseBtn = $('[data-menu-close]');
  var menuOpen = false;

  function closeMenu() { C.modal.close(menu, 320); }

  if (menu && menuOpenBtn) {
    menuOpenBtn.addEventListener('click', function () {
      menuOpen = true;
      menuOpenBtn.setAttribute('aria-expanded', 'true');
      C.modal.open(menu, {
        returnFocus: menuOpenBtn,
        onRequestClose: closeMenu,
        onClosed: function () {
          menuOpen = false;
          menuOpenBtn.setAttribute('aria-expanded', 'false');
        }
      });
      if (menuCloseBtn) setTimeout(function () { menuCloseBtn.focus(); }, 30);
    });
    if (menuCloseBtn) menuCloseBtn.addEventListener('click', closeMenu);

    $$('.menu__link', menu).forEach(function (link) {
      link.addEventListener('click', function (e) {
        var hash = link.getAttribute('href');
        e.preventDefault();
        C.modal.setReturnFocus(menu, null);
        C.modal.close(menu, 260);
        setTimeout(function () {
          var target = doc.querySelector(hash);
          if (!target) return;
          target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
          try { if (history.pushState) history.pushState(null, '', hash); } catch (err) { /* file:// */ }
          target.setAttribute('tabindex', '-1');
          try { target.focus({ preventScroll: true }); } catch (err) { /* ignora */ }
        }, reduced ? 80 : 320);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Rolagem: barra de progresso, topbar, parallax discreto
     ------------------------------------------------------------------------ */
  var topbar = $('[data-topbar]');
  var progress = $('[data-progress]');
  var parallaxItems = [];
  var lastY = window.pageYOffset || 0;
  var ticking = false;
  /* A topbar só se esconde quando o visitante rola de propósito (roda do
     mouse, toque, teclado) — nunca ao saltar para uma âncora. */
  var lastGesture = 0;
  ['wheel', 'touchmove', 'keydown'].forEach(function (type) {
    window.addEventListener(type, function () { lastGesture = Date.now(); }, { passive: true });
  });

  function updateParallax() {
    if (!parallaxItems.length) return;
    var vh = window.innerHeight;
    parallaxItems.forEach(function (it) {
      if (reduced) { it.node.style.removeProperty('--py'); return; }
      var r = (it.node.parentNode || it.node).getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var off = (r.top + r.height / 2) - vh / 2;
      it.node.style.setProperty('--py', (-off * it.f).toFixed(1) + 'px');
    });
  }

  function onScrollFrame() {
    ticking = false;
    var y = window.pageYOffset || 0;
    var max = Math.max(1, root.scrollHeight - window.innerHeight);
    if (progress) progress.style.transform = 'scaleX(' + clamp(y / max, 0, 1).toFixed(4) + ')';
    if (topbar) {
      topbar.classList.toggle('is-solid', y > 40);
      var vh = window.innerHeight;
      var byGesture = Date.now() - lastGesture < 600;
      if (y > vh * 0.9 && y > lastY + 6 && byGesture && !menuOpen && !topbar.contains(doc.activeElement)) {
        topbar.classList.add('is-hidden');
      } else if (y < lastY - 6 || y < vh * 0.5) {
        topbar.classList.remove('is-hidden');
      }
    }
    lastY = y;
    updateParallax();
  }

  function requestScrollFrame() {
    if (!ticking) { ticking = true; raf(onScrollFrame); }
  }
  window.addEventListener('scroll', requestScrollFrame, { passive: true });
  window.addEventListener('resize', requestScrollFrame);
  if (topbar) topbar.addEventListener('focusin', function () { topbar.classList.remove('is-hidden'); });
  requestScrollFrame();

  C.parallax = function (node, factor) {
    if (!node) return;
    parallaxItems.push({ node: node, f: factor || 0.1 });
    requestScrollFrame();
  };
  C.motion.onChange(function () { updateParallax(); });
})();
