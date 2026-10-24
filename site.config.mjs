// Site configuration read by build.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { makeLintCore } from './tools/make-lint-core.mjs';

const ORG = { '@type': 'Organization', '@id': 'https://jalonel.com/#org', name: 'Jalonel', url: 'https://jalonel.com/', parentOrganization: { '@type': 'Organization', name: 'READ FRANCE SAS', identifier: 'SIREN 988741773' } };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const pretty = (s) => s.replace(/\[\^[^\]]*\]\{\d+,\d+\}\??/g, '…').replace(/\\\\s\??/g, ' ').replace(/\\s\??/g, ' ').replace(/\(\?:/g, '(').replace(/\\/g, '');

export default {
  // En pause depuis le 24/10/2026 (décision des fondateurs, recentrage Jalonel): noindex, banner, pre-order form closed.
  paused: true,
  repo: 'sans-tic',
  site: 'sans-tic',
  origin: 'https://sans-tic.jalonel.com',
  indexNowKeys: ['5be19f56d46ca3d2553bee28ebfa8edd'],
  brand: 'Sans Tic',
  logo: 'Sans <span>Tic</span>',
  accent: '#9a3412',
  api: 'https://script.google.com/macros/s/AKfycbzDxOU0SIrJ75lpS3PAU834xbJ9kfYlqjXT3U4EEIFdaMYrVWsL2r_sS9IHcyIksGc2/exec',
  consentVersion: 'pc-2026-10-13',
  variantXp: 'cta',
  // A/B: wording of the audit button (same price). ?cta=a|b forces a variant.
  xp: [{ id: 'cta', variants: ['a', 'b'], mode: 'tab', param: 'cta', swap: { b: [['.cta-audit', 'text', 'Réserver un audit éditorial (390 € HT)']] } }],
  nav: [['Vérifier un texte', '/'], ['Les 64 règles', '/regles/'], ['Audit éditorial', '/audit/']],
  // Claims never allowed without a negation in the same sentence (positioning: style checker, not an AI detector).
  claims: [/détect/i, /indétectable/i, /\d+ ?% de (précision|fiabilité)/i, /fiable à \d+/i],
  footerNote: 'Sans Tic repère des habitudes d’écriture ; il ne détermine pas si un texte a été écrit par une IA.',
  async prebuild({ ROOT, SRC }) {
    const src = fs.readFileSync(path.join(ROOT, 'tools/lint-ia.mjs'), 'utf8');
    fs.writeFileSync(path.join(SRC, 'assets/lint-core.js'), makeLintCore(src));
    // Rules page: generated from the same RULES array as the checker.
    const rules = new Function(src.slice(src.indexOf('const RULES = ['), src.indexOf('];', src.indexOf('const RULES = [')) + 2) + '\nreturn RULES;')();
    const table = (lang, level) => rules.filter((r) => r[0] === lang && r[1] === level)
      .map((r) => `<tr><td><code>${esc(pretty(r[2]))}</code></td><td>${esc(r[3])}</td></tr>`).join('\n');
    const tpl = fs.readFileSync(path.join(SRC, 'regles.tpl.html'), 'utf8')
      .replace('{{FR_BAN}}', table('fr', 'ban')).replace('{{FR_LIMIT}}', table('fr', 'limit'))
      .replace('{{EN_BAN}}', table('en', 'ban')).replace('{{EN_LIMIT}}', table('en', 'limit'))
      .replace(/\{\{N_(FR|EN)_(BAN|LIMIT)\}\}/g, (a, l, v) => String(rules.filter((r) => r[0] === l.toLowerCase() && r[1] === v.toLowerCase()).length));
    fs.writeFileSync(path.join(SRC, 'pages/regles.html'), tpl);
  },
  schema(p, url) {
    if (p.page === 'home') return { '@type': 'SoftwareApplication', name: 'Sans Tic', url, applicationCategory: 'UtilitiesApplication', operatingSystem: 'Web', inLanguage: 'fr',
      description: p.description, isAccessibleForFree: true, offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' }, publisher: ORG };
    if (p.page === 'audit') return { '@type': 'Service', name: 'Audit éditorial de votre site', url, serviceType: 'Audit éditorial', areaServed: 'FR', inLanguage: 'fr', provider: ORG,
      description: p.description, offers: { '@type': 'Offer', price: '390', priceCurrency: 'EUR', availability: 'https://schema.org/PreOrder', url,
        priceSpecification: { '@type': 'PriceSpecification', price: '390', priceCurrency: 'EUR', valueAddedTaxIncluded: false } } };
    return null;
  },
};
