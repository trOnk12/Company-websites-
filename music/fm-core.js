// FM maths shared by the build (Node) and the page (browser): which spikes a sine carrier shaken by a sine
// modulator makes, and a sketched drawing of them. Sidebands sit at the carrier ± k × modulator, with heights
// J_k(depth) (Bessel functions of the first kind); spikes below zero fold back with their sign flipped.
(function (root) {
  function fact(n) { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; }
  // J_n(x) from its power series; exact enough for x up to about 12 and n up to 30.
  function bessel(n, x) {
    const s = n < 0 && n % 2 ? -1 : 1; n = Math.abs(n);
    let sum = 0;
    for (let m = 0; m < 60; m++) {
      const t = Math.pow(-1, m) * Math.pow(x / 2, 2 * m + n) / (fact(m) * fact(m + n));
      sum += t;
      if (m > 4 && Math.abs(t) < 1e-12) break;
    }
    return s * sum;
  }
  // [{f, a}] with a = |amplitude|, carrier fc and modulator fm in Hz, depth = modulation index.
  function spectrum(fc, fm, depth) {
    const bins = new Map();
    const K = Math.min(400, Math.ceil(depth + 3 * Math.cbrt(depth + 1) + 4));
    for (let k = -K; k <= K; k++) {
      const a = bessel(k, depth);
      if (Math.abs(a) < 1e-4) continue;
      let f = fc + k * fm, sign = 1;
      if (f < 0) { f = -f; sign = -1; }
      const key = Math.round(f * 100) / 100;
      bins.set(key, (bins.get(key) || 0) + sign * a);
    }
    return [...bins].map(([f, a]) => ({ f, a: Math.abs(a) })).filter(s => s.a > 0.004).sort((x, y) => x.f - y.f);
  }
  // A small seeded wobble so the drawing looks inked, and stays the same between builds and redraws.
  function wob(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return (s / 4294967296 - 0.5); }; }
  const W = 640, H = 200, X0 = 34, X1 = 620, Y0 = 162, TOP = 22;
  // An SVG drawing: the note's ladder of harmonics as faint rungs, each spike as an inked line with a dot.
  function svg(fc, fm, depth, opts) {
    opts = opts || {};
    const rungs = opts.rungs || 12, maxF = fc * (rungs + 0.5);
    const x = f => X0 + (X1 - X0) * f / maxF;
    const r = wob(Math.round(fc * 7 + fm * 13 + depth * 101));
    let s = '';
    for (let k = 1; k <= rungs; k++) {
      const xx = x(k * fc).toFixed(1);
      s += `<line class="fm-rung" x1="${xx}" y1="${TOP - 4}" x2="${xx}" y2="${Y0}"/><text class="fm-num" x="${xx}" y="${Y0 + 18}" text-anchor="middle">${k}</text>`;
    }
    s += `<path class="fm-base" d="M${X0 - 6},${(Y0 + r() * 1.5).toFixed(1)} Q${(X0 + X1) / 2},${(Y0 + r() * 3).toFixed(1)} ${X1 + 6},${(Y0 + r() * 1.5).toFixed(1)}"/>`;
    const spikes = spectrum(fc, fm, depth).filter(p => p.f <= maxF);
    for (const p of spikes) {
      const xx = x(p.f), h = (Y0 - TOP) * Math.min(1, p.a);
      const top = Y0 - h, bend = r() * 2.2;
      s += `<path class="fm-spike" d="M${(xx + r()).toFixed(1)},${Y0} Q${(xx + bend).toFixed(1)},${(Y0 - h / 2).toFixed(1)} ${(xx + r() * 0.8).toFixed(1)},${top.toFixed(1)}"/>`;
      if (h > 6) s += `<circle class="fm-dot" cx="${xx.toFixed(1)}" cy="${top.toFixed(1)}" r="3"/>`;
    }
    s += `<text class="fm-axis" x="${X1}" y="${Y0 + 36}" text-anchor="end">harmonics of the note →</text>`;
    const label = `Spikes: ${spikes.length} within ${rungs} harmonics. Carrier ${Math.round(fc)} Hz, modulator ${fm < 10 ? fm.toFixed(1) : Math.round(fm)} Hz, depth ${depth.toFixed(1)}.`;
    return { svg: `<svg class="fm-spec" viewBox="0 0 ${W} ${H + 18}" role="img" aria-label="${label}">${s}</svg>`, count: spikes.length, label };
  }
  const api = { bessel, spectrum, svg };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FMCore = api;
})(this);
