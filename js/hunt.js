/* =====================================================================
   JEU : CHASSE DE NUIT
   Le joueur promène le « détecteur » du requin (ses ampoules de
   Lorenzini) sur le récif. Une proie cachée s'allume quand le détecteur
   la capte assez longtemps ; il faut alors cliquer dessus pour l'attraper.
===================================================================== */
(function () {
  'use strict';

  var stage = document.getElementById('hunt-stage');
  var canvas = document.getElementById('hunt-canvas');
  if (!stage || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext('2d');
  var overlay = document.getElementById('hunt-overlay');
  var startBtn = document.getElementById('hunt-start');
  var scoreEl = document.getElementById('hunt-score');
  var timeEl = document.getElementById('hunt-time');
  var toastEl = document.getElementById('hunt-toast');
  var oTitle = document.getElementById('hunt-o-title');
  var oText = document.getElementById('hunt-o-text');
  var fr = (window.RequinSite && window.RequinSite.fr) || function (s) { return s; };

  var DURATION = 45;
  var GOAL = 6;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Récif en coordonnées normalisées (0..1) */
  var ROCKS = [
    [[-0.02, 1.02], [-0.02, 0.5], [0.06, 0.46], [0.16, 0.48], [0.26, 0.5], [0.32, 0.6], [0.36, 0.72], [0.4, 1.02]],
    [[0.33, 1.02], [0.36, 0.55], [0.42, 0.4], [0.5, 0.36], [0.58, 0.4], [0.63, 0.52], [0.66, 0.7], [0.68, 1.02]],
    [[0.62, 1.02], [0.66, 0.66], [0.72, 0.54], [0.82, 0.5], [0.92, 0.52], [1.02, 0.56], [1.02, 1.02]],
    [[-0.02, 1.02], [-0.02, 0.88], [0.2, 0.92], [0.45, 0.9], [0.7, 0.92], [1.02, 0.88], [1.02, 1.02]]
  ];
  var HOLES = [[0.08, 0.62], [0.2, 0.57], [0.14, 0.78], [0.3, 0.84], [0.43, 0.5], [0.52, 0.45], [0.58, 0.62], [0.47, 0.72], [0.7, 0.8], [0.78, 0.62], [0.9, 0.67], [0.86, 0.85]];
  var CORALS = [[0.1, 0.47, '#5a3a66'], [0.22, 0.49, '#2f5f5a'], [0.47, 0.37, '#6a4630'], [0.56, 0.39, '#3b4f6e'], [0.76, 0.52, '#5a3a66'], [0.95, 0.53, '#2f5f5a']];

  var TYPES = {
    poisson: { color: '#f2c84b', fact: 'Un poisson endormi ! Les poissons sont son plat préféré.' },
    poulpe: { color: '#ff8f6b', fact: 'Un poulpe ! Il change de couleur pour se cacher, mais il ne peut pas cacher son courant électrique.' },
    crabe: { color: '#ff6b5a', fact: 'Un crabe ! Le requin corail aime aussi les crustacés.' },
    langouste: { color: '#e0a060', fact: 'Une langouste ! Cachée au fond de sa fente, elle se croyait à l\'abri.' }
  };
  var TYPE_KEYS = ['poisson', 'poisson', 'poulpe', 'crabe', 'langouste'];

  var W = 0, H = 0, dpr = 1;
  var bg = document.createElement('canvas');
  var holes = HOLES.map(function (h) { return { nx: h[0], ny: h[1], prey: null }; });
  var sense = { x: -999, y: -999, on: false };
  var shark = { x: 0, y: 0, dir: 1, ready: false };
  var particles = [];
  var running = false, timeLeft = DURATION, score = 0, last = 0, raf = 0, visible = false, nextSpawn = 0;
  var demoT = 0;

  var sharkImg = new Image();
  sharkImg.onload = function () { shark.ready = true; };
  sharkImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(window.Shark.svg({ variant: 'corail' }));

  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ---------------- Dessin du décor (une fois par taille) ---------------- */
  function smoothPath(c, pts) {
    var p = pts.map(function (q) { return [q[0] * W, q[1] * H]; });
    c.beginPath();
    c.moveTo(p[0][0], p[0][1]);
    for (var i = 0; i < p.length - 1; i++) {
      var p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    c.closePath();
  }

  function drawBackground() {
    bg.width = W * dpr; bg.height = H * dpr;
    var c = bg.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#052338'); g.addColorStop(0.55, '#031423'); g.addColorStop(1, '#010810');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Lueur de la lune à travers la surface
    var m = c.createRadialGradient(W * 0.72, -H * 0.1, 0, W * 0.72, -H * 0.1, H * 0.9);
    m.addColorStop(0, 'rgba(150,200,255,.22)'); m.addColorStop(1, 'rgba(150,200,255,0)');
    c.fillStyle = m; c.fillRect(0, 0, W, H);
    // Coraux en silhouette
    CORALS.forEach(function (k) {
      var x = k[0] * W, y = k[1] * H, s = Math.min(W, H) * 0.05;
      c.strokeStyle = k[2]; c.lineWidth = Math.max(3, s * 0.14); c.lineCap = 'round';
      c.beginPath();
      c.moveTo(x, y); c.lineTo(x, y - s);
      c.moveTo(x, y - s * 0.45); c.lineTo(x - s * 0.5, y - s * 1.05);
      c.moveTo(x, y - s * 0.6); c.lineTo(x + s * 0.45, y - s * 1.2);
      c.moveTo(x - s * 0.25, y - s * 0.75); c.lineTo(x - s * 0.55, y - s * 0.6);
      c.stroke();
    });
    // Rochers
    ROCKS.forEach(function (r, i) {
      smoothPath(c, r);
      var rg = c.createLinearGradient(0, H * 0.35, 0, H);
      rg.addColorStop(0, i === 3 ? '#0b2230' : '#123445');
      rg.addColorStop(1, '#06141d');
      c.fillStyle = rg; c.fill();
      c.strokeStyle = 'rgba(150,210,230,.13)'; c.lineWidth = 1.5; c.stroke();
    });
    // Texture : petits points
    c.fillStyle = 'rgba(160,220,240,.05)';
    for (var i = 0; i < 260; i++) {
      c.beginPath();
      c.arc(Math.random() * W, H * 0.45 + Math.random() * H * 0.55, Math.random() * 2 + 0.5, 0, 7);
      c.fill();
    }
    // Trous du récif
    holes.forEach(function (h) {
      var x = h.nx * W, y = h.ny * H, rx = holeR(), ry = rx * 0.58;
      c.beginPath(); c.ellipse(x, y + 2, rx + 3, ry + 3, 0, 0, 7); c.fillStyle = 'rgba(150,210,230,.08)'; c.fill();
      var hg = c.createRadialGradient(x, y, 0, x, y, rx);
      hg.addColorStop(0, '#000204'); hg.addColorStop(1, '#03101a');
      c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fillStyle = hg; c.fill();
    });
  }

  function holeR() { return Math.max(16, W * 0.03); }
  function senseR() { return Math.max(58, W * 0.09); }
  function hitR() { return Math.max(30, W * 0.042); }

  function resize() {
    var r = stage.getBoundingClientRect();
    W = Math.max(280, r.width); H = Math.max(200, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr; canvas.height = H * dpr;
    drawBackground();
    if (!shark.x) { shark.x = W * 0.3; shark.y = H * 0.28; }
    draw(0);
  }

  /* ---------------- Proies ---------------- */
  function spawn() {
    var free = holes.filter(function (h) { return !h.prey; });
    if (!free.length) return;
    var h = free[Math.floor(Math.random() * free.length)];
    h.prey = { type: TYPE_KEYS[Math.floor(Math.random() * TYPE_KEYS.length)], detect: 0, lockedAt: 0, phase: Math.random() * 6 };
  }
  function aliveCount() { return holes.filter(function (h) { return h.prey; }).length; }

  function drawPrey(c, type, x, y, s, alpha, t) {
    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y);
    var col = TYPES[type].color;
    c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round';
    if (type === 'poisson') {
      c.beginPath(); c.ellipse(0, 0, s, s * 0.55, 0, 0, 7); c.fill();
      c.beginPath(); c.moveTo(s * 0.8, 0); c.lineTo(s * 1.5, -s * 0.5); c.lineTo(s * 1.5, s * 0.5); c.closePath(); c.fill();
      c.fillStyle = '#0b1216'; c.beginPath(); c.arc(-s * 0.5, -s * 0.1, s * 0.13, 0, 7); c.fill();
    } else if (type === 'crabe') {
      c.lineWidth = Math.max(2, s * 0.14);
      for (var i = -1; i <= 1; i += 2) {
        for (var k = 0; k < 3; k++) {
          c.beginPath(); c.moveTo(i * s * 0.5, s * 0.1 + k * s * 0.12); c.lineTo(i * s * 1.1, s * 0.4 + k * s * 0.2); c.stroke();
        }
        c.beginPath(); c.arc(i * s * 0.95, -s * 0.45, s * 0.3, 0, 7); c.fill();
      }
      c.beginPath(); c.ellipse(0, 0, s * 0.8, s * 0.5, 0, 0, 7); c.fill();
      c.fillStyle = '#0b1216'; c.beginPath(); c.arc(-s * 0.2, -s * 0.35, s * 0.1, 0, 7); c.arc(s * 0.2, -s * 0.35, s * 0.1, 0, 7); c.fill();
    } else if (type === 'poulpe') {
      c.lineWidth = Math.max(2, s * 0.2);
      for (var j = 0; j < 5; j++) {
        var a = -0.9 + j * 0.45;
        c.beginPath(); c.moveTo(Math.sin(a) * s * 0.4, s * 0.2);
        c.quadraticCurveTo(Math.sin(a) * s * 1.1 + Math.sin(t * 3 + j) * s * 0.2, s * 0.8, Math.sin(a) * s * 1.4, s * 1.1);
        c.stroke();
      }
      c.beginPath(); c.ellipse(0, -s * 0.2, s * 0.65, s * 0.7, 0, 0, 7); c.fill();
      c.fillStyle = '#0b1216'; c.beginPath(); c.arc(-s * 0.25, -s * 0.15, s * 0.1, 0, 7); c.arc(s * 0.25, -s * 0.15, s * 0.1, 0, 7); c.fill();
    } else {
      c.lineWidth = Math.max(1.5, s * 0.08);
      c.beginPath(); c.moveTo(-s * 0.9, -s * 0.1); c.quadraticCurveTo(-s * 1.8, -s * 0.9, -s * 2.2, -s * 0.3); c.stroke();
      c.beginPath(); c.moveTo(-s * 0.9, s * 0.05); c.quadraticCurveTo(-s * 1.7, -s * 0.5, -s * 2.3, s * 0.2); c.stroke();
      for (var n = 0; n < 4; n++) {
        c.beginPath(); c.ellipse(-s * 0.6 + n * s * 0.42, 0, s * 0.3, s * 0.36 - n * 0.03 * s, 0, 0, 7); c.fill();
      }
      c.beginPath(); c.moveTo(s * 1.0, 0); c.lineTo(s * 1.45, -s * 0.35); c.lineTo(s * 1.45, s * 0.35); c.closePath(); c.fill();
    }
    c.restore();
  }

  /* ---------------- Boucle ---------------- */
  function update(dt, now) {
    if (running) {
      timeLeft -= dt;
      if (timeLeft <= 0) { timeLeft = 0; endGame(); }
      timeEl.textContent = Math.ceil(timeLeft);
      if (now > nextSpawn && aliveCount() < 6) { spawn(); nextSpawn = now + rnd(700, 1600); }
    } else {
      // Démonstration : le détecteur se promène tout seul
      demoT += dt;
      if (!reduceMotion) {
        sense.x = W * (0.5 + 0.38 * Math.sin(demoT * 0.45));
        sense.y = H * (0.62 + 0.18 * Math.sin(demoT * 0.9));
        sense.on = true;
      }
    }
    var R = senseR();
    holes.forEach(function (h) {
      var p = h.prey;
      if (!p) return;
      var x = h.nx * W, y = h.ny * H;
      var inside = sense.on && Math.hypot(sense.x - x, sense.y - y) < R;
      if (p.lockedAt) {
        // Une proie repérée finit par s'enfoncer plus loin dans son trou
        if (now - p.lockedAt > 3200) { p.detect = 0; p.lockedAt = 0; if (running) { h.prey = null; spawn(); } }
      } else if (inside) {
        p.detect = Math.min(1, p.detect + dt / 0.7);
        if (p.detect >= 1) p.lockedAt = now;
      } else {
        p.detect = Math.max(0, p.detect - dt * 0.6);
      }
    });
    // Le requin suit le détecteur
    if (sense.on) {
      var tx = sense.x - shark.dir * W * 0.14, ty = sense.y - H * 0.08;
      var vx = (tx - shark.x) * Math.min(1, dt * 2.2);
      shark.x += vx;
      shark.y += (ty - shark.y) * Math.min(1, dt * 2.2);
      if (Math.abs(sense.x - shark.x) > W * 0.05) shark.dir = sense.x > shark.x ? 1 : -1;
    }
    particles = particles.filter(function (q) {
      q.life -= dt; q.x += q.vx * dt; q.y += q.vy * dt; q.vy -= 10 * dt;
      return q.life > 0;
    });
  }

  function draw(now) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(bg, 0, 0, W, H);
    var t = now / 1000;
    var s = Math.max(9, W * 0.016);

    // Proies et signaux électriques
    holes.forEach(function (h) {
      var p = h.prey;
      if (!p || p.detect <= 0.02) return;
      var x = h.nx * W, y = h.ny * H;
      var d = p.detect;
      for (var k = 0; k < 3; k++) {
        var ph = ((t * 1.4 + k / 3 + p.phase) % 1);
        ctx.beginPath();
        ctx.ellipse(x, y, holeR() * (0.8 + ph * 2.2), holeR() * 0.58 * (0.8 + ph * 2.2), 0, 0, 7);
        ctx.strokeStyle = 'rgba(122,240,216,' + (0.55 * d * (1 - ph)) + ')';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      if (p.lockedAt) {
        ctx.save();
        ctx.shadowColor = '#7af0d8'; ctx.shadowBlur = 18;
        drawPrey(ctx, p.type, x, y - s * 0.2, s, 1, t);
        ctx.restore();
      } else {
        drawPrey(ctx, p.type, x, y, s * 0.9, d * 0.6, t);
      }
    });

    // Requin du joueur
    if (shark.ready && (sense.on || !running)) {
      var sw = Math.max(150, W * 0.24), sh = sw * 0.36;
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.translate(shark.x, shark.y);
      ctx.scale(shark.dir, 1);
      ctx.drawImage(sharkImg, -sw / 2, -sh / 2, sw, sh);
      ctx.restore();
    }

    // Détecteur
    if (sense.on) {
      var R = senseR();
      var rg = ctx.createRadialGradient(sense.x, sense.y, 0, sense.x, sense.y, R);
      rg.addColorStop(0, 'rgba(122,240,216,.16)'); rg.addColorStop(1, 'rgba(122,240,216,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(sense.x, sense.y, R, 0, 7); ctx.fill();
      ctx.save();
      ctx.setLineDash([6, 8]);
      ctx.lineDashOffset = -t * 20;
      ctx.strokeStyle = 'rgba(122,240,216,.75)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(sense.x, sense.y, R, 0, 7); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(sense.x, sense.y, 3, 0, 7); ctx.fill();
    }

    // Particules
    particles.forEach(function (q) {
      ctx.globalAlpha = Math.max(0, q.life / q.max);
      if (q.text) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 ' + Math.round(s * 1.8) + 'px "Bricolage Grotesque", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(q.text, q.x, q.y);
      } else {
        ctx.fillStyle = q.c;
        ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
    });
  }

  function loop(now) {
    raf = 0;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    update(dt, now);
    draw(now);
    if (visible || running) raf = requestAnimationFrame(loop);
  }
  function kick() {
    if (!raf) { last = 0; raf = requestAnimationFrame(loop); }
  }

  /* ---------------- Contrôles ---------------- */
  function local(e) {
    var r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  var toastTimer;
  function toast(msg) {
    toastEl.textContent = fr(msg);
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('show'); }, 2400);
  }

  canvas.addEventListener('pointermove', function (e) {
    if (!running) return;
    var p = local(e);
    sense.x = p.x; sense.y = p.y; sense.on = true;
  });
  canvas.addEventListener('pointerleave', function (e) {
    if (running && e.pointerType === 'mouse') sense.on = false;
  });
  canvas.addEventListener('pointerdown', function (e) {
    if (!running) return;
    var p = local(e);
    sense.x = p.x; sense.y = p.y; sense.on = true;
    var best = null, bestD = Infinity;
    holes.forEach(function (h) {
      if (!h.prey) return;
      var dd = Math.hypot(p.x - h.nx * W, p.y - h.ny * H);
      if (dd < hitR() + holeR() && dd < bestD) { best = h; bestD = dd; }
    });
    if (!best) return;
    if (best.prey.lockedAt) catchPrey(best);
    else toast('Trop vite ! Laisse ton détecteur capter la proie avant de mordre.');
  });

  function catchPrey(h) {
    var x = h.nx * W, y = h.ny * H;
    var type = h.prey.type;
    h.prey = null;
    score++;
    scoreEl.textContent = score;
    shark.x = x - shark.dir * W * 0.1; shark.y = y - H * 0.06;
    for (var i = 0; i < 18; i++) {
      var a = Math.random() * Math.PI * 2, v = rnd(40, 140);
      particles.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 30, r: rnd(1.5, 3.5), c: i % 2 ? '#7af0d8' : '#ffffff', life: 0.8, max: 0.8 });
    }
    particles.push({ x: x, y: y - 20, vx: 0, vy: -50, text: '+1', life: 0.9, max: 0.9 });
    toast(TYPES[type].fact);
  }

  function startGame() {
    running = true; score = 0; timeLeft = DURATION;
    scoreEl.textContent = '0'; timeEl.textContent = DURATION;
    holes.forEach(function (h) { h.prey = null; });
    for (var i = 0; i < 4; i++) spawn();
    nextSpawn = performance.now() + 1200;
    sense.on = false;
    overlay.hidden = true;
    kick();
  }

  function endGame() {
    running = false;
    sense.on = false;
    var msg;
    if (score >= 10) msg = 'Quel festin ! Tu chasses comme un vrai requin corail.';
    else if (score >= GOAL) msg = 'Belle chasse ! Ton sens électrique fonctionne à merveille.';
    else msg = 'Les proies sont bien cachées… Rappelle-toi : laisse ton détecteur sur un trou jusqu\'à ce que la proie s\'allume.';
    oTitle.textContent = score + (score > 1 ? ' proies attrapées' : ' proie attrapée');
    oText.textContent = fr(msg);
    startBtn.textContent = 'Rejouer';
    overlay.hidden = false;
    if (score >= GOAL && window.RequinSite) window.RequinSite.unlock('chasseur');
    holes.forEach(function (h) { h.prey = null; });
    for (var i = 0; i < 5; i++) spawn();
  }

  startBtn.addEventListener('click', startGame);

  /* ---------------- Démarrage ---------------- */
  for (var i = 0; i < 5; i++) spawn();
  holes.forEach(function (h) { if (h.prey) h.prey.detect = 0; });
  if (reduceMotion) { sense.x = 0; sense.y = 0; sense.on = false; }

  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) kick();
    }).observe(stage);
  } else {
    visible = true;
  }
  resize();
  kick();
})();
