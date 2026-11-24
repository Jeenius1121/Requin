/* =====================================================================
   LE REQUIN CORAIL — interactions du site
===================================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Typographie française : espace fine insécable avant ! ? ; : » et après « */
  function fr(s) {
    return String(s).replace(/ ([!?;:»])/g, ' $1').replace(/« /g, '« ');
  }
  function typo(root) {
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (n) {
      var p = n.parentNode && n.parentNode.nodeName;
      if (p === 'SCRIPT' || p === 'STYLE') return;
      var t = fr(n.nodeValue);
      if (t !== n.nodeValue) n.nodeValue = t;
    });
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ------------------------------------------------------------------
     Progression (gardée dans le navigateur de l'élève)
  ------------------------------------------------------------------ */
  var KEY = 'requin-corail-v1';
  var state = { badges: {}, anatomy: [], places: [], pledges: [], best: 0 };
  try {
    var raw = window.localStorage.getItem(KEY);
    if (raw) {
      var saved = JSON.parse(raw);
      Object.keys(state).forEach(function (k) { if (saved && saved[k] !== undefined) state[k] = saved[k]; });
    }
  } catch (e) { /* stockage indisponible : on continue sans */ }
  function save() {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* rien */ }
  }

  /* ------------------------------------------------------------------
     Badges du carnet de plongée
  ------------------------------------------------------------------ */
  var BADGES = [
    { id: 'identite', name: 'Identité', how: 'Résoudre le mystère du nom', icon: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.8-1.5 5.2-1.5 6 0M14 10h4M14 13h3"/>' },
    { id: 'anatomiste', name: 'Anatomiste', how: 'Trouver les 10 secrets du corps', icon: '<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>' },
    { id: 'mesureur', name: 'Mesureur', how: 'Te comparer au requin', icon: '<rect x="2.5" y="8" width="19" height="8" rx="1.5"/><path d="M6 8v3M9.5 8v4M13 8v3M16.5 8v4"/>' },
    { id: 'cartographe', name: 'Cartographe', how: 'Visiter les 10 lieux de la carte', icon: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>' },
    { id: 'noctambule', name: 'Noctambule', how: 'Passer une nuit sur le récif', icon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>' },
    { id: 'chasseur', name: 'Chasseur de nuit', how: 'Attraper 6 proies ou plus', icon: '<circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="7.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>' },
    { id: 'croissance', name: 'Croissance', how: 'Faire grandir le requin jusqu\'à 25 ans', icon: '<path d="M4 20h16M7 20v-5M12 20V10M17 20V4"/>' },
    { id: 'detective', name: 'Détective', how: 'Réussir les 2 photos du détective', icon: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>' },
    { id: 'gardien', name: 'Gardien du récif', how: 'Prendre les 4 engagements', icon: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>' },
    { id: 'expert', name: 'Expert', how: 'Obtenir 8/10 au grand quiz', icon: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>' }
  ];
  function iconSVG(b) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + b.icon + '</svg>'; }
  function badgeCount() { return BADGES.filter(function (b) { return state.badges[b.id]; }).length; }

  function renderBadges() {
    var list = $('#badges');
    list.innerHTML = BADGES.map(function (b) {
      var won = !!state.badges[b.id];
      return '<li class="badge' + (won ? ' won' : '') + '"><span class="badge-icon">' + iconSVG(b) + '</span>' +
        '<span><b>' + esc(b.name) + '</b><small>' + (won ? 'Gagné' : esc(b.how)) + '</small></span></li>';
    }).join('');
    typo(list);
    $('#badge-count').textContent = badgeCount() + '/10';
    var cb = $('#cert-badges');
    if (cb) cb.textContent = badgeCount() + '/10';
  }

  var toastTimer;
  function toastBadge(id) {
    var b = BADGES.filter(function (x) { return x.id === id; })[0];
    var t = $('#toast');
    t.innerHTML = '<span class="badge-icon">' + iconSVG(b) + '</span><span><small>Nouveau badge</small>' + esc(b.name) + '</span>';
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3200);
    var btn = $('#carnet-open');
    btn.classList.remove('bump'); void btn.offsetWidth; btn.classList.add('bump');
  }

  function unlock(id) {
    if (state.badges[id]) return;
    state.badges[id] = Date.now();
    save();
    renderBadges();
    toastBadge(id);
  }

  /* Carnet (tiroir) */
  var carnet = $('#carnet');
  var lastFocus = null;
  function openCarnet() {
    lastFocus = document.activeElement;
    carnet.hidden = false;
    $('.icon-btn', carnet).focus();
  }
  function closeCarnet() {
    carnet.hidden = true;
    $('#reset-confirm').hidden = true;
    if (lastFocus) lastFocus.focus();
  }
  $('#carnet-open').addEventListener('click', openCarnet);
  $$('[data-close]', carnet).forEach(function (el) { el.addEventListener('click', closeCarnet); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !carnet.hidden) closeCarnet(); });
  $('#reset-progress').addEventListener('click', function () { $('#reset-confirm').hidden = false; });
  $('#reset-no').addEventListener('click', function () { $('#reset-confirm').hidden = true; });
  $('#reset-yes').addEventListener('click', function () {
    try { window.localStorage.removeItem(KEY); } catch (e) { /* rien */ }
    window.location.reload();
  });

  /* ------------------------------------------------------------------
     Ordinateur de plongée : profondeur selon le défilement
  ------------------------------------------------------------------ */
  var stops = $$('[data-depth]');
  var MAX_DEPTH = 40;
  var stopList = $('#gauge-stops');
  stopList.innerHTML = stops.map(function (s) {
    var d = +s.dataset.depth;
    return '<li style="--p:' + (d / MAX_DEPTH * 100) + '%"><a href="#' + s.id + '" aria-label="' + esc(s.dataset.name) + ', ' + d + ' mètres"><span><i>−' + d + ' m</i>' + esc(fr(s.dataset.name)) + '</span></a></li>';
  }).join('');
  var stopLinks = $$('a', stopList);
  var depthEl = $('#depth-value');
  var fillEl = $('#gauge-fill');
  var horizontal = window.matchMedia('(max-width: 959px)');

  function updateDepth() {
    var ref = window.scrollY + window.innerHeight * 0.4;
    var depth = 0, current = 0;
    for (var i = 0; i < stops.length; i++) {
      var top = stops[i].getBoundingClientRect().top + window.scrollY;
      var d = +stops[i].dataset.depth;
      if (ref >= top) {
        current = i;
        var next = stops[i + 1];
        if (next) {
          var nTop = next.getBoundingClientRect().top + window.scrollY;
          var k = Math.min(1, (ref - top) / Math.max(1, nTop - top));
          depth = d + (+next.dataset.depth - d) * k;
        } else {
          depth = d;
        }
      }
    }
    depthEl.textContent = Math.round(depth);
    var pct = depth / MAX_DEPTH * 100;
    if (horizontal.matches) { fillEl.style.width = pct + '%'; fillEl.style.height = ''; }
    else { fillEl.style.height = pct + '%'; fillEl.style.width = ''; }
    stopLinks.forEach(function (a, i) {
      a.classList.toggle('passed', i <= current);
      a.classList.toggle('current', i === current);
    });
  }
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; updateDepth(); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  /* ------------------------------------------------------------------
     Lecture à voix haute (pour les plus jeunes lecteurs)
  ------------------------------------------------------------------ */
  var synth = window.speechSynthesis;
  var voice = null;
  var speakingBtn = null;
  if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') {
    document.documentElement.classList.add('no-speech');
  } else {
    var pickVoice = function () {
      var vs = synth.getVoices() || [];
      voice = vs.filter(function (v) { return /^fr[-_]FR/i.test(v.lang); })[0] ||
        vs.filter(function (v) { return /^fr/i.test(v.lang); })[0] || null;
    };
    pickVoice();
    if (typeof synth.addEventListener === 'function') synth.addEventListener('voiceschanged', pickVoice);
  }
  function stopSpeaking() {
    if (synth) synth.cancel();
    if (speakingBtn) speakingBtn.classList.remove('is-speaking');
    speakingBtn = null;
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.listen');
    if (!btn || !synth) return;
    if (speakingBtn === btn) { stopSpeaking(); return; }
    stopSpeaking();
    var text = btn.dataset.lire.split(',').map(function (sel) {
      var el = $(sel.trim());
      return el ? el.textContent.trim() : '';
    }).filter(Boolean).join('. ');
    if (!text) return;
    var u = new SpeechSynthesisUtterance(text.replace(/ /g, ' '));
    u.lang = 'fr-FR';
    u.rate = 0.92;
    if (voice) u.voice = voice;
    u.onend = u.onerror = function () { if (speakingBtn === btn) stopSpeaking(); };
    speakingBtn = btn;
    btn.classList.add('is-speaking');
    synth.speak(u);
  });

  /* ------------------------------------------------------------------
     Illustrations
  ------------------------------------------------------------------ */
  $('#hero-shark').innerHTML = Shark.svg({ variant: 'corail' });
  $('#id-shark').innerHTML = Shark.svg({ variant: 'corail', label: 'Illustration du requin corail, vu de profil' });
  $('#cert-shark').innerHTML = Shark.svg({ variant: 'corail' });

  /* ------------------------------------------------------------------
     Palier 1 : le mystère du nom
  ------------------------------------------------------------------ */
  $('#flip-name').addEventListener('click', function () {
    var on = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', String(on));
    if (on) unlock('identite');
  });

  /* ------------------------------------------------------------------
     Palier 2 : anatomie
  ------------------------------------------------------------------ */
  var PARTS = [
    { id: 'dorsale', x: 586, y: 66, title: 'La pointe blanche', text: "Le bout de sa grande nageoire du dos est blanc. C'est le meilleur moyen de le reconnaître sous l'eau ! Cette nageoire l'empêche aussi de rouler sur le côté quand il nage.", extra: "En anglais, on l'appelle « whitetip reef shark » : le requin de récif à pointe blanche." },
    { id: 'queue', x: 72, y: 96, title: 'La queue', text: "Sa queue s'appelle la nageoire caudale. En la balançant de gauche à droite, il avance. Le haut de la queue est plus grand que le bas, et il porte lui aussi une pointe blanche.", extra: "Les poissons balancent leur queue de gauche à droite. Les dauphins, eux, la bougent de haut en bas." },
    { id: 'oeil', x: 903, y: 166, title: "L'œil", text: "Au fond de son œil, une couche brillante renvoie la lumière, comme un miroir. Grâce à elle, il voit bien quand il fait sombre.", extra: "Les chats ont le même miroir : c'est pour ça que leurs yeux brillent dans le noir quand on les éclaire." },
    { id: 'museau', x: 954, y: 192, title: 'Le museau', text: "Son museau est court et arrondi. Il porte les narines, qui servent seulement à sentir, et de minuscules pores : les ampoules de Lorenzini. Elles captent le courant électrique des animaux cachés.", extra: "Devant chaque narine, il a un petit rabat de peau en forme de tube." },
    { id: 'bouche', x: 884, y: 216, title: 'La bouche et les dents', text: "Sa bouche est placée sous la tête. Ses petites dents ont trois pointes : une grande au milieu et deux minuscules sur les côtés. Parfait pour attraper des poissons glissants.", extra: "Il perd souvent des dents, mais une nouvelle dent avance aussitôt pour la remplacer." },
    { id: 'branchies', x: 834, y: 188, title: 'Les branchies', text: "Ces 5 fentes sur le côté de sa tête sont ses branchies. L'eau entre par la bouche et ressort par les fentes. Au passage, les branchies prennent l'oxygène contenu dans l'eau.", extra: "Il peut respirer sans nager : posé au fond, il pompe l'eau avec sa bouche." },
    { id: 'pectorale', x: 738, y: 262, title: 'Les nageoires pectorales', text: "Ces deux grandes nageoires, une de chaque côté, sont comme les ailes d'un avion. Elles l'aident à monter, à descendre et à tourner. Au fond, il peut se poser dessus.", extra: "Il a 8 nageoires en tout : 2 sur le dos, 2 pectorales, 2 pelviennes, 1 anale et la queue." },
    { id: 'ligne', x: 520, y: 154, title: 'La ligne latérale', text: "Le long de son corps court une ligne de minuscules capteurs. Elle sent les vibrations de l'eau : un poisson qui bouge, un crabe qui gratte le sable…", extra: "Les poissons ont aussi une ligne latérale. Cherche-la sur un poisson, la prochaine fois que tu iras au marché !" },
    { id: 'peau', x: 650, y: 208, title: 'La peau', text: "Sa peau est couverte de milliers de minuscules écailles en forme de dents : les denticules. Elles l'aident à glisser dans l'eau sans bruit.", extra: "Caressée de la tête vers la queue, sa peau est douce. Dans l'autre sens, elle gratte comme du papier de verre !" },
    { id: 'taches', x: 408, y: 178, title: 'Les taches', text: "Beaucoup de requins corail ont de petites taches sombres sur le corps. Leur dessin change d'un requin à l'autre, un peu comme tes empreintes digitales.", extra: "Des scientifiques se servent des photos prises par les plongeurs pour reconnaître chaque requin et suivre ses déplacements." }
  ];
  $('#anatomy-shark').innerHTML = Shark.svg({ variant: 'corail', details: true, label: 'Requin corail avec ses parties du corps à découvrir' });
  var hsBox = $('#hotspots');
  var chipBox = $('#anatomy-chips');
  hsBox.innerHTML = PARTS.map(function (p, i) {
    return '<button type="button" class="hotspot" data-part="' + i + '" style="left:' + (p.x / 10) + '%;top:' + (p.y / 3.6) + '%" aria-label="' + esc(p.title) + '"></button>';
  }).join('');
  chipBox.innerHTML = PARTS.map(function (p, i) {
    return '<button type="button" class="chip" data-part="' + i + '">' + esc(p.title) + '</button>';
  }).join('');

  function showPart(i, fromUser) {
    var p = PARTS[i];
    if (state.anatomy.indexOf(p.id) < 0) { state.anatomy.push(p.id); save(); }
    $('#anatomy-title').textContent = fr(p.title);
    $('#anatomy-text').textContent = fr(p.text);
    $('#anatomy-extra').textContent = fr(p.extra);
    var n = state.anatomy.length;
    $('#anatomy-count').textContent = n;
    $('#anatomy-bar').style.width = (n * 10) + '%';
    $$('.hotspot, .chip', $('#anatomie')).forEach(function (b) {
      var j = +b.dataset.part;
      b.classList.toggle('active', j === i);
      b.classList.toggle('seen', state.anatomy.indexOf(PARTS[j].id) >= 0);
    });
    if (fromUser && n >= PARTS.length) unlock('anatomiste');
  }
  $('#anatomie').addEventListener('click', function (e) {
    var b = e.target.closest('[data-part]');
    if (b) showPart(+b.dataset.part, true);
  });
  showPart(0, false);
  typo(chipBox);
  // Sur petit écran, on montre d'abord le milieu du requin
  var anaScroll = $('.anatomy-scroll');
  anaScroll.scrollLeft = (anaScroll.scrollWidth - anaScroll.clientWidth) / 2;

  /* ------------------------------------------------------------------
     Curseurs : remplissage coloré de la piste
  ------------------------------------------------------------------ */
  function paintRange(input) {
    var pct = (input.value - input.min) / (input.max - input.min) * 100;
    input.style.setProperty('--fill', pct + '%');
  }

  function cmText(cm) {
    cm = Math.round(cm);
    if (cm < 100) return cm + ' cm';
    return (cm / 100).toFixed(2).replace('.', ',') + ' m';
  }

  /* ------------------------------------------------------------------
     Palier 3 : se mesurer au requin
  ------------------------------------------------------------------ */
  var NS = 'http://www.w3.org/2000/svg';
  var mSvg = $('#measure-svg');
  var heightInput = $('#my-height');
  var sharkLen = 160;
  var K = 2.2;            // pixels par centimètre
  var GROUND = 410;
  var SHARK_X = 214;
  var GRID_X = 66;

  // Fond fixe : quadrillage de 10 cm, règles, sable
  (function drawMeasureBase() {
    var g = '';
    for (var i = 0; i <= 18; i++) {
      var y = GROUND - i * 10 * K;
      g += '<line class="m-grid" x1="' + GRID_X + '" x2="712" y1="' + y + '" y2="' + y + '"/>';
    }
    for (var j = 0; j <= 22; j++) {
      var x = SHARK_X + j * 10 * K;
      g += '<line class="m-grid" x1="' + x + '" x2="' + x + '" y1="' + (GROUND - 180 * K) + '" y2="' + GROUND + '"/>';
    }
    g += '<rect class="m-sand" x="0" y="' + GROUND + '" width="720" height="30"/>';
    g += '<line class="m-axis" x1="' + GRID_X + '" x2="712" y1="' + GROUND + '" y2="' + GROUND + '"/>';
    [[0, '0'], [50, '50 cm'], [100, '1 m'], [150, '1,50 m']].forEach(function (t) {
      g += '<text class="m-label" x="' + (GRID_X - 6) + '" y="' + (GROUND - t[0] * K + 4) + '" text-anchor="end">' + t[1] + '</text>';
    });
    [[0, '0'], [50, '50 cm'], [100, '1 m'], [150, '1,50 m'], [200, '2 m']].forEach(function (t) {
      g += '<text class="m-label" x="' + (SHARK_X + t[0] * K) + '" y="432" text-anchor="middle">' + t[1] + '</text>';
    });
    g += '<g id="m-dyn"></g>';
    mSvg.innerHTML = g;
  })();

  var KID = '<circle cx="20" cy="9" r="8.5"/><path d="M8,21 Q20,17 32,21 L36,54 Q36.5,57 33.5,57 L31,57 L30,97 Q30,100 27,100 L23,100 L20,62 L17,100 L13,100 Q10,100 10,97 L9,57 L6.5,57 Q3.5,57 4,54 Z"/>';
  var measureSharkInner = Shark.svg({ variant: 'corail' }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');

  function drawMeasure() {
    var h = +heightInput.value;
    var hp = h * K;
    var s = hp / 100;
    var kidX = 122;
    var g = '';
    // Enfant
    g += '<g class="m-kid" transform="translate(' + (kidX - 20 * s * 0.8) + ',' + (GROUND - hp) + ') scale(' + (s * 0.8) + ',' + s + ')">' + KID + '</g>';
    g += '<path class="m-dim" d="M188 ' + GROUND + 'V' + (GROUND - hp) + 'M182 ' + (GROUND - hp) + 'h12M182 ' + GROUND + 'h12"/>';
    g += '<text class="m-tag" x="' + kidX + '" y="' + (GROUND - hp - 30) + '" text-anchor="middle">Toi</text>';
    g += '<text class="m-tag-sub" x="' + kidX + '" y="' + (GROUND - hp - 10) + '" text-anchor="middle">' + cmText(h) + '</text>';
    // Requin posé sur le sable
    var w = sharkLen * K;
    var sh = w * 282 / 926;
    var top = GROUND - sh;
    g += '<svg x="' + SHARK_X + '" y="' + top + '" width="' + w + '" height="' + sh + '" viewBox="42 30 926 282">' + measureSharkInner + '</svg>';
    var dimY = top - 14;
    g += '<path class="m-dim" d="M' + SHARK_X + ' ' + dimY + 'H' + (SHARK_X + w) + 'M' + SHARK_X + ' ' + (dimY - 6) + 'v12M' + (SHARK_X + w) + ' ' + (dimY - 6) + 'v12"/>';
    g += '<text class="m-tag" x="' + SHARK_X + '" y="' + (dimY - 34) + '">' + (sharkLen < 100 ? 'Bébé requin corail' : 'Requin corail adulte') + '</text>';
    g += '<text class="m-tag-sub" x="' + SHARK_X + '" y="' + (dimY - 14) + '">' + cmText(sharkLen) + '</text>';
    $('#m-dyn').innerHTML = g;

    $('#my-height-out').textContent = cmText(h);
    var diff = sharkLen - h;
    var msg;
    if (Math.abs(diff) < 2) msg = 'Incroyable : vous avez <b>exactement la même taille</b> !';
    else if (diff > 0) msg = 'Le requin est plus long que toi de <b>' + cmText(diff) + '</b>.';
    else msg = 'Tu es plus grand que lui de <b>' + cmText(-diff) + '</b>.' + (sharkLen < 100 ? ' Pourtant, ce bébé sait déjà nager et chasser tout seul !' : '');
    $('#measure-result').innerHTML = fr(msg);
    paintRange(heightInput);
  }
  heightInput.addEventListener('input', function () { drawMeasure(); unlock('mesureur'); });
  $$('#taille .seg-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      sharkLen = +b.dataset.len;
      $$('#taille .seg-btn').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      drawMeasure();
      unlock('mesureur');
    });
  });
  drawMeasure();

  /* ------------------------------------------------------------------
     Palier 4 : carte du monde
  ------------------------------------------------------------------ */
  var PLACES = [
    { id: 'france', name: 'France', lat: 46.6, lon: 2.4, no: true, anchor: 'start', dx: 12, dy: 5,
      title: 'France métropolitaine', text: "Ici, pas de requin corail : l'eau est trop froide et il n'y a pas de récif de corail. Pour le rencontrer, il faut voyager vers les mers chaudes… ou vers les territoires français d'outre-mer !" },
    { id: 'merrouge', name: 'Mer Rouge', lat: 21.5, lon: 37.5, anchor: 'end', dx: -12, dy: 5,
      title: 'La mer Rouge', text: "C'est l'endroit le plus au nord-ouest où il vit. C'est ici que des savants l'ont décrit pour la première fois, en 1837. Aujourd'hui, les plongeurs le croisent souvent en Égypte." },
    { id: 'mayotte', name: 'Mayotte', lat: -12.8, lon: 45.15, anchor: 'end', dx: -12, dy: 5,
      title: 'Mayotte (France)', text: "Mayotte est entourée d'un des plus grands lagons du monde, fermé par une barrière de corail. La nuit, le requin corail y patrouille entre les coraux." },
    { id: 'reunion', name: 'La Réunion', lat: -21.1, lon: 55.5, anchor: 'start', dx: 12, dy: 8,
      title: 'La Réunion (France)', text: "Sur la côte ouest de l'île, de petits récifs de corail abritent des requins corail. Le jour, ils se reposent sous les rochers." },
    { id: 'maldives', name: 'Maldives', lat: 3.5, lon: 73.3, anchor: 'start', dx: 12, dy: 5,
      title: 'Les Maldives', text: "Ce pays est fait de plus de 1 000 petites îles posées sur des atolls : des anneaux de corail au milieu de l'océan. Un vrai paradis pour le requin corail." },
    { id: 'barriere', name: 'Grande Barrière', lat: -18, lon: 147, anchor: 'end', dx: -12, dy: 5,
      title: 'La Grande Barrière de corail (Australie)', text: "C'est le plus grand récif du monde : plus de 2 000 km de long ! Des scientifiques y étudient le requin corail depuis des années." },
    { id: 'caledonie', name: 'Nouvelle-Calédonie', lat: -21.4, lon: 165.6, anchor: 'middle', dx: 0, dy: 28,
      title: 'Nouvelle-Calédonie (France)', text: "Son immense lagon est inscrit au patrimoine mondial de l'UNESCO. On y rencontre souvent le requin corail près des passes du récif." },
    { id: 'polynesie', name: 'Polynésie', lat: -17.6, lon: -149.4, anchor: 'start', dx: 12, dy: 6,
      title: 'Polynésie française (France)', text: "Ici, tous les requins sont protégés : il est interdit de les pêcher. Ces îles sont un véritable sanctuaire pour eux." },
    { id: 'hawai', name: 'Hawaï', lat: 20.6, lon: -157, anchor: 'start', dx: 12, dy: 5,
      title: 'Hawaï (États-Unis)', text: "Au milieu du Pacifique, les plongeurs photographient les requins corail. Grâce à ces photos, les scientifiques reconnaissent chaque requin à ses taches." },
    { id: 'cocos', name: 'Île Cocos', lat: 5.53, lon: -87.05, anchor: 'end', dx: -12, dy: 5,
      title: 'Île Cocos (Costa Rica)', text: "C'est l'endroit le plus à l'est où il vit. La nuit, des dizaines de requins corail y chassent ensemble sur le récif : un spectacle célèbre dans le monde entier." }
  ];
  var M = window.MAP_DATA;
  var map = $('#world-map');
  map.setAttribute('viewBox', '0 0 ' + M.w + ' ' + M.h);
  var mm = '<defs><clipPath id="wm-clip"><path d="' + M.outline + '"/></clipPath></defs>';
  mm += '<g clip-path="url(#wm-clip)"><path d="' + M.outline + '" fill="rgba(8,60,90,.45)"/>';
  mm += '<path class="wm-grat" d="' + M.graticule + '"/>';
  mm += '<path class="wm-range" d="' + M.range + '"/>';
  mm += '<path class="wm-land" d="' + M.land + '"/></g>';
  mm += '<text x="735" y="238" class="m-label" text-anchor="middle" style="font-size:13px;letter-spacing:.2em">OCÉAN PACIFIQUE</text>';
  mm += PLACES.map(function (p, i) {
    var xy = M.places[p.id];
    return '<g class="wm-place' + (p.no ? ' no' : '') + '" data-place="' + i + '" tabindex="0" role="button" aria-label="' + esc(p.title) + '" transform="translate(' + xy[0] + ',' + xy[1] + ')">' +
      '<circle class="wm-hit" r="20"/><circle class="wm-ring" r="11"/><circle class="wm-dot" r="7"/>' +
      '<text class="wm-name" x="' + p.dx + '" y="' + p.dy + '" text-anchor="' + p.anchor + '">' + esc(p.name) + '</text></g>';
  }).join('');
  map.innerHTML = mm;
  // L'océan Indien
  var io = document.createElementNS(NS, 'text');
  io.setAttribute('x', '320'); io.setAttribute('y', '336'); io.setAttribute('text-anchor', 'middle');
  io.setAttribute('class', 'm-label'); io.setAttribute('style', 'font-size:13px;letter-spacing:.2em');
  io.textContent = 'OCÉAN INDIEN';
  map.insertBefore(io, map.querySelector('.wm-place'));

  function coord(v, pos, neg) { return Math.abs(Math.round(v)) + '° ' + (v >= 0 ? pos : neg); }
  function showPlace(i) {
    var p = PLACES[i];
    if (state.places.indexOf(p.id) < 0) { state.places.push(p.id); save(); }
    $('#map-title').textContent = fr(p.title);
    $('#map-text').textContent = fr(p.text);
    $('#map-coords').textContent = coord(p.lat, 'N', 'S') + ' · ' + coord(p.lon, 'E', 'O');
    var ms = $('#map-shark');
    ms.hidden = false;
    ms.className = 'map-shark ' + (p.no ? 'no' : 'yes');
    ms.textContent = p.no ? '✕ Pas de requin corail ici' : '✓ Le requin corail vit ici';
    refreshPlaces(i);
    if (state.places.length >= PLACES.length) unlock('cartographe');
  }
  function refreshPlaces(active) {
    var n = state.places.length;
    $('#map-count').textContent = n;
    $('#map-bar').style.width = (n * 10) + '%';
    $$('.wm-place', map).forEach(function (g) {
      var j = +g.dataset.place;
      g.classList.toggle('seen', state.places.indexOf(PLACES[j].id) >= 0);
      g.classList.toggle('active', j === active);
    });
  }
  map.addEventListener('click', function (e) {
    var g = e.target.closest('.wm-place');
    if (g) showPlace(+g.dataset.place);
  });
  map.addEventListener('keydown', function (e) {
    var g = e.target.closest('.wm-place');
    if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showPlace(+g.dataset.place); }
  });
  refreshPlaces(-1);
  var mapScroll = $('.map-scroll');
  mapScroll.scrollLeft = (mapScroll.scrollWidth - mapScroll.clientWidth) * 0.3;

  /* ------------------------------------------------------------------
     Palier 5 : jour / nuit sur le récif
  ------------------------------------------------------------------ */
  var dn = $('#daynight');
  var actors = $('#dn-actors');
  var FISH_COLORS = ['#f2c84b', '#ff9f5a', '#5ec8f2', '#f2c84b', '#9be37a'];
  var HOLES = [[15, 68], [30, 59.5], [79, 59.5], [90, 66], [56, 47.7]];
  function fishSVG(c) {
    return '<svg viewBox="0 0 40 24"><g class="fish-body"><ellipse cx="18" cy="12" rx="14" ry="8" fill="' + c + '"/><path d="M30 12L40 3v18z" fill="' + c + '"/></g><circle class="fish-eye" cx="10" cy="10" r="2.2"/></svg>';
  }
  var dnSharks = [0, 1, 2].map(function () {
    var el = document.createElement('div');
    el.className = 'actor actor-shark';
    el.innerHTML = Shark.svg({ variant: 'corail' });
    actors.appendChild(el);
    return el;
  });
  var dnFish = FISH_COLORS.map(function (c) {
    var el = document.createElement('div');
    el.className = 'actor actor-fish';
    el.innerHTML = fishSVG(c);
    actors.appendChild(el);
    return el;
  });
  // Positions en % de la scène (coin haut-gauche de chaque acteur)
  var DAY_SHARKS = [[36, 60, 1], [43, 64.5, -1], [37.5, 69, 1]];
  var NIGHT_SPOTS = [[6, 34], [26, 48], [60, 30], [66, 46], [44, 26], [12, 22], [74, 38]];
  function place(el, x, y, dir) {
    el.style.left = x + '%';
    el.style.top = y + '%';
    if (dir) el.style.transform = 'scaleX(' + dir + ')';
  }
  var dnMode = 'day';
  var dnTimer = null;
  function wander() {
    if (dnMode === 'day') {
      dnFish.forEach(function (f) {
        var x = 8 + Math.random() * 80, y = 8 + Math.random() * 34;
        var old = parseFloat(f.style.left) || 0;
        place(f, x, y, x > old ? -1 : 1);
      });
    } else {
      var used = {};
      dnSharks.forEach(function (s) {
        var k;
        do { k = Math.floor(Math.random() * NIGHT_SPOTS.length); } while (used[k]);
        used[k] = true;
        var old = parseFloat(s.style.left) || 0;
        place(s, NIGHT_SPOTS[k][0], NIGHT_SPOTS[k][1], NIGHT_SPOTS[k][0] >= old ? 1 : -1);
      });
    }
  }
  var DN_TEXT = {
    day: ['13 h 00', 'Sieste dans la grotte', "Le jour, les requins corail se reposent dans des grottes ou sous des rochers. Ils sont souvent plusieurs, parfois même empilés les uns sur les autres ! Pendant ce temps, les petits poissons nagent tranquillement autour du récif."],
    night: ['23 h 00', "C'est l'heure de la chasse", "La nuit, tout change. Les poissons se cachent dans les trous du récif pour dormir. Les requins corail sortent de leur grotte et fouillent chaque fente. Leur corps mince et leur tête plate leur permettent de se faufiler très loin dans les trous."]
  };
  function setTime(mode, fromUser) {
    dnMode = mode;
    dn.classList.toggle('night', mode === 'night');
    $$('.seg-dn .seg-btn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.time === mode)); });
    var t = DN_TEXT[mode];
    $('#dn-clock').textContent = t[0];
    $('#dn-title').textContent = fr(t[0] + ' · ' + t[1]);
    $('#dn-text').textContent = fr(t[2]);
    if (mode === 'day') {
      DAY_SHARKS.forEach(function (p, i) { place(dnSharks[i], p[0], p[1], p[2]); });
    } else {
      dnFish.forEach(function (f, i) { place(f, HOLES[i][0] - 1.6, HOLES[i][1] - 2.6, 1); });
    }
    wander();
    clearInterval(dnTimer);
    dnTimer = setInterval(wander, mode === 'day' ? 3800 : 3200);
    if (fromUser && mode === 'night') unlock('noctambule');
  }
  $$('.seg-dn .seg-btn').forEach(function (b) {
    b.addEventListener('click', function () { setTime(b.dataset.time, true); });
  });
  setTime('day', false);

  /* ------------------------------------------------------------------
     Palier 7 : croissance
  ------------------------------------------------------------------ */
  var ageInput = $('#age');
  var gSvg = $('#growth-svg');
  var GK = 640 / 170;
  var GROWTH_SHARK = Shark.svg({ variant: 'corail' }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  function lengthAt(age) { return 160 - 105 * Math.exp(-0.081 * age); }
  (function drawGrowthBase() {
    var g = '';
    var base = 200;
    for (var c = 0; c <= 170; c += 10) {
      var x = 40 + c * GK;
      g += '<line class="' + (c % 50 === 0 ? 'm-axis' : 'm-grid') + '" x1="' + x + '" x2="' + x + '" y1="' + (c % 50 === 0 ? base - 10 : base - 5) + '" y2="' + base + '"/>';
      if (c % 50 === 0) g += '<text class="m-label" x="' + x + '" y="' + (base + 22) + '" text-anchor="middle">' + (c === 0 ? '0' : c === 100 ? '1 m' : c === 150 ? '1,50 m' : c + ' cm') + '</text>';
    }
    g += '<line class="m-axis" x1="40" x2="' + (40 + 170 * GK) + '" y1="' + base + '" y2="' + base + '"/>';
    var w = 160 * GK, h = w * 282 / 926;
    g += '<svg x="40" y="' + (base - 16 - h) + '" width="' + w + '" height="' + h + '" viewBox="42 30 926 282" opacity=".13">' + GROWTH_SHARK + '</svg>';
    g += '<g id="g-dyn"></g>';
    gSvg.innerHTML = g;
  })();
  var STAGES = [
    [0, 0, 'Nouveau-né', "Il mesure environ 55 cm. Dès sa naissance, il nage et chasse tout seul de petits poissons. Il doit se méfier des gros requins !"],
    [1, 4, 'Jeune requin', "Il grandit lentement, de quelques centimètres par an. Il apprend à connaître son coin de récif et ses meilleures cachettes."],
    [5, 9, 'Il devient adulte', "Entre 5 et 9 ans, il devient adulte. Il mesure alors à peu près 1 mètre. Les femelles peuvent avoir leurs premiers bébés."],
    [10, 19, 'Adulte', "Il grandit encore, mais de plus en plus lentement. Il chasse chaque nuit et dort chaque jour dans ses grottes préférées."],
    [20, 25, 'Sage du récif', "Les plus vieux requins corail vivent environ 25 ans. Pour un requin de sa taille, c'est une longue vie !"]
  ];
  function drawGrowth() {
    var age = +ageInput.value;
    var L = lengthAt(age);
    var w = L * GK, h = w * 282 / 926, base = 200;
    var y = base - 16 - h;
    var g = '<svg x="40" y="' + y + '" width="' + w + '" height="' + h + '" viewBox="42 30 926 282">' + GROWTH_SHARK + '</svg>';
    g += '<path class="m-dim" d="M40 ' + (base - 4) + 'H' + (40 + w) + 'M' + (40 + w) + ' ' + (base - 12) + 'v16"/>';
    var tx = Math.min(40 + w + 10, 600);
    g += '<text class="m-tag-sub" x="' + tx + '" y="' + (base - 14) + '">≈ ' + Math.round(L) + ' cm</text>';
    $('#g-dyn').innerHTML = g;
    $('#age-out').textContent = age + (age > 1 ? ' ans' : ' an');
    var st = STAGES.filter(function (s) { return age >= s[0] && age <= s[1]; })[0];
    $('#growth-title').textContent = fr(st[2]);
    $('#growth-text').textContent = fr(st[3]);
    paintRange(ageInput);
  }
  ageInput.addEventListener('input', function () {
    drawGrowth();
    if (+ageInput.value === 25) unlock('croissance');
  });
  drawGrowth();

  /* ------------------------------------------------------------------
     Palier 8 : le détective
  ------------------------------------------------------------------ */
  var SPECIES = {
    corail: { name: 'Requin corail', text: "Bravo ! Pointes blanches sur la nageoire du dos et sur le haut de la queue, corps tout mince : c'est bien le requin corail." },
    pointesNoires: { name: 'Requin à pointes noires', text: "Raté : regarde le bout de ses nageoires, il est noir ! C'est le requin à pointes noires. Il vit lui aussi sur les récifs, souvent dans très peu d'eau." },
    gris: { name: 'Requin gris de récif', text: "Raté : ce requin n'a pas de pointes blanches, mais une bordure noire au bout de la queue. C'est le requin gris de récif." },
    oceanique: { name: 'Requin océanique', text: "Piège ! Il a bien des pointes blanches, mais regarde ses nageoires : elles sont immenses et arrondies. C'est le requin océanique. Il vit au large, en pleine mer, loin des récifs." }
  };
  var ROUNDS = [
    { q: 'Lequel de ces requins est un requin corail ?', options: ['pointesNoires', 'corail', 'gris'] },
    { q: 'Attention, piège ! Deux requins ont des pointes blanches. Lequel est le requin corail ?', options: ['oceanique', 'corail', 'pointesNoires'] }
  ];
  var round = 0;
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function renderRound() {
    var r = ROUNDS[round];
    $('#detect-round').textContent = 'Photo ' + (round + 1) + ' sur ' + ROUNDS.length;
    $('#detect-question').textContent = fr(r.q);
    $('#detect-feedback').innerHTML = '';
    $('#detect-next').hidden = true;
    var opts = shuffle(r.options);
    $('#detect-grid').innerHTML = opts.map(function (sp, i) {
      return '<button type="button" class="photo" data-sp="' + sp + '"><span class="mono">Photo ' + 'ABC'[i] + '</span>' +
        Shark.svg({ variant: sp }) + '<span class="photo-name" aria-live="polite"></span><span class="photo-verdict" hidden></span></button>';
    }).join('');
  }
  $('#detect-grid').addEventListener('click', function (e) {
    var b = e.target.closest('.photo');
    if (!b || b.classList.contains('right') || $('#detect-grid .photo.right')) return;
    var sp = b.dataset.sp;
    var ok = sp === 'corail';
    b.classList.add(ok ? 'right' : 'wrong');
    $('.photo-name', b).textContent = SPECIES[sp].name;
    var v = $('.photo-verdict', b);
    v.hidden = false;
    v.textContent = ok ? 'Trouvé' : 'Non';
    $('#detect-feedback').innerHTML = '<span class="' + (ok ? 'ok' : 'ko') + '">' + esc(fr(SPECIES[sp].text)) + '</span>';
    if (ok) {
      $$('#detect-grid .photo').forEach(function (p) { $('.photo-name', p).textContent = SPECIES[p.dataset.sp].name; });
      var next = $('#detect-next');
      next.hidden = false;
      if (round === ROUNDS.length - 1) {
        next.textContent = 'Rejouer';
        unlock('detective');
      } else {
        next.textContent = 'Photo suivante';
      }
    }
  });
  $('#detect-next').addEventListener('click', function () {
    round = (round + 1) % ROUNDS.length;
    renderRound();
  });
  renderRound();

  /* ------------------------------------------------------------------
     Palier 9 : mythe ou réalité
  ------------------------------------------------------------------ */
  var MYTHS = [
    { q: 'Le requin corail attaque les nageurs.', real: false, a: "Il est plutôt calme et curieux. Il s'approche parfois des plongeurs pour les observer. Les morsures sont très rares, presque toujours quand quelqu'un pêche près de lui ou l'embête." },
    { q: 'Les requins sont utiles au récif.', real: true, a: "En chassant, les requins attrapent souvent les poissons malades ou affaiblis. Ils aident ainsi le récif à rester en bonne santé." },
    { q: "Le requin corail n'a peur de personne.", real: false, a: "Il a des ennemis : le requin-tigre, le requin des Galápagos et le mérou géant peuvent le manger." },
    { q: 'On peut le voir de près en plongée.', real: true, a: "C'est l'un des requins que les plongeurs voient le plus souvent sur les récifs. Il faut simplement le respecter et ne jamais le toucher." }
  ];
  $('#myths').innerHTML = MYTHS.map(function (m, i) {
    return '<button type="button" class="myth" data-myth="' + i + '" aria-expanded="false"><span class="myth-q">«&#8239;' + esc(m.q) + '&#8239;»</span><span class="myth-hint">Mythe ou réalité&#8239;? Touche pour savoir</span></button>';
  }).join('');
  $('#myths').addEventListener('click', function (e) {
    var b = e.target.closest('.myth');
    if (!b || b.getAttribute('aria-expanded') === 'true') return;
    var m = MYTHS[+b.dataset.myth];
    b.setAttribute('aria-expanded', 'true');
    b.classList.add(m.real ? 'is-real' : 'is-myth');
    $('.myth-hint', b).remove();
    b.insertAdjacentHTML('beforeend', '<span class="myth-tag">' + (m.real ? 'Réalité' : 'Mythe') + '</span><span class="myth-a">' + esc(fr(m.a)) + '</span>');
  });
  typo($('#myths'));

  /* ------------------------------------------------------------------
     Palier 10 : Liste rouge UICN + engagements
  ------------------------------------------------------------------ */
  var IUCN = [
    { code: 'LC', name: 'Préoccupation mineure', bg: 'var(--iucn-lc)', fg: '#0d2a0a', text: "L'espèce est nombreuse et n'est pas menacée pour l'instant. Exemple : le pigeon des villes." },
    { code: 'NT', name: 'Quasi menacée', bg: 'var(--iucn-nt)', fg: '#2a2e00', text: "L'espèce n'est pas encore menacée, mais elle pourrait bientôt l'être. Exemple : le requin peau bleue." },
    { code: 'VU', name: 'Vulnérable', bg: 'var(--iucn-vu)', fg: '#2b2500', here: true, text: "C'est la case du requin corail. L'espèce court un risque élevé de disparaître dans la nature : leur nombre a beaucoup baissé ces dernières dizaines d'années." },
    { code: 'EN', name: 'En danger', bg: 'var(--iucn-en)', fg: '#2e1200', text: "Le risque de disparaître est très élevé. Exemple : le requin-baleine, le plus grand poisson du monde." },
    { code: 'CR', name: 'En danger critique', bg: 'var(--iucn-cr)', fg: '#ffffff', text: "L'espèce est tout près de disparaître. Exemple : l'ange de mer, un requin plat qui vivait autrefois en grand nombre sur les côtes françaises." },
    { code: 'EW', name: 'Éteinte à l\'état sauvage', bg: 'var(--iucn-ew)', fg: '#ffffff', text: "L'espèce n'existe plus dans la nature. Elle ne survit que dans des zoos, des aquariums ou des jardins." },
    { code: 'EX', name: 'Éteinte', bg: 'var(--iucn-ex)', fg: '#ffffff', text: "L'espèce a complètement disparu de la Terre. Exemple : le dodo, un gros oiseau de l'île Maurice, disparu à la fin des années 1600." }
  ];
  $('#iucn-scale').innerHTML = IUCN.map(function (c, i) {
    return '<button type="button" class="iucn-cell' + (c.here ? ' here' : '') + '" data-iucn="' + i + '" aria-pressed="false" style="background:' + c.bg + ';color:' + c.fg + '">' + c.code + '<small>' + esc(c.name) + '</small></button>';
  }).join('');
  function showIucn(i) {
    var c = IUCN[i];
    $$('.iucn-cell').forEach(function (b) { b.setAttribute('aria-pressed', String(+b.dataset.iucn === i)); });
    $('#iucn-title').textContent = c.code + ' · ' + c.name;
    $('#iucn-text').textContent = fr(c.text);
  }
  $('#iucn-scale').addEventListener('click', function (e) {
    var b = e.target.closest('.iucn-cell');
    if (b) showIucn(+b.dataset.iucn);
  });
  showIucn(2);

  var pledges = $$('#pledge-list input');
  pledges.forEach(function (p) {
    p.checked = state.pledges.indexOf(p.value) >= 0;
    p.addEventListener('change', function () {
      state.pledges = pledges.filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
      save();
      if (state.pledges.length === pledges.length) unlock('gardien');
    });
  });

  /* ------------------------------------------------------------------
     Grand quiz + brevet
  ------------------------------------------------------------------ */
  var QUIZ = [
    { q: 'Pourquoi l\'appelle-t-on aussi « requin à pointes blanches de récif » ?', a: ['Le bout de deux de ses nageoires est blanc', 'Ses dents sont très blanches', 'Il vit sur des plages de sable blanc'], c: 0, e: 'Le bout de la grande nageoire du dos et le haut de la queue sont blancs.' },
    { q: 'À quel moment le requin corail chasse-t-il surtout ?', a: ['Le matin', 'La nuit', 'À midi'], c: 1, e: 'Il est nocturne : il se repose le jour et chasse la nuit.' },
    { q: 'Peut-il rester immobile au fond sans s\'étouffer ?', a: ['Non, il doit nager tout le temps', 'Oui, il remonte respirer de l\'air', 'Oui, il pompe l\'eau avec sa bouche'], c: 2, e: 'Il fait passer l\'eau dans ses branchies en pompant avec sa bouche.' },
    { q: 'Combien mesure un grand requin corail adulte ?', a: ['Environ 30 cm', 'Environ 1,60 m', 'Environ 10 m'], c: 1, e: 'Environ 1,60 m. Les plus grands dépassent à peine 2 m.' },
    { q: 'Que trouve-t-on au menu du requin corail ?', a: ['Des algues et du corail', 'Des poissons, des poulpes et des crabes', 'Des baleines'], c: 1, e: 'Il chasse les animaux cachés dans les trous du récif.' },
    { q: 'Dans quels océans vit-il ?', a: ['L\'océan Indien et l\'océan Pacifique', 'L\'océan Atlantique, près de la France', 'L\'océan Arctique, sous la glace'], c: 0, e: 'Il vit dans les eaux chaudes, près des récifs de corail.' },
    { q: 'Que veut dire son nom scientifique « Triaenodon » ?', a: ['Requin endormi', 'Dent à trois pointes', 'Grand nageur'], c: 1, e: 'Ses dents ont une grande pointe au milieu et deux petites sur les côtés.' },
    { q: 'Combien de bébés une maman requin corail a-t-elle en une fois ?', a: ['De 1 à 5, souvent 2 ou 3', 'Des centaines', 'Toujours un seul'], c: 0, e: 'Elle a peu de bébés, et seulement tous les deux ans environ.' },
    { q: 'À quoi servent les ampoules de Lorenzini ?', a: ['À éclairer dans le noir', 'À sentir l\'électricité des animaux cachés', 'À respirer'], c: 1, e: 'Ces pores sur le museau captent le courant électrique produit par les muscles des proies.' },
    { q: 'Le requin corail est-il menacé ?', a: ['Non, il y en a de plus en plus', 'Oui, il est classé « Vulnérable »', 'Non, il a déjà disparu'], c: 1, e: 'Depuis 2020, il est classé « Vulnérable » sur la Liste rouge de l\'UICN.' }
  ];
  var qi = 0, score = 0, results = [];
  var lastScore = 0;
  function renderDots() {
    $('#quiz-dots').innerHTML = QUIZ.map(function (_, i) {
      var c = results[i] === true ? 'ok' : results[i] === false ? 'ko' : i === qi ? 'now' : '';
      return '<i class="' + c + '"></i>';
    }).join('');
  }
  function renderQuestion() {
    var q = QUIZ[qi];
    $('#quiz-num').textContent = 'Question ' + (qi + 1) + ' sur ' + QUIZ.length;
    $('#quiz-q').textContent = fr(q.q);
    $('#quiz-explain').innerHTML = '';
    $('#quiz-next').hidden = true;
    $('#quiz-answers').innerHTML = q.a.map(function (a, i) {
      return '<button type="button" class="answer" data-a="' + i + '"><span class="key">' + 'ABC'[i] + '</span><span>' + esc(fr(a)) + '</span></button>';
    }).join('');
    renderDots();
  }
  $('#quiz-answers').addEventListener('click', function (e) {
    var b = e.target.closest('.answer');
    if (!b || b.disabled) return;
    var q = QUIZ[qi];
    var i = +b.dataset.a;
    var ok = i === q.c;
    if (ok) score++;
    results[qi] = ok;
    $$('.answer', $('#quiz-answers')).forEach(function (x) {
      x.disabled = true;
      if (+x.dataset.a === q.c) x.classList.add('ok');
    });
    if (!ok) b.classList.add('ko');
    $('#quiz-explain').innerHTML = '<b>' + (ok ? 'Bonne réponse ! ' : 'Pas tout à fait. ') + '</b>' + esc(fr(q.e));
    typo($('#quiz-explain'));
    var next = $('#quiz-next');
    next.hidden = false;
    next.textContent = qi === QUIZ.length - 1 ? 'Voir mon résultat' : 'Question suivante';
    next.focus({ preventScroll: true });
    renderDots();
  });
  $('#quiz-next').addEventListener('click', function () {
    if (qi < QUIZ.length - 1) { qi++; renderQuestion(); return; }
    // Fin du quiz
    lastScore = score;
    state.best = Math.max(state.best || 0, score);
    save();
    $('#quiz-body').hidden = true;
    $('#quiz-end').hidden = false;
    $('#quiz-score').textContent = score;
    var msg;
    if (score === 10) msg = 'Parfait ! Tu connais le requin corail comme un vrai biologiste marin.';
    else if (score >= 8) msg = 'Bravo ! Tu as gagné ton brevet d\'explorateur des récifs.';
    else if (score >= 5) msg = 'Pas mal ! Remonte quelques paliers pour réviser, puis retente ta chance : il faut 8 bonnes réponses pour le brevet.';
    else msg = 'Le récif garde encore des secrets pour toi. Refais la plongée depuis le début, puis réessaie !';
    $('#quiz-msg').textContent = fr(msg);
    $('#cert-form').hidden = score < 8;
    if (score >= 8) unlock('expert');
    renderDots();
  });
  $('#quiz-restart').addEventListener('click', function () {
    qi = 0; score = 0; results = [];
    $('#quiz-body').hidden = false;
    $('#quiz-end').hidden = true;
    renderQuestion();
  });
  renderQuestion();

  $('#cert-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#cert-name').value.trim() || 'Explorateur des récifs';
    $('#cert-out-name').textContent = name;
    $('#cert-score').textContent = lastScore + '/10';
    $('#cert-badges').textContent = badgeCount() + '/10';
    $('#cert-date').textContent = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    $('#cert').hidden = false;
    $('#cert').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  // Impression : seulement quand le site est ouvert directement (pas dans un cadre)
  var standalone = true;
  try { standalone = window.self === window.top; } catch (e) { standalone = false; }
  if (standalone && typeof window.print === 'function') {
    var pb = $('#cert-print');
    pb.hidden = false;
    pb.addEventListener('click', function () {
      document.body.classList.add('print-cert');
      window.print();
    });
    window.addEventListener('afterprint', function () { document.body.classList.remove('print-cert'); });
  }

  /* ------------------------------------------------------------------
     Démarrage
  ------------------------------------------------------------------ */
  window.RequinSite = { unlock: unlock, fr: fr };
  renderBadges();
  typo(document.body);
  updateDepth();
})();
