// Sans Tic checker: runs lint-core.js (same rules and score as lint-ia.mjs) in the browser. The text never leaves the page:
// no request carries it, nothing is stored. Only a score bucket ("lint_done", e.g. 70-84) is counted, without the text.
(function () {
  var L = window.LintIA;
  var ta = document.getElementById('text');
  if (!L || !ta) return;
  var out = document.getElementById('result');
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var track = function (e, d) { try { window.mTrack(e, d); } catch (err) { /* off */ } };

  var LABELS = {
    ban: ['Formules toutes faites', 'Expressions qui reviennent sans cesse dans les textes produits à la chaîne (« il est essentiel de », « dans un monde en constante évolution »). Elles occupent la place d’une information. Chaque occurrence retire 4 points.'],
    limit: ['Mots à doser', 'Mots corrects mais surutilisés (« optimiser », « crucial », « notamment »). Une occurrence par tranche de 150 mots est tolérée.'],
    emdash: ['Tirets cadratins (—)', 'Le tiret long en série est un marqueur fréquent des textes générés en anglais puis traduits. Un tiret par tranche de 400 mots est toléré ; ailleurs, une virgule, deux-points ou une nouvelle phrase font l’affaire.'],
    emojibullet: ['Emoji en tête de liste ou de titre', 'Les puces en emoji structurent un texte comme un post générique. Remplacez-les par des intertitres ou une liste simple.'],
    symbolbullet: ['Flèches et coches en puces (→ ✓)', 'Acceptables dans un tableau de prix, pas dans un texte suivi.'],
    emoji: ['Emoji décoratifs', 'Un emoji est toléré. Au-delà, il remplace souvent une idée.'],
    triad: ['Énumérations par trois', 'Le rythme « A, B et C » répété donne un ton de brochure. Les listes contenant un nom propre ou un chiffre ne sont pas comptées.'],
    threelists: ['Listes de trois éléments', 'Plusieurs listes de trois points exactement : le texte suit un gabarit plutôt que le sujet.'],
    inlinehead: ['Listes « Mot-clé : phrase »', 'Les listes dont chaque point commence par un mot en gras suivi de deux-points sont un format typique des réponses générées.'],
    titlecase: ['Majuscules à chaque mot des titres', 'En français, seul le premier mot d’un titre prend une majuscule.'],
    colon: ['Titres avec deux-points', 'Trop de titres du type « Sujet : promesse ». Gardez-en un sur trois au plus.'],
    bold: ['Trop de gras', 'Un passage en gras par tranche de 60 mots au plus ; sinon plus rien ne ressort.'],
    excl: ['Points d’exclamation', 'Un point d’exclamation par tranche de 200 mots est toléré.'],
    hashtags: ['Plus de 3 hashtags', 'Au-delà de trois, les hashtags n’apportent plus de visibilité et alourdissent le texte.'],
    broetry: ['Paragraphes d’une seule phrase', 'Une suite de phrases isolées, une par ligne, imite le style LinkedIn. Regroupez les idées qui vont ensemble.'],
    rhythm: ['Phrases de longueur uniforme', 'Quand toutes les phrases ont à peu près la même longueur, la lecture devient monotone. Alternez phrases courtes et longues.'],
    anaphora: ['Phrases qui commencent pareil', 'Trois phrases de suite ou plus ouvrent sur le même mot.'],
    honesty: ['Affirmations à sourcer', 'Preuves sociales, multiplicateurs (« x3 », « +40 % ») ou témoignages : gardez-les seulement avec une source réelle, nommée et vérifiable.'],
    specifics: ['Peu de chiffres ou de faits précis', 'Moins d’un nombre pour 200 mots : le texte reste général. Ajoutez un chiffre, une date, un nom, un prix.'],
  };
  var VERDICT = { OK: ['Prêt à publier', 'v-ok'], REVISE: ['À reprendre', 'v-revise'], REWRITE: ['À réécrire', 'v-rewrite'] };
  var bucket = function (s) { return s >= 85 ? '85-100' : s >= 70 ? '70-84' : s >= 50 ? '50-69' : '0-49'; };

  // Highlights: phrase rules (ban before limit, longest first, no overlap: same order as analyse()), em dashes, triads.
  function marks(text) {
    var norm = text.replace(/[’‘]/g, "'").replace(/[   ]/g, ' ');
    var found = [];
    L.COMPILED.forEach(function (r) { r.re.lastIndex = 0; var m; while ((m = r.re.exec(norm))) { found.push({ cls: r.level, s: m.index, e: m.index + m[0].length, fix: r.fix }); if (!m[0].length) r.re.lastIndex++; } });
    found.sort(function (x, y) { return x.cls === y.cls ? (y.e - y.s) - (x.e - x.s) : x.cls === 'ban' ? -1 : 1; });
    var kept = [];
    found.forEach(function (h) { if (!kept.some(function (k) { return h.s < k.e && k.s < h.e; })) kept.push(h); });
    var m2, re = /—/g;
    while ((m2 = re.exec(norm))) if (!kept.some(function (k) { return m2.index < k.e && k.s < m2.index + 1; })) kept.push({ cls: 'dash', s: m2.index, e: m2.index + 1, fix: 'Tiret long : virgule, deux-points ou nouvelle phrase.' });
    var tr = new RegExp(L.TRIAD.source, 'gu');
    while ((m2 = tr.exec(norm))) { var s = m2.index, e = s + m2[0].length; if (!kept.some(function (k) { return s < k.e && k.s < e; })) kept.push({ cls: 'triad', s: s, e: e, fix: 'Énumération par trois.' }); }
    kept.sort(function (a, b) { return a.s - b.s; });
    var html = '', pos = 0;
    kept.forEach(function (k) { html += esc(text.slice(pos, k.s)) + '<mark class="' + k.cls + '" title="' + esc(k.fix) + '">' + esc(text.slice(k.s, k.e)) + '</mark>'; pos = k.e; });
    return html + esc(text.slice(pos));
  }

  function run() {
    var text = ta.value;
    if (text.trim().split(/\s+/).length < 20) {
      out.hidden = false;
      out.innerHTML = '<p class="msg err" style="display:block">Collez au moins 20 mots pour obtenir un score utile.</p>';
      return;
    }
    var r = L.analyse(text, 'txt');
    var v = L.verdict(r);
    var pens = r.penalties.filter(function (p) { return p.points > 0; }).sort(function (a, b) { return b.points - a.points; });
    var h = '<div class="card"><div class="score"><b class="' + VERDICT[v][1] + '">' + r.score + '<small>/100</small></b><span class="verdict ' + VERDICT[v][1] + '">' + VERDICT[v][0] + '</span>' +
      '<span class="small">' + r.words + ' mots · ' + String(r.specRate).replace('.', ',') + ' nombres pour 100 mots' + (r.sentenceCV !== null ? ' · variation de longueur des phrases ' + String(r.sentenceCV).replace('.', ',') : '') + '</span></div>' +
      '<p class="small">Seuils : 85 et plus sans formule bannie ni affirmation à sourcer = prêt à publier ; 70 à 84 = à reprendre ; moins de 70 = à réécrire. Le score mesure des habitudes d’écriture, pas l’origine du texte.</p></div>';
    if (!pens.length) h += '<p>Aucun tic relevé par les ' + L.RULES.length + ' règles. Relisez quand même : un score élevé ne garantit pas qu’un texte est clair ou exact.</p>';
    else {
      h += '<h2>Ce qui coûte des points</h2>';
      pens.forEach(function (p) {
        var lab = LABELS[p.key] || [p.label, ''];
        var items = p.hits.slice(0, 12).map(function (x) { return '<li>' + (x.text ? '<code>' + esc(x.text) + '</code>' : '') + (x.fix ? ' : ' + esc(x.fix) : '') + '</li>'; }).join('');
        h += '<div class="pen"><h3><span>' + esc(lab[0]) + ' (' + p.count + ')</span><span>−' + String(p.points).replace('.', ',') + '</span></h3><p class="small">' + esc(lab[1]) + '</p>' + (items ? '<ul>' + items + '</ul>' : '') + '</div>';
      });
    }
    h += '<h2>Votre texte, passages relevés</h2><div class="legend"><span><mark class="ban">formule toute faite</mark></span><span><mark class="limit">mot à doser</mark></span><span><mark class="dash">tiret long</mark></span><span><mark class="triad">énumération par trois</mark></span></div>' +
      '<div class="hl">' + marks(text) + '</div>' +
      '<div class="card noprint"><p><b>Votre site entier a besoin d’une relecture ?</b> L’audit éditorial passe 10 pages au crible, avec score avant et après et une réécriture proposée pour chaque passage relevé.</p>' +
      '<a class="btn cta-audit" href="' + window.SITE.base + 'audit/" data-mesure="cta_click" data-detail="result">' + ((window.octaveCro && window.octaveCro.v('cta')) === 'b' ? 'Réserver un audit éditorial (390 € HT)' : 'Voir l’audit éditorial (390 € HT)') + '</a></div>';
    out.hidden = false;
    out.innerHTML = h;
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    track('lint_done', bucket(r.score));
  }

  document.getElementById('run').addEventListener('click', run);
  var SAMPLES = [
    'Dans un monde en constante évolution, il est essentiel de repenser votre stratégie de contenu. Notre agence vous accompagne pour booster votre visibilité, optimiser vos performances et propulser votre marque au niveau supérieur. Ce n’est pas juste un service — c’est un véritable levier de croissance. Que vous soyez une PME ou un grand groupe, nos experts sauront vous guider. En somme, n’hésitez pas à nous contacter pour découvrir comment transformer vos défis en opportunités !',
    'Nous rédigeons les fiches produits de 14 boutiques de vins en ligne depuis 2019. Une fiche compte 180 mots en moyenne et cite le domaine, le millésime, le cépage et la température de service. En mars, le taux d’ajout au panier de la boutique de Beaune est passé de 2,1 % à 2,9 % après la refonte de 240 fiches. Nous facturons 18 € HT la fiche, relecture comprise. Pour un devis, envoyez la liste de vos produits au format CSV.',
  ];
  var si = 0;
  document.getElementById('sample').addEventListener('click', function () { ta.value = SAMPLES[si % SAMPLES.length]; si++; track('sample_load', 's' + si); run(); });
})();
