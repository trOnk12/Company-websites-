#!/usr/bin/env node
'use strict';

// Visual check for the course diagrams (used by the course-clarity skill).
// Photographs every step of every diagram after its motion settles, and lays them out on one contact sheet
// per course: one row per puzzle, one column per step. Look for labels covered by moving parts, parts left
// where they shouldn't be, text running out of its box, and steps where nothing changes.
//
//   npm run shots:course            → .shots/<course>/sheet.png   (CHROMIUM_PATH=… to use an installed Chromium)

const fs = require('fs');
const path = require('path');
const http = require('http');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.shots');

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '');
      const f = path.resolve(ROOT, rel.endsWith('/') || rel === '' ? rel + 'index.html' : rel);
      if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      fs.readFile(f, (err, data) => {
        if (err) { res.writeHead(404); return res.end(); }
        const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png' };
        res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
        res.end(data);
      });
    }).listen(0, '127.0.0.1', () => resolve(srv));
  });
}

(async () => {
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
  const ctx = await browser.newContext({ viewport: { width: 760, height: 900 } });
  await ctx.route(/goatcounter/, r => r.abort());
  const page = await ctx.newPage();
  const courseDir = path.join(ROOT, 'course');
  for (const c of fs.readdirSync(courseDir).filter(d => fs.statSync(path.join(courseDir, d)).isDirectory())) {
    const dir = path.join(OUT, c);
    fs.mkdirSync(dir, { recursive: true });
    const rows = [];
    for (const f of fs.readdirSync(path.join(courseDir, c)).filter(f => f.endsWith('.html')).sort()) {
      await page.goto(`${base}/course/${c}/${f}`);
      await page.locator('.player .play').waitFor();
      const n = await page.locator('.stepper > input').count();
      const shots = [];
      for (let k = 1; k <= n; k++) {
        await page.locator(`.dots label:nth-child(${k})`).click(); // stops autoplay, moves the parts
        await page.waitForTimeout(1200);
        const file = `${f.replace(/\.html$/, '')}-${k}.png`;
        await page.locator('.stage').screenshot({ path: path.join(dir, file) });
        shots.push(file);
      }
      rows.push({ f, shots });
    }
    const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;font:14px sans-serif;background:#fff}
      .row{display:flex;gap:6px;padding:6px;border-bottom:1px solid #ccc}.row b{width:180px;flex:none}
      img{width:300px;border:1px solid #ddd}</style>` +
      rows.map(r => `<div class="row"><b>${r.f}</b>${r.shots.map(s => `<img src="${s}">`).join('')}</div>`).join('');
    fs.writeFileSync(path.join(dir, 'sheet.html'), html);
    await page.goto(`file://${path.join(dir, 'sheet.html')}`);
    await page.screenshot({ path: path.join(dir, 'sheet.png'), fullPage: true });
    console.log(`Wrote .shots/${c}/sheet.png (${rows.length} diagrams)`);
  }
  await browser.close();
  srv.close();
})();
