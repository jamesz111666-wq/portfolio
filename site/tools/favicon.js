// Requires playwright:  NODE_PATH=<path-to-node_modules> node tools/favicon.js
// Draws tools/favicon.html at the sizes browsers ask for. Rendered in the
// browser so the mark is the site's own Jost, not a lookalike.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const [size, name] of [[512, 'icon-512.png'], [180, 'apple-touch-icon.png'], [32, 'icon-32.png']]) {
    const p = await b.newPage({ viewport: { width: 512, height: 512 } });
    await p.goto('file://' + path.resolve(__dirname, 'favicon.html'));
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(200);
    await p.screenshot({ path: path.resolve(__dirname, '../assets/' + name),
                         scale: 'css', clip: { x: 0, y: 0, width: 512, height: 512 } });
    await p.close();
    console.log(name);
  }
  await b.close();
})();
