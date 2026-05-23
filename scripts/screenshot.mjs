import { chromium } from 'playwright';

const url = process.argv[2] || 'https://1f.val.id/';
const out = process.argv[3] || '/tmp/onefleet-cyber-ops.png';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(800); // let fonts settle
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log('Wrote', out);
