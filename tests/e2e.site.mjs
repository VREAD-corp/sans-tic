// Sans Tic scenario for tests/e2e.mjs.
export async function scenario({ page, go, noHScroll, requests, posted, vp, LIVE, KEY, SITE, assert, shot }) {
  // 1. Checker: runs locally, the pasted text never leaves the browser.
  await go('');
  await noHScroll('home');
  const secret = 'Phrase témoin unique 7Q9X : dans un monde en constante évolution, il est essentiel de booster vos ventes. ' +
    'Notre équipe rédige 40 pages par mois pour 12 clients depuis 2021, avec une relecture systématique avant publication et un contrôle des chiffres cités.';
  await page.fill('#text', secret);
  const before = requests.length;
  await page.click('#run');
  await page.waitForSelector('#result .score b');
  const score = Number((await page.textContent('#result .score b')).match(/\d+/)[0]);
  assert.ok(score < 100, 'banned phrases lower the score: ' + score);
  assert.match(await page.textContent('#result .verdict'), /À reprendre|À réécrire/, 'a banned phrase blocks « prêt à publier »');
  assert.ok(await page.locator('#result mark.ban').count() >= 2, 'banned phrases highlighted');
  await page.waitForTimeout(500);
  for (const r of requests.slice(before)) assert.ok(!r.url.includes('7Q9X') && !r.body.includes('7Q9X') && !r.body.includes('constante'), 'text leaked in ' + r.url);
  if (!LIVE) {
    const hit = requests.slice(before).find((r) => r.body.includes('"lint_done"'));
    // measurement is off outside outils.vread.fr: no hit locally; live with octave_notrack=1 the hit is flagged excluded
    assert.equal(hit, undefined);
  }
  await shot('home-result');
  await page.click('#sample');
  await page.waitForSelector('#result .score b');
  await noHScroll('home after result');

  // 2. Rules page lists the 64 rules.
  await go('regles/');
  const rows = await page.locator('table tr td code').count();
  assert.equal(rows, 64, 'rules listed');
  await noHScroll('rules');

  // 3. Audit page: price, honest fake-door wording, SIREN check, pre-order sent.
  await go('audit/');
  await noHScroll('audit');
  const body = await page.textContent('main');
  assert.ok(body.includes('390 € HT') && body.includes('Aucun paiement') && body.includes('pas encore ouvert'));
  await page.fill('#email', `e2e-${vp.width}@example.com`);
  await page.fill('#company', 'Agence E2E');
  await page.fill('#siren', '123456789');
  await page.fill('#website', 'https://example.com');
  await page.check('input[name=consent]');
  await page.click('#preorder button[type=submit]');
  await page.waitForSelector('#preorder-msg.err');
  assert.match(await page.textContent('#preorder-msg'), /SIREN/);
  await page.fill('#siren', '988741773');
  await page.fill('#message', 'Test automatique, à ignorer.');
  await page.click('#preorder button[type=submit]');
  await page.waitForSelector('#preorder-msg.ok', { timeout: 30000 });
  assert.match(await page.textContent('#preorder-msg'), /Rien n'a été débité/);
  if (!LIVE) {
    const p = posted.filter((x) => x.action === 'preorder').at(-1);
    assert.equal(p.offer, 'audit-10');
    assert.equal(p.siren, '988741773');
    assert.equal(p.consent, true);
    assert.equal(p.consent_version, SITE.consentVersion);
    assert.ok(['a', 'b'].includes(p.variant));
  } else if (KEY) {
    const s = await fetch(SITE.api, { method: 'POST', body: JSON.stringify({ action: 'summary', key: KEY, email: `e2e-${vp.width}@example.com` }) }).then((r) => r.json());
    assert.equal(s.hasEmail, true, 'pre-order row in the Sheet');
  }
  await shot('audit-sent');
  // forced variant b swaps the button wording
  await go('audit/?cta=b');
  assert.match(await page.textContent('#preorder button[type=submit]'), /Réserver un audit éditorial/);
}
