import { chromium } from 'playwright';

const url = process.argv[2];
const out = process.argv[3];

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
page.on('console', msg => console.log(`[${msg.type()}]`, msg.text()));
page.on('pageerror', err => console.log('[pageerror]', err.message));
page.on('requestfailed', req => console.log('[failed]', req.url(), '·', req.failure()?.errorText ?? ''));
page.on('response', res => { if (res.status() >= 400) console.log('[' + res.status() + ']', res.url()); });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(6000); // let map tiles load
await page.screenshot({ path: out, fullPage: false });
await browser.close();
console.log('Wrote', out);
