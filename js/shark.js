/* ------------------------------------------------------------------
   Générateur d'illustrations de requins (SVG, vue de profil).
   Toutes les illustrations du site sortent d'ici : le requin corail
   et les espèces « pièges » du jeu du détective.
   Repère : viewBox 0 0 1000 360, le requin regarde vers la droite.
------------------------------------------------------------------- */
(function () {
  'use strict';

  var PATHS = {
    body: 'M968,192 C960,170 935,152 895,143 C840,133 760,126 680,124 C600,122 520,128 440,138 C370,146 300,156 240,165 C215,168 195,171 178,173 L178,203 C200,205 225,207 250,209 C330,216 420,224 520,228 C620,232 720,230 800,224 C850,220 885,214 915,208 C940,205 962,203 968,192 Z',
    dorsal: 'M656,132 C640,95 612,58 578,40 C588,78 574,104 548,121 C556,126 560,130 566,134 Z',
    dorsal2: 'M350,158 C342,134 332,118 320,108 C318,125 312,140 296,152 C304,156 312,159 318,160 Z',
    caudal: 'M194,170 C140,140 90,100 42,70 C48,84 56,94 66,100 C72,104 80,106 84,110 C96,130 106,150 112,170 C104,200 92,228 82,250 C120,234 160,216 194,206 Z',
    pectoral: 'M804,212 C780,240 740,275 698,302 C712,282 730,256 744,226 C752,224 760,222 770,220 Z',
    pelvic: 'M505,222 C492,238 478,248 456,254 C462,244 466,236 468,222 Z',
    anal: 'M335,210 C322,226 310,236 292,242 C294,232 296,222 298,208 Z',
    // Formes du requin océanique : grandes nageoires arrondies
    dorsalBig: 'M676,134 C662,80 642,28 594,20 C560,16 546,40 548,70 C549,96 545,112 530,124 C545,130 555,132 566,136 Z',
    pectoralBig: 'M806,212 C792,262 762,318 704,344 C684,352 668,344 680,330 C702,302 726,262 744,226 C752,224 760,222 770,220 Z',
    // Contour du corps sans le bord vertical du pédoncule (caché par la queue)
    outline: 'M178,173 C195,171 215,168 240,165 C300,156 370,146 440,138 C520,128 600,122 680,124 C760,126 840,133 895,143 C935,152 960,170 968,192 C962,203 940,205 915,208 C885,214 850,220 800,224 C720,230 620,232 520,228 C420,224 330,216 250,209 C225,207 200,205 178,203',
    caudalEdge: 'M42,70 C48,84 56,94 66,100 C72,104 80,106 84,110 C96,130 106,150 112,170 C104,200 92,228 82,250'
  };

  // Couleurs de chaque espèce (dos, flancs, ventre, nageoires)
  var PALETTES = {
    corail: { top: '#55626b', mid: '#6d7b84', low: '#7f8c94', belly: '#e9eef0', fin: '#5f6c75', finLow: '#7f8b93' },
    pointesNoires: { top: '#8a8376', mid: '#9d978b', low: '#ada79c', belly: '#f1efe9', fin: '#958e81', finLow: '#a9a397' },
    gris: { top: '#4a545c', mid: '#5f6a72', low: '#76828a', belly: '#e6ebee', fin: '#525d65', finLow: '#717d85' },
    oceanique: { top: '#6e675b', mid: '#857e71', low: '#978f82', belly: '#ece8e1', fin: '#776f62', finLow: '#8d8578' }
  };

  // Bouts de nageoires : [nageoire, cx, cy, rayon, couleur]
  var TIPS = {
    corail: [['dorsal', 578, 40, 26, '#ffffff'], ['caudal', 44, 72, 30, '#ffffff']],
    pointesNoires: [['dorsal', 578, 40, 27, '#16191b'], ['dorsal2', 320, 108, 13, '#16191b'], ['caudal', 44, 72, 24, '#16191b'], ['caudal', 82, 250, 28, '#16191b'], ['pectoral', 698, 302, 26, '#16191b'], ['pelvic', 456, 254, 12, '#16191b'], ['anal', 292, 242, 11, '#16191b']],
    gris: [['pectoral', 698, 302, 22, '#2a3036']],
    oceanique: [['dorsal', 586, 28, 36, '#f4f1ea'], ['pectoral', 690, 340, 30, '#f4f1ea'], ['caudal', 44, 72, 30, '#f4f1ea'], ['caudal', 82, 250, 26, '#f4f1ea'], ['pelvic', 456, 254, 12, '#f4f1ea']]
  };

  var SPOTS = [[720, 158, 4.2], [652, 176, 3.4], [566, 162, 3.8], [488, 172, 3.2], [404, 170, 3.6], [770, 186, 3.2], [612, 196, 3.0], [530, 192, 2.8], [330, 182, 3.0]];
  var AMPULLAE = [[928, 158], [939, 163], [949, 170], [956, 178], [924, 168], [936, 174], [946, 184], [918, 160]];
  var GILLS = [862, 849, 836, 823, 810];

  var counter = 0;

  function svg(opts) {
    opts = opts || {};
    var v = opts.variant || 'corail';
    var pal = PALETTES[v];
    var id = 'sk' + (++counter);
    var big = v === 'oceanique';
    var fin = {
      dorsal: big ? PATHS.dorsalBig : PATHS.dorsal,
      dorsal2: PATHS.dorsal2,
      caudal: PATHS.caudal,
      pectoral: big ? PATHS.pectoralBig : PATHS.pectoral,
      pelvic: PATHS.pelvic,
      anal: PATHS.anal
    };
    var stroke = 'stroke="rgba(18,28,34,.55)" stroke-width="1.6" stroke-linejoin="round"';

    var s = '';
    s += '<svg class="shark-svg ' + (opts.className || '') + '" viewBox="0 0 1000 360" xmlns="http://www.w3.org/2000/svg"' +
      (opts.label ? ' role="img" aria-label="' + opts.label + '"' : ' aria-hidden="true" focusable="false"') + '>';
    s += '<defs>';
    s += '<linearGradient id="' + id + 'b" gradientUnits="userSpaceOnUse" x1="0" y1="120" x2="0" y2="232">' +
      '<stop offset="0" stop-color="' + pal.top + '"/><stop offset=".5" stop-color="' + pal.mid + '"/>' +
      '<stop offset=".72" stop-color="' + pal.low + '"/><stop offset=".84" stop-color="' + pal.belly + '" stop-opacity=".92"/>' +
      '<stop offset="1" stop-color="' + pal.belly + '"/></linearGradient>';
    s += '<linearGradient id="' + id + 'f" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="260">' +
      '<stop offset="0" stop-color="' + pal.fin + '"/><stop offset=".7" stop-color="' + pal.low + '"/>' +
      '<stop offset="1" stop-color="' + pal.finLow + '"/></linearGradient>';
    // Dégradé de la queue : identique à celui du corps au niveau du pédoncule (y 170 à 206) pour une jonction invisible
    s += '<linearGradient id="' + id + 't" gradientUnits="userSpaceOnUse" x1="0" y1="20" x2="0" y2="260">' +
      '<stop offset="0" stop-color="' + pal.fin + '"/><stop offset=".4167" stop-color="' + pal.top + '"/>' +
      '<stop offset=".65" stop-color="' + pal.mid + '"/><stop offset=".7525" stop-color="' + pal.low + '"/>' +
      '<stop offset=".775" stop-color="' + pal.low + '"/><stop offset=".85" stop-color="' + pal.finLow + '"/>' +
      '<stop offset="1" stop-color="' + pal.finLow + '"/></linearGradient>';
    s += '<linearGradient id="' + id + 'p" gradientUnits="userSpaceOnUse" x1="800" y1="214" x2="700" y2="300">' +
      '<stop offset="0" stop-color="' + pal.mid + '"/><stop offset="1" stop-color="' + pal.top + '"/></linearGradient>';
    ['dorsal', 'dorsal2', 'caudal', 'pectoral', 'pelvic', 'anal'].forEach(function (k) {
      s += '<clipPath id="' + id + 'c-' + k + '"><path d="' + fin[k] + '"/></clipPath>';
    });
    s += '</defs>';

    function tipsFor(name) {
      var out = '';
      (TIPS[v] || []).forEach(function (t) {
        if (t[0] !== name) return;
        out += '<circle cx="' + t[1] + '" cy="' + t[2] + '" r="' + t[3] + '" fill="' + t[4] + '" clip-path="url(#' + id + 'c-' + name + ')"/>';
      });
      return out;
    }

    // Nageoires situées derrière le corps
    s += '<g class="fin-caudal">';
    s += '<path d="' + fin.caudal + '" fill="url(#' + id + 't)" ' + stroke + '/>';
    if (v === 'gris') {
      s += '<path d="' + PATHS.caudalEdge + '" fill="none" stroke="#1d2226" stroke-width="16" stroke-linecap="round" clip-path="url(#' + id + 'c-caudal)"/>';
    }
    s += tipsFor('caudal') + '</g>';
    s += '<path d="' + fin.dorsal + '" fill="url(#' + id + 'f)" ' + stroke + '/>' + tipsFor('dorsal');
    s += '<path d="' + fin.dorsal2 + '" fill="url(#' + id + 'f)" ' + stroke + '/>' + tipsFor('dorsal2');
    s += '<path d="' + fin.pelvic + '" fill="' + pal.low + '" ' + stroke + '/>' + tipsFor('pelvic');
    s += '<path d="' + fin.anal + '" fill="' + pal.low + '" ' + stroke + '/>' + tipsFor('anal');

    // Corps
    s += '<path d="' + PATHS.body + '" fill="url(#' + id + 'b)"/>';
    s += '<path d="' + PATHS.outline + '" fill="none" ' + stroke + ' stroke-linecap="round"/>';
    // Reflet sur le dos
    s += '<path d="M890,147 C820,134 720,128 640,128 C560,129 480,136 400,146" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="3" stroke-linecap="round"/>';

    if (v === 'corail') {
      SPOTS.forEach(function (p) {
        s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="#262f35" opacity=".5"/>';
      });
    }

    // Fentes branchiales
    GILLS.forEach(function (x, i) {
      var h = 44 - i * 3;
      s += '<path d="M' + x + ',' + (164 + i) + ' C' + (x + 5) + ',' + (176 + i) + ' ' + (x + 5) + ',' + (164 + h * 0.75) + ' ' + (x - 2) + ',' + (164 + h) + '" fill="none" stroke="rgba(25,34,40,.55)" stroke-width="2.4" stroke-linecap="round"/>';
    });

    if (opts.details) {
      // Ligne latérale
      s += '<path class="lateral" d="M884,160 C760,150 600,150 450,160 C350,167 260,173 196,184" fill="none" stroke="rgba(235,250,255,.5)" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round"/>';
      // Ampoules de Lorenzini
      AMPULLAE.forEach(function (p) {
        s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.9" fill="#1f282e" opacity=".75"/>';
      });
    }

    // Bouche, narine, œil
    s += '<path d="M920,207 C903,213 884,216 864,214" fill="none" stroke="#2a3439" stroke-width="3" stroke-linecap="round"/>';
    s += '<path d="M942,187 c4,-3.5 11,-3.5 14,0 c-3,3.5 -10,4 -14,0z" fill="#2b353a"/>';
    s += '<path d="M949,189 l-1.5,6" stroke="#2b353a" stroke-width="2.2" stroke-linecap="round"/>';
    s += '<ellipse cx="903" cy="168" rx="10" ry="7" fill="#c9d2d6" opacity=".55"/>';
    s += '<ellipse cx="903" cy="168" rx="8" ry="5.6" fill="#0c1317"/>';
    s += '<ellipse cx="906" cy="166" rx="2.4" ry="1.7" fill="#ffffff" opacity=".85"/>';

    // Nageoire pectorale (devant le corps)
    s += '<path d="' + fin.pectoral + '" fill="url(#' + id + 'p)" ' + stroke + '/>' + tipsFor('pectoral');

    s += '</svg>';
    return s;
  }

  window.Shark = { svg: svg };
})();
