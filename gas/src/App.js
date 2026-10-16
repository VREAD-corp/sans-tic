/** Site configuration read by Code.js (loaded first: file names are evaluated in alphabetical order). */
var APP = {
  name: 'Sans Tic',
  site: 'sans-tic',
  host: 'sans-tic.jalonel.com',               // public site (brand Jalonel); outils.vread.fr/<site>/ redirects here
  tz: 'Europe/Paris',
  sheetTitle: 'Sans Tic : pré-commandes et statistiques (READ FRANCE SAS)',
  consentVersion: 'pc-2026-10-13',
  adminHash: 'a78376b21fa25374f4a3e8de09977dd1e9e263900f588999e9fabd5d1e1cf81b',
  events: ['view', 'cta_click', 'lint_done', 'sample_load', 'rules_view', 'audit_view', 'preorder_submit', 'preorder_ok'],
  xp: { cta: ['a', 'b'] },          // OCTAVE_XP of the site: id 'cta', wording of the audit button
  variantXp: 'cta',
  offers: { 'audit-10': { a: 390, b: 390 } },   // € HT, pre-order only
  countries: ['FR', 'BE', 'LU', 'CH', 'CA', 'MC', 'EU', 'ZZ'],
  websiteRequired: true,
  sizes: ['10', '11-25', '26+'],
  roles: ['agence', 'redaction', 'marketing', 'independant', 'autre'],
};
