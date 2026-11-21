// Music recipes: tick off each setting as you turn it (saved in this browser), and hide the "why" lines
// to turn a recipe into a one-screen cheat card. Nothing is sent anywhere.
(() => {
  // Anonymous, cookie-free counts (goatcounter.com), only on the live site: page views plus a few engagement events.
  const count = (p, event, title) => {
    if (!/(^|\.)pachulski\.dev$/.test(location.hostname)) return;
    const q = new URLSearchParams({ p, t: title || document.title, r: event ? '' : document.referrer, rnd: String(Math.random()).slice(2, 8) });
    if (event) q.set('e', 'true');
    new Image().src = `https://pachulski.goatcounter.com/count?${q}`;
  };
  count(location.pathname);
  // Give a keyboard user a scroll target only while the diagram extends beyond its frame.
  const diagrams = document.querySelectorAll('.rig-sketch, .dev-sketch, .steps-sketch, .panel-sketch');
  const diagramSizes = new ResizeObserver(entries => {
    for (const {target} of entries) {
      if (target.scrollWidth > target.clientWidth) target.tabIndex = 0;
      else target.removeAttribute('tabindex');
    }
  });
  diagrams.forEach(diagram => diagramSizes.observe(diagram));
  const article = document.querySelector('article[data-recipe]');
  if (!article) return;
  let tickedOnce = false;
  const key = `music:${article.dataset.recipe}:ticks`;
  const rows = [...article.querySelectorAll('.setting')];
  const tools = article.querySelector('.tools');
  const counter = article.querySelector('.tick-count');
  const load = () => { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); } };
  const save = s => { try { localStorage.setItem(key, JSON.stringify([...s])); } catch {} };
  let ticks = load();
  const switches = rows.map(row => {
    const label = row.querySelector('.control');
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'control';
    button.append(...label.childNodes);
    label.replaceWith(button);
    row.removeAttribute('tabindex');
    return button;
  });
  const show = () => {
    rows.forEach((r, i) => {
      r.classList.toggle('ticked', ticks.has(i));
      switches[i].setAttribute('aria-pressed', String(ticks.has(i)));
    });
    if (counter) counter.textContent = `${ticks.size} of ${rows.length} set`;
  };
  const toggle = i => { ticks.has(i) ? ticks.delete(i) : ticks.add(i); save(ticks); show(); if (!tickedOnce) { tickedOnce = true; count(`tick ${article.dataset.recipe}`, true, 'Ticked a setting'); } if (ticks.size === rows.length) count(`all set ${article.dataset.recipe}`, true, 'Set every control in a recipe'); };
  rows.forEach((r, i) => {
    r.addEventListener('click', e => { if (!e.target.closest('a')) toggle(i); });
  });
  if (tools) {
    tools.hidden = false;
    const compact = tools.querySelector('[data-compact]');
    try { if (localStorage.getItem('music:compact') === '1') { article.classList.add('compact'); compact.textContent = 'Show the whys'; } } catch {}
    compact.addEventListener('click', () => {
      const on = article.classList.toggle('compact');
      compact.textContent = on ? 'Show the whys' : 'Hide the whys';
      try { localStorage.setItem('music:compact', on ? '1' : '0'); } catch {}
      if (on) count(`cheat card ${article.dataset.recipe}`, true, 'Opened the cheat card');
    });
    tools.querySelector('[data-untick]').addEventListener('click', () => { ticks = new Set(); save(ticks); show(); });
  }
  show();
})();

