#!/usr/bin/env node
'use strict';

// Renders every course diagram as a looping GIF (course/<course>/gifs/<diagram>.gif), one frame per
// step with its caption, so a diagram can be shared on LinkedIn or anywhere a page can't run.
// Needs the Playwright Chromium the tests use, plus Python 3 with Pillow to assemble the GIF.
//
//   npm run gifs:course            (CHROMIUM_PATH=/path/to/chrome to use an installed Chromium)

const fs = require('fs');
const os = require('os');
const path = require('path');
const http = require('http');
const { execFileSync } = require('child_process');
const { chromium } = require('@playwright/test');

const ROOT = path.resolve(__dirname, '..');

const PY = `
import sys, json
from PIL import Image
spec = json.load(open(sys.argv[1]))
frames = [Image.open(f).convert('RGB') for f in spec['frames']]
w = max(f.width for f in frames); h = max(f.height for f in frames)
canvas = []
for f in frames:
    c = Image.new('RGB', (w, h), (251, 249, 244)); c.paste(f, (0, 0)); canvas.append(c.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE))
canvas[0].save(spec['out'], save_all=True, append_images=canvas[1:], duration=spec['durations'], loop=0, optimize=True, disposal=1)
`;

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\//, '');
      const f = path.resolve(ROOT, rel.endsWith('/') || rel === '' ? rel + 'index.html' : rel);
      if (!f.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
      fs.readFile(f, (err, data) => {
        if (err) { res.writeHead(404); return res.end(); }
        const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2' };
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
  // Moving dots are hidden (reduced motion) because a still frame can't show motion.
  const ctx = await browser.newContext({ viewport: { width: 720, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce', bypassCSP: true });
  const page = await ctx.newPage();
  // Block the player script: frames show the plain steps (Playwright needs page JS for addStyleTag).
  await page.route('**/course.js', r => r.abort());
  const courseDir = path.join(ROOT, 'course');
  for (const c of fs.readdirSync(courseDir).filter(d => fs.statSync(path.join(courseDir, d)).isDirectory())) {
    const outDir = path.join(courseDir, c, 'gifs');
    fs.mkdirSync(outDir, { recursive: true });
    for (const f of fs.readdirSync(path.join(courseDir, c)).filter(f => f.endsWith('.html')).sort()) {
      await page.goto(`${base}/course/${c}/${f}`);
      await page.addStyleTag({ content: '.stepnav,.dots,.player,.gif-link{display:none!important} .stepper{border:0;margin:0} .caps p{font-size:17px}' });
      for (const fig of await page.locator('.stepper').all()) {
        const name = (await fig.locator('input[type=radio]').first().getAttribute('name')).replace(/^st-/, '');
        const n = await fig.locator('input[type=radio]').count();
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gif-'));
        const frames = [], durations = [];
        for (let k = 1; k <= n; k++) {
          await fig.locator('input[type=radio]').nth(k - 1).evaluate(el => { el.checked = true; });
          await page.waitForTimeout(650);
          const file = path.join(tmp, `${k}.png`);
          await fig.screenshot({ path: file });
          frames.push(file);
          const text = await fig.locator(`.caps > li:nth-child(${k})`).innerText();
          durations.push(Math.min(9000, 2200 + text.length * 35) + (k === n ? 1500 : 0));
        }
        const spec = path.join(tmp, 'spec.json');
        fs.writeFileSync(spec, JSON.stringify({ frames, durations, out: path.join(outDir, `${name}.gif`) }));
        execFileSync('python3', ['-c', PY, spec], { stdio: 'inherit' });
        fs.rmSync(tmp, { recursive: true, force: true });
        console.log(`Wrote course/${c}/gifs/${name}.gif (${n} frames)`);
      }
    }
  }
  await browser.close();
  srv.close();
})();
