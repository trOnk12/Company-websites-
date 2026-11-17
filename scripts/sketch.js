// A tiny hand-drawn line engine for the music pages, in the spirit of rough.js:
// every stroke is drawn twice with a little wobble, and slightly overshoots, like ink on paper.
// Seeded, so a page draws the same every build.

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const seedOf = str => { let h = 2166136261; for (const c of String(str)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const f = n => n.toFixed(1);

function pen(seed, rough = 1) {
  const r = rng(typeof seed === 'number' ? seed : seedOf(seed));
  const j = a => (r() - 0.5) * 2 * a * rough;

  // One wobbly stroke from a to b, as a quadratic curve with jittered ends and a bowed middle.
  const stroke = (x1, y1, x2, y2) => {
    const len = Math.hypot(x2 - x1, y2 - y1), o = Math.min(2.2, 0.6 + len * 0.012);
    const ox = j(o * 0.6), oy = j(o * 0.6);
    const mx = (x1 + x2) / 2 + j(o * 1.6), my = (y1 + y2) / 2 + j(o * 1.6);
    const ex = (x2 - x1) / (len || 1), ey = (y2 - y1) / (len || 1), over = 1 + r() * 2.5;
    return `M${f(x1 - ex * over * r() + ox)},${f(y1 - ey * over * r() + oy)} Q${f(mx)},${f(my)} ${f(x2 + ex * over * r() + j(o * 0.6))},${f(y2 + ey * over * r() + j(o * 0.6))}`;
  };
  const line = (x1, y1, x2, y2, twice = true) => stroke(x1, y1, x2, y2) + (twice ? ' ' + stroke(x1, y1, x2, y2) : '');
  const rect = (x, y, w, h, twice = true) => [line(x, y, x + w, y, twice), line(x + w, y, x + w, y + h, twice), line(x + w, y + h, x, y + h, twice), line(x, y + h, x, y, twice)].join(' ');
  // A closed wobbly ellipse through jittered points (Catmull-Rom → Bézier), drawn with a small overshoot.
  const ellipseOnce = (cx, cy, rx, ry) => {
    const n = Math.max(8, Math.round((rx + ry) / 4)), start = r() * Math.PI * 2, over = 0.25 + r() * 0.2;
    const pts = [];
    for (let k = 0; k <= n + 2; k++) {
      const a = start + (k / n) * (Math.PI * 2 + over);
      const d = 1 + j(0.045);
      pts.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d]);
    }
    let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let k = 0; k < pts.length - 2; k++) {
      const p0 = pts[Math.max(0, k - 1)], p1 = pts[k], p2 = pts[k + 1], p3 = pts[Math.min(pts.length - 1, k + 2)];
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return d;
  };
  const ellipse = (cx, cy, rx, ry = rx, twice = true) => ellipseOnce(cx, cy, rx, ry) + (twice ? ' ' + ellipseOnce(cx, cy, rx, ry) : '');
  // A sagging cable between two points.
  const cable = (x1, y1, x2, y2, sag = 30) => {
    const c = (x, y) => `${f(x)},${f(y)}`;
    const once = () => `M${c(x1 + j(1), y1 + j(1))} C${c(x1 + (x2 - x1) * 0.3 + j(4), y1 + sag + j(5))} ${c(x1 + (x2 - x1) * 0.7 + j(4), y2 + sag + j(5))} ${c(x2 + j(1), y2 + j(1))}`;
    return once() + ' ' + once();
  };
  // Pencil hatching inside a rectangle, at 45°.
  const hatch = (x, y, w, h, gap = 6) => {
    const out = [];
    for (let k = gap; k < w + h; k += gap) {
      const ax = x + Math.min(k, w), ay = y + Math.max(0, k - w);
      const bx = x + Math.max(0, k - h), by = y + Math.min(k, h);
      out.push(stroke(ax, ay, bx, by));
    }
    return out.join(' ');
  };
  return { line, rect, ellipse, cable, hatch, rand: r, jit: j };
}

module.exports = { pen, seedOf };
