// The browser core (src/assets/lint-core.js) must score exactly like the CLI (tools/lint-ia.mjs). node tests/lint-parity.test.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const ctx = { window: {} };
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(new URL('../src/assets/lint-core.js', import.meta.url), 'utf8'), ctx);
const L = ctx.window.LintIA;
const cli = new URL('../tools/lint-ia.mjs', import.meta.url).pathname;
const SAMPLES = [
  'Dans un monde en constante évolution, il est essentiel de repenser votre stratégie. Notre agence vous accompagne pour booster votre visibilité — c’est un véritable levier de croissance. En somme, n’hésitez pas à nous contacter !',
  'Nous rédigeons les fiches produits de 14 boutiques de vins en ligne depuis 2019. Une fiche compte 180 mots en moyenne et cite le domaine, le millésime, le cépage et la température de service. En mars, le taux d’ajout au panier est passé de 2,1 % à 2,9 %.',
  '# Titre De Section Avec Majuscules\n\n- 🚀 Rapide\n- ✅ Simple\n- 💡 Malin\n\nRejoignez plus de 10 000 clients ! Nos résultats : x3 en un mois. « Un outil génial » — Marie D., CEO\n\n#ia #seo #marketing #contenu',
  'I hope this email finds you well. In today’s fast-paced world, it’s not just a tool — it’s a game changer. Let’s dive in and unlock seamless growth.',
];
for (const s of SAMPLES) {
  const a = L.analyse(s, 'txt');
  const b = JSON.parse(execFileSync('node', [cli, '--json', '-'], { input: s, encoding: 'utf8' }))[0];
  assert.equal(a.score, b.score, 'score');
  assert.equal(L.verdict(a), b.verdict, 'verdict');
  assert.equal(JSON.stringify(a.penalties.map((p) => [p.key, p.points, p.count])), JSON.stringify(b.penalties.map((p) => [p.key, p.points, p.count])));
}
// The vendored CLI is the revenue-lab master (local runs only).
const master = new URL('../../vread-revenue-lab/content/lint-ia.mjs', import.meta.url);
if (fs.existsSync(master)) assert.equal(fs.readFileSync(cli, 'utf8'), fs.readFileSync(master, 'utf8'), 'tools/lint-ia.mjs differs from vread-revenue-lab/content/lint-ia.mjs');
console.log('lint parity ok:', SAMPLES.length, 'samples, scores', SAMPLES.map((s) => L.analyse(s, 'txt').score).join(' / '));
