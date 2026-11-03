// Génère les icônes Android (mipmap) à partir de la mascotte SVG.
// Nécessite Playwright (Chromium) : `node scripts/make-android-icons.mjs`
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { mascot } from '../src/ui/icons.js';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const res = fileURLToPath(new URL('../android/res/', import.meta.url));

const DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const MUSTARD = '#F2B33D';

// Icône classique (avant Android 8) : 48 dp, carré arrondi moutarde.
const legacy = (px) => `<div style="width:${px}px;height:${px}px;display:grid;place-items:center;background:${MUSTARD};
  border-radius:${px * 0.22}px;box-sizing:border-box;border:${Math.max(1, px * 0.03)}px solid #1D1D2C">
  ${mascot(1, px * 0.86)}</div>`;
// Calque avant de l'icône adaptative : 108 dp, sujet dans la zone sûre centrale de 66 dp.
const foreground = (px) => `<div style="width:${px}px;height:${px}px;display:grid;place-items:center">${mascot(1, px * 0.7)}</div>`;

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, scale] of Object.entries(DENSITIES)) {
  const dir = `${res}mipmap-${name}`;
  mkdirSync(dir, { recursive: true });
  for (const [file, html, size] of [['ic_launcher', legacy, 48], ['ic_launcher_foreground', foreground, 108]]) {
    const px = Math.round(size * scale);
    await page.setViewportSize({ width: px, height: px });
    await page.setContent(`<body style="margin:0;background:transparent">${html(px)}</body>`);
    await page.locator('body > div').screenshot({ path: `${dir}/${file}.png`, omitBackground: true });
  }
}
await browser.close();
console.log('Icônes générées dans android/res/mipmap-*');
