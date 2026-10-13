# Sans Tic

Free French checker of AI-style writing tics (64 rules of `lint-ia.mjs`, run in the browser: the text is never sent), plus a fake door for an editorial audit at 390 € HT. Sans Tic is a style checker, **not** an AI detector: no page may claim to detect AI or to make text undetectable (`claims` in site.config.mjs, checked by tests/site.check.mjs). `tools/lint-ia.mjs` is a copy of `vread-revenue-lab/content/lint-ia.mjs`; `src/assets/lint-core.js` is generated from it and scores exactly like the CLI (`tests/lint-parity.test.mjs`).

Live: https://outils.vread.fr/sans-tic/ (GitHub Pages of `VREAD-corp/sans-tic`, branch `main`, folder `/docs`). Goal-v4 experiment of READ FRANCE SAS, built and run by Octave (its AI agent). Independent of the Vread app and vread.fr. Journal: `VREAD-corp/octave-asset-ventures` (`experiments/`, `ventures/`).

**Fake door.** The paid offer is not on sale: the form records a pre-order (no card, no payment, no commitment) in this site's own Apps Script + Sheet. Nothing here uses octave-checkout.

## Layout

| Path | What |
|---|---|
| `src/pages/*.html` | Pages (`<!--meta {json}-->` header: path, title, description, scripts) |
| `site.config.mjs` | Brand, Apps Script URL, A/B config (`OCTAVE_XP`), JSON-LD, forbidden claims |
| `build.mjs` | Static build, no dependency -> `docs/` (sitemap, robots, fingerprinted assets) |
| `src/assets/cro.js` | Shared behaviour counters and A/B variants, byte-identical to `octave-checkout/gas/web/cro.js` |
| `tools/mesure.template.js` | Cookieless audience counter (`v:2`, bots/webdriver/`octave_notrack=1` counted apart), generated into `assets/mesure.js` |
| `src/assets/preorder.js` | Pre-order form -> `action=preorder` |
| `gas/src/` | Apps Script web app: `App.js` (site config), `Code.js` (track, preorder, summary, purge_tests, cro, cro_init), `Cro.js` (byte-identical to octave-checkout) |

## Backend

Apps Script project `sans-tic-gas (READ FRANCE SAS)`, script id `1oFT5ajzis3B2i11JDX0s44VPgJ9fX9gt_LtcsJJNWS4kO9BZ5pmjPi8T`, owner vincent.cance@gmail.com, only scope `spreadsheets`. Web app `https://script.google.com/macros/s/AKfycbzDxOU0SIrJ75lpS3PAU834xbJ9kfYlqjXT3U4EEIFdaMYrVWsL2r_sS9IHcyIksGc2/exec`. It creates its own Sheet on first use (tabs `Preorders`, `Stats`, `Exclus`, `Comportement`, `Experiences`). Redeploy: `bash gas/scripts/deploy.sh` (same deployment id). Admin key: `~/.config/octave/sans-tic.env` (never committed; the code holds its SHA-256).

Read the numbers: `. ~/.config/octave/sans-tic.env; curl -sL -d "{\"action\":\"summary\",\"key\":\"$KEY\"}" <exec url>` (counts only, no e-mails). Weekly CRO report: backend `sans-tic` in `vread-revenue-lab/tools/cro-sources.json`.

## Commands

```bash
npm test                 # build + static checks (lint-ia >= 85 on every page, links, JSON-LD, claims) + backend unit tests
node tests/e2e.mjs       # browser test at 390 px and 1440 px against docs/ (Apps Script mocked)
BASE_URL=https://outils.vread.fr/sans-tic/ node tests/e2e.mjs   # live: real form -> real Sheet (@example.com, purged)
```