// "Play it here": a two-sine FM voice in the browser, with its spikes drawn live (music/fm-core.js).
// The carrier is a sine at 220 Hz; a modulator sine shakes its frequency. Nothing is sent anywhere.
(() => {
  const toys = [...document.querySelectorAll('.fm-toy[data-cfg]')];
  if (!toys.length || !window.FMCore) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  const FC = 220;
  let ctx = null, voice = null, counted = false;
  const count = () => {
    if (counted || !/(^|\.)pachulski\.dev$/.test(location.hostname)) return;
    counted = true;
    const q = new URLSearchParams({ p: `fm play ${location.pathname}`, t: 'Played an FM box', e: 'true', rnd: String(Math.random()).slice(2, 8) });
    new Image().src = `https://pachulski.goatcounter.com/count?${q}`;
  };
  const stopAll = () => { if (voice) { voice.stop(); voice = null; } toys.forEach(t => t.dispatchEvent(new Event('fm:stopped'))); };

  // One voice: carrier + modulator (+ a repeating pluck when pluck is set). set() changes it live.
  function startVoice(get) {
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') ctx.resume();
    const t0 = ctx.currentTime;
    const out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
    const car = ctx.createOscillator(); car.type = 'sine'; car.frequency.value = FC;
    const mod = ctx.createOscillator(); mod.type = 'sine';
    const dev = ctx.createGain(); dev.gain.value = 0;
    mod.connect(dev); dev.connect(car.frequency); car.connect(out);
    const s0 = get();
    mod.frequency.value = s0.fm;
    car.start(t0); mod.start(t0);
    let timer = null;
    const level = 0.16;
    if (s0.pluck) {
      const hit = () => {
        const s = get(), t = ctx.currentTime + 0.01;
        mod.frequency.setValueAtTime(s.fm, t);
        dev.gain.cancelScheduledValues(t); dev.gain.setValueAtTime(s.depth * s.fm, t); dev.gain.exponentialRampToValueAtTime(Math.max(0.01, 0.002 * s.fm), t + 0.45);
        out.gain.cancelScheduledValues(t); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(level, t + 0.004); out.gain.exponentialRampToValueAtTime(0.0008, t + 0.8);
      };
      hit(); timer = setInterval(hit, 850);
    } else {
      out.gain.setTargetAtTime(level, t0, 0.02);
      dev.gain.setTargetAtTime(s0.depth * s0.fm, t0, 0.02);
    }
    return {
      set(s) {
        const t = ctx.currentTime;
        mod.frequency.setTargetAtTime(s.fm, t, 0.015);
        if (!s0.pluck) dev.gain.setTargetAtTime(s.depth * s.fm, t, 0.03);
      },
      stop() {
        clearInterval(timer);
        const t = ctx.currentTime;
        out.gain.cancelScheduledValues(t); out.gain.setTargetAtTime(0, t, 0.03);
        car.stop(t + 0.2); mod.stop(t + 0.2);
      },
    };
  }

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  toys.forEach(toy => {
    let cfg; try { cfg = JSON.parse(toy.dataset.cfg); } catch { return; }
    const lock = new Set(cfg.lock || []);
    const mode = cfg.mode || 'ratio';
    const st = { ratio: cfg.ratio || 1, depth: cfg.depth || 0, rate: cfg.rate || 4 };
    const spec = toy.querySelector('.fm-spec-wrap');
    const readout = toy.querySelector('.fm-read');
    const panel = toy.querySelector('.fm-controls');
    panel.hidden = false;
    const fm = () => (mode === 'rate' ? st.rate : FC * st.ratio);
    const params = () => ({ fm: fm(), depth: st.depth, pluck: mode === 'pluck' });
    const draw = () => {
      const d = window.FMCore.svg(FC, fm(), st.depth, { rungs: 12 });
      spec.innerHTML = d.svg;
      const parts = [];
      if (mode === 'rate') parts.push(`modulator: ${fm() < 10 ? fm().toFixed(1) : Math.round(fm())} shakes per second`);
      else parts.push(`ratio ${st.ratio}`);
      if (mode !== 'match') parts.push(`depth ${st.depth.toFixed(1)}`);
      parts.push(`${d.count} spike${d.count === 1 ? '' : 's'}`);
      readout.textContent = parts.join(' · ');
      if (voice && voice.owner === toy) voice.set(params());
    };

    // Play / stop
    const play = el('button', 'button primary fm-play', '▶ Play');
    play.type = 'button';
    play.setAttribute('aria-pressed', 'false');
    play.addEventListener('click', () => {
      if (voice && voice.owner === toy) { stopAll(); return; }
      stopAll();
      voice = startVoice(params); voice.owner = toy;
      play.textContent = '■ Stop'; play.setAttribute('aria-pressed', 'true'); count();
    });
    toy.addEventListener('fm:stopped', () => { play.textContent = '▶ Play'; play.setAttribute('aria-pressed', 'false'); });

    const slider = (label, min, max, step, value, onInput, fmt) => {
      const wrap = el('label', 'fm-slider');
      const name = el('span', 'fm-name', label);
      const input = el('input'); input.type = 'range'; input.min = min; input.max = max; input.step = step; input.value = value;
      const val = el('span', 'fm-val', fmt(Number(value)));
      input.addEventListener('input', () => { onInput(Number(input.value)); val.textContent = fmt(Number(input.value)); draw(); });
      wrap.append(name, input, val);
      return wrap;
    };
    const choices = (label, list, get, setv) => {
      const wrap = el('div', 'fm-choices'); wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', label);
      wrap.append(el('span', 'fm-name', label));
      list.forEach(v => {
        const b = el('button', 'fm-choice', String(v)); b.type = 'button';
        const sync = () => b.setAttribute('aria-pressed', String(get() === v));
        b.addEventListener('click', () => { setv(v); wrap.querySelectorAll('.fm-choice').forEach(x => x.dispatchEvent(new Event('sync'))); draw(); });
        b.addEventListener('sync', sync); sync();
        wrap.append(b);
      });
      return wrap;
    };

    const row = el('div', 'fm-row'); row.append(play); panel.append(row);
    if (mode === 'rate') {
      // A log slider: 1 to 220 shakes per second.
      panel.append(slider('speed', 0, 100, 1, Math.round(100 * Math.log(st.rate) / Math.log(220)), v => { st.rate = Math.max(1, Math.pow(220, v / 100)); }, () => `${st.rate < 10 ? st.rate.toFixed(1) : Math.round(st.rate)}/s`));
    }
    if (mode !== 'rate' && mode !== 'match' && !lock.has('ratio')) panel.append(choices('ratio', cfg.choices || [0.5, 1, 2, 3, 1.41, 3.5], () => st.ratio, v => { st.ratio = v; }));
    if (mode !== 'match' && !lock.has('depth')) panel.append(slider('depth (like LEV)', 0, 6, 0.1, st.depth, v => { st.depth = v; }, v => v.toFixed(1)));

    if (mode === 'match') {
      const targets = (cfg.targets || []).map(t => { const [r, d] = String(t).split('@').map(Number); return { ratio: r, depth: d }; });
      const ratios = [...new Set([...targets.map(t => t.ratio), 0.5, 1, 2, 3, 1.41, 3.5])].sort((a, b) => a - b);
      let round = 0;
      st.ratio = 1; st.depth = 0;
      const status = el('p', 'fm-status'); status.setAttribute('aria-live', 'polite');
      const hear = el('button', 'button fm-target', '▶ Play the target'); hear.type = 'button';
      let targetVoice = null;
      hear.addEventListener('click', () => {
        stopAll();
        const t = targets[round];
        targetVoice = startVoice(() => ({ fm: FC * t.ratio, depth: t.depth, pluck: false }));
        voice = targetVoice; voice.owner = null;
        setTimeout(() => { if (voice === targetVoice) stopAll(); }, 1600);
        count();
      });
      const check = el('button', 'button', 'Check'); check.type = 'button';
      const next = el('button', 'button', 'Next round →'); next.type = 'button'; next.hidden = true;
      const show = () => { status.textContent = `Round ${round + 1} of ${targets.length}: play the target, then find it.`; next.hidden = true; };
      check.addEventListener('click', () => {
        const t = targets[round];
        const okR = st.ratio === t.ratio, okD = Math.abs(st.depth - t.depth) <= 0.5;
        status.textContent = okR && okD ? `Yes: ratio ${t.ratio}, depth ${t.depth}.` : !okR ? `Not the ratio yet. ${Number.isInteger(t.ratio) ? 'The target is in tune: try whole numbers.' : 'The target rings like metal: try a ratio between whole numbers.'}` : `Right ratio. The depth is ${st.depth < t.depth ? 'higher' : 'lower'}: ${st.depth < t.depth ? 'more' : 'fewer'} spikes.`;
        if (okR && okD) next.hidden = round >= targets.length - 1;
      });
      next.addEventListener('click', () => { round++; show(); });
      row.append(hear, check, next);
      panel.append(choices('ratio', ratios, () => st.ratio, v => { st.ratio = v; }));
      panel.append(slider('depth (like LEV)', 0, 6, 0.1, 0, v => { st.depth = v; }, v => v.toFixed(1)));
      panel.append(status);
      show();
    }
    draw();
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
})();

// Device sketches (scripts/devices.js): when a panel scrolls into view, its set knobs turn from noon to their value,
// one after another, like setting up the patch. Tap the drawing to play it again. Drawn finished without JavaScript.
(() => {
  const figs = [...document.querySelectorAll('.dev-sketch.has-set')];
  if (!figs.length || !('IntersectionObserver' in window)) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const ease = t => 1 - Math.pow(1 - t, 3);
  const play = fig => {
    const ptrs = [...fig.querySelectorAll('.dv-ctl.set .dv-ptr')];
    ptrs.forEach(g => g.setAttribute('transform', `rotate(0 ${g.dataset.cx} ${g.dataset.cy})`));
    const t0 = performance.now(), dur = 700, gap = 140;
    const step = now => {
      let busy = false;
      ptrs.forEach((g, i) => {
        const t = Math.min(1, Math.max(0, (now - t0 - i * gap) / dur));
        if (t < 1) busy = true;
        g.setAttribute('transform', `rotate(${(Number(g.dataset.a) * ease(t)).toFixed(1)} ${g.dataset.cx} ${g.dataset.cy})`);
      });
      if (busy) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); play(e.target); } }), { threshold: 0.5 });
  figs.forEach(f => { io.observe(f); f.addEventListener('click', () => play(f)); f.setAttribute('title', 'Tap to turn the knobs again'); });
})();
