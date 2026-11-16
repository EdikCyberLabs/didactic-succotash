const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const root = process.argv[2]; const svg = fs.readFileSync(root + '/android-res/notification-icon.svg', 'utf8');
  const b = await chromium.launch();
  for (const [d, n] of [['mdpi', 24], ['hdpi', 36], ['xhdpi', 48], ['xxhdpi', 72], ['xxxhdpi', 96]]) {
    const p = await b.newPage({ viewport: { width: n, height: n } });
    await p.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${n}px;height:${n}px}</style>${svg}`);
    fs.mkdirSync(`${root}/android-res/drawable-${d}`, { recursive: true });
    await p.screenshot({ path: `${root}/android-res/drawable-${d}/ic_stat_kobo.png`, omitBackground: true });
  }
  await b.close();
})();
