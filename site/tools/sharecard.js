// Requires playwright:  NODE_PATH=<path-to-node_modules> node tools/sharecard.js
// Renders tools/sharecard.html to assets/share.jpg at exactly 1200x630 —
// the size LinkedIn, WeChat, Twitter and iMessage all crop from. Drawing it
// in the browser rather than with an image library means the card uses the
// site's own webfont and palette, so a shared link looks like the page it
// opens.  Run:  node tools/sharecard.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
  await p.goto('file://' + path.resolve(__dirname, 'sharecard.html'));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(300);
  await p.screenshot({ path: path.resolve(__dirname, '../assets/share.jpg'),
                       type: 'jpeg', quality: 88 });
  await b.close();
  console.log('assets/share.jpg  1200x630 @2x');
})();
