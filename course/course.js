// Course diagram player: plays each step-through diagram like a GIF.
// Progressive enhancement: without this script the steps still work with the Back / Next labels.
// Self-hosted, no dependencies, no tracking.
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js'); // moving parts only show when this script runs

  // Anonymous, cookie-free counts with GoatCounter (a 1×1 image request; no third-party script).
  // Events show how far people get: started, played a diagram, mastered puzzle N.
  const count = (p, event, title) => {
    if (!/(^|\.)pachulski\.dev$/.test(location.hostname)) return; // never count local previews or tests
    const q = new URLSearchParams({ p, t: title || document.title, r: event ? '' : document.referrer, rnd: String(Math.random()).slice(2, 8) });
    if (event) q.set('e', 'true');
    new Image().src = `https://pachulski.goatcounter.com/count?${q}`;
  };
  count(location.pathname);

  // ── Actors: SVG parts that move between steps ─────────────────────────────────
  // data-move="2:40,20 3:440,20" → at step 2 the part sits at (40,20), at step 3 it travels to (440,20).
  // data-pulse="3"               → the part bounces when step 3 arrives.
  const actors = (fig, step, animate) => {
    for (const el of fig.querySelectorAll('[data-move]')) {
      const stops = el.dataset.move.trim().split(/\s+/).map(t => { const [k, xy] = t.split(':'); const [x, y] = xy.split(',').map(Number); return { k: Number(k), x, y }; });
      const at = stops.filter(s => s.k <= step).pop() || stops[0];
      const to = `translate(${at.x}px, ${at.y}px)`;
      const from = el.style.transform || to;
      el.style.transform = to;
      if (animate && !reduce && from !== to) el.animate([{ transform: from }, { transform: to }], { duration: 950, easing: 'cubic-bezier(.45,.05,.25,1)' });
    }
    if (animate && !reduce) for (const el of fig.querySelectorAll(`[data-pulse~="${step}"]`)) {
      el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 650, easing: 'ease-out' });
    }
  };

  for (const fig of document.querySelectorAll('.stepper')) {
    const radios = [...fig.querySelectorAll(':scope > input[type=radio]')];
    const caps = [...fig.querySelectorAll('.caps > li')];
    if (radios.length < 2) continue;

    let timer = null;
    let playing = false;
    let touched = false; // the reader took control: stop autoplaying

    const current = () => Math.max(0, radios.findIndex(r => r.checked));
    const go = i => {
      const n = (i + radios.length) % radios.length;
      radios[n].checked = true;
      actors(fig, n + 1, true);
      fig.style.setProperty('--dwell', `${dwell(n)}ms`);
      fig.classList.remove('tick'); void fig.offsetWidth; fig.classList.add('tick'); // restart the progress bar
    };
    // Long captions stay longer, so people can read them.
    const dwell = i => Math.min(9000, 2200 + (caps[i]?.textContent.length || 0) * 35);

    // Player bar: play/pause plus a progress bar for the current step.
    const bar = document.createElement('div');
    bar.className = 'player';
    bar.innerHTML = '<button type="button" class="play" aria-pressed="false">▶ Play</button><span class="meter" aria-hidden="true"><span></span></span>';
    fig.querySelector('.stage').after(bar);
    const btn = bar.querySelector('button');

    const schedule = () => {
      clearTimeout(timer);
      if (!playing) return;
      const i = current();
      const last = i === radios.length - 1;
      timer = setTimeout(() => { go(i + 1); schedule(); }, dwell(i) + (last ? 1500 : 0));
    };
    const setPlaying = p => {
      playing = p;
      fig.classList.toggle('playing', p);
      btn.setAttribute('aria-pressed', String(p));
      btn.textContent = p ? '❚❚ Pause' : '▶ Play';
      if (p) go(current()); // restart the meter for the step on screen
      schedule();
    };
    btn.addEventListener('click', () => { touched = true; setPlaying(!playing); if (playing) count(`play ${location.pathname}`, true, 'Played a diagram'); });

    actors(fig, current() + 1, false);
    for (const r of radios) r.addEventListener('change', () => actors(fig, current() + 1, true));
    // Any manual step change takes over from autoplay.
    for (const r of radios) r.addEventListener('change', () => {
      if (playing && fig.dataset.auto !== '1') { touched = true; setPlaying(false); }
    });
    fig.addEventListener('click', e => {
      if (e.target.closest('label')) { touched = true; setPlaying(false); }
    });

    // Arrow keys when the diagram has focus, swipes on phones.
    fig.tabIndex = -1;
    fig.addEventListener('keydown', e => {
      if (e.target.closest('button')) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault(); touched = true; setPlaying(false);
        go(current() + (e.key === 'ArrowRight' ? 1 : -1));
      }
    });
    let x0 = null;
    fig.addEventListener('touchstart', e => { const st = e.target.closest('.stage'); x0 = st && st.scrollWidth > st.clientWidth ? null : e.touches[0].clientX; }, { passive: true }); // a wide diagram on a phone scrolls instead
    fig.addEventListener('touchend', e => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) { touched = true; setPlaying(false); go(current() + (dx < 0 ? 1 : -1)); }
    });

    // Autoplay while on screen, like a GIF, unless the reader asked for less motion or took over.
    if (!reduce && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        if (touched) return;
        if (entry.isIntersecting && !playing) setPlaying(true);
        else if (!entry.isIntersecting && playing) setPlaying(false);
      }, { threshold: 0.6 }).observe(fig);
    }
  }

  // "Show me step N again": the label already selects the step; bring the diagram into view.
  for (const l of document.querySelectorAll('.show-me[data-goto]')) {
    l.addEventListener('click', () => {
      const fig = document.getElementById(`${l.dataset.goto}-1`)?.closest('.stepper');
      if (fig) setTimeout(() => fig.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }), 0);
    });
  }

  // ── Mastery: answer every question correctly to unlock the next puzzle ──────────
  const store = {
    get(course) { try { return JSON.parse(localStorage.getItem(`course:${course}:mastered`) || '[]'); } catch { return []; } },
    add(course, n) { try { const s = new Set(store.get(course)); s.add(n); localStorage.setItem(`course:${course}:mastered`, JSON.stringify([...s])); } catch {} },
    clear(course) { try { localStorage.removeItem(`course:${course}:mastered`); localStorage.removeItem(`course:${course}:missed`); } catch {} },
    // Questions you first answered wrong: your weak spots, for the tutor prompt. Only in this browser.
    missed(course) { try { return JSON.parse(localStorage.getItem(`course:${course}:missed`) || '[]'); } catch { return []; } },
    miss(course, n, q) {
      try {
        const m = store.missed(course).filter(x => !(x.n === n && x.q === q));
        m.push({ n, q });
        localStorage.setItem(`course:${course}:missed`, JSON.stringify(m.slice(-30)));
      } catch {}
    },
  };

  const puzzle = document.querySelector('article.puzzle[data-course]');
  if (puzzle) {
    const course = puzzle.dataset.course;
    const n = Number(puzzle.dataset.n);
    const quizzes = [...puzzle.querySelectorAll('fieldset.quiz')];
    const next = puzzle.querySelector('.pager a.primary');
    const msg = puzzle.querySelector('.gate-msg');
    const mastered = () => store.get(course).includes(n);
    const solved = q => !!q.querySelector('input[data-ok]:checked');

    const update = () => {
      quizzes.forEach(q => q.classList.toggle('solved', solved(q)));
      const done = quizzes.length > 0 && quizzes.every(solved);
      if (done && !mastered()) { store.add(course, n); count(`mastered ${course} ${n}`, true, `Mastered puzzle ${n}`); nudge(); }
      const open = done || mastered();
      if (next) {
        next.classList.toggle('locked', !open);
        next.setAttribute('aria-disabled', String(!open));
      }
      if (msg) {
        msg.hidden = open;
        const left = quizzes.filter(q => !solved(q)).length;
        msg.textContent = `Answer ${left === 1 ? 'the last question' : `the ${left} questions`} above correctly to unlock the next puzzle.`;
      }
    };
    // A gentle coffee reminder: only right after a puzzle is mastered, at most once a month.
    const nudge = () => {
      const url = puzzle.dataset.support;
      if (!url) return;
      try { if (Date.now() - Number(localStorage.getItem('course:nudged') || 0) < 30 * 864e5) return; localStorage.setItem('course:nudged', String(Date.now())); } catch { return; }
      const card = document.createElement('aside');
      card.className = 'nudge';
      card.setAttribute('aria-label', 'Support this course');
      card.innerHTML = `<p><b>Nice, puzzle mastered.</b> This course is free for everyone. If it's helping, a coffee keeps the next module coming.</p>
<p class="actions"><a class="button primary" href="${url}" rel="noopener">☕ Buy me a coffee</a><button type="button" class="button">Not now</button></p>`;
      card.querySelector('button').addEventListener('click', () => card.remove());
      card.querySelector('a').addEventListener('click', () => count(`coffee ${location.pathname}`, true, 'Clicked buy me a coffee'));
      document.body.append(card);
    };
    quizzes.forEach(q => q.addEventListener('change', update));
    // Which wrong answers do real learners pick? Count each wrong choice once per question per visit
    // (anonymous: puzzle, question and the option's first words, nothing about the person).
    const counted = new Set();
    quizzes.forEach((q, qi) => q.addEventListener('change', e => {
      const input = e.target;
      if (!input.matches('input[type=radio]') || input.hasAttribute('data-ok')) return;
      const key = `${qi}:${input.id}`;
      if (counted.has(key)) return;
      counted.add(key);
      const label = (q.querySelector(`label[for="${input.id}"]`)?.textContent || '').trim().slice(0, 60);
      store.miss(course, n, (q.querySelector('legend')?.textContent || '').trim());
      count(`wrong ${course} ${n} q${qi + 1}: ${label}`, true, `Wrong answer, puzzle ${n} question ${qi + 1}`);
    }));
    if (next) next.addEventListener('click', e => {
      if (next.classList.contains('locked')) {
        e.preventDefault();
        (quizzes.find(q => !solved(q)) || quizzes[0])?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    update();

    // Opened a puzzle before mastering the one it builds on? Point back to it.
    if (n > 0 && !store.get(course).includes(n - 1)) {
      const gate = document.createElement('div');
      gate.className = 'gate';
      gate.setAttribute('role', 'note');
      gate.innerHTML = `<p><b>This puzzle builds on the previous one.</b> You haven't passed the check for “${puzzle.dataset.prevTitle}” yet. Each puzzle uses the one before, so gaps add up.</p>
<p class="actions"><a class="button primary" href="${puzzle.dataset.prev}">Go to the previous puzzle</a><button type="button" class="button">Continue anyway</button></p>`;
      gate.querySelector('button').addEventListener('click', () => { gate.remove(); count(`skipped to ${course} ${n}`, true, `Skipped ahead to puzzle ${n}`); });
      puzzle.querySelector('nav[aria-label="Puzzles"]').after(gate);
    }

    // Mark the building blocks you've already passed.
    for (const li of puzzle.querySelectorAll('.builds-on li[data-block]')) if (store.get(course).includes(Number(li.dataset.block))) li.classList.add('done');

    // Mark mastered puzzles in the progress bar.
    const have = store.get(course);
    puzzle.querySelectorAll('.progress a').forEach((a, i) => { if (have.includes(i)) a.classList.add('done'); });
  }

  // ── Module check: a right answer marks that puzzle passed ──
  const mc = document.querySelector('article.module-check[data-course]');
  if (mc) {
    const course = mc.dataset.course;
    const qs = [...mc.querySelectorAll('fieldset.quiz[data-n]')];
    const out = mc.querySelector('.check-result');
    const tally = () => {
      const right = qs.filter(q => q.querySelector('input[data-ok]:checked'));
      const wrong = qs.filter(q => q.querySelector('input:checked:not([data-ok])'));
      right.forEach(q => store.add(course, Number(q.dataset.n)));
      if (out && right.length + wrong.length === qs.length) {
        out.textContent = wrong.length ? `${right.length} of ${qs.length} right. Start with puzzle ${Math.min(...wrong.map(q => Number(q.dataset.n)))}.` : `All ${qs.length} right: this module is marked as passed.`;
        count(`check ${course} ${location.pathname.split('/').pop()}: ${right.length}/${qs.length}`, true, 'Took a module check');
      }
    };
    qs.forEach(q => q.addEventListener('change', tally));
  }

  // ── Course cards on the catalog: how far you got in each course ──
  for (const card of document.querySelectorAll('[data-progress]')) {
    const have = store.get(card.dataset.progress).length;
    const total = Number(card.dataset.total);
    const mine = card.querySelector('.mine');
    if (mine && have) mine.textContent = have >= total ? 'completed ✓' : `${have} of ${total} mastered`;
    const go = card.querySelector('.button.primary');
    if (go && have) go.textContent = have >= total ? 'Review the course →' : 'Continue →';
  }

  // ── Overview: ✓ mastered, → next, 🔒 not yet; "Continue" resumes where you stopped ──
  const items = [...document.querySelectorAll('.modules li[data-course]')];
  if (items.length) {
    const course = items[0].dataset.course;
    const have = store.get(course);
    let next = items.findIndex(li => !have.includes(Number(li.dataset.n)));
    items.forEach((li, i) => { li.dataset.state = have.includes(Number(li.dataset.n)) ? 'done' : i === next ? 'next' : 'locked'; });
    const resume = document.querySelector(`[data-resume="${course}"]`);
    if (resume && have.length) {
      if (next === -1) { resume.textContent = 'Course complete: review from the start →'; next = 0; }
      else resume.textContent = `Continue: puzzle ${items[next].dataset.n} →`;
      resume.href = items[next].querySelector('a').getAttribute('href');
      const count = document.createElement('p');
      count.className = 'mastery';
      count.innerHTML = `${have.length} of ${items.length} puzzles mastered · <button type="button" class="linklike">Reset my progress</button>`;
      count.querySelector('button').addEventListener('click', () => { store.clear(course); location.reload(); });
      resume.parentElement.after(count);
    }
  }
  // ── Continue with Claude: a tutor prompt built from this course and your progress ──
  const tutorBtn = document.querySelector('[data-tutor]');
  const tutorData = document.getElementById('tutor-data');
  if (tutorBtn && tutorData) {
    const course = tutorBtn.dataset.tutor;
    const out = document.querySelector('.tutor-prompt');
    const status = document.querySelector('.tutor-status');
    tutorBtn.addEventListener('click', async () => {
      let d;
      try { d = JSON.parse(tutorData.textContent); } catch { return; }
      const have = new Set(store.get(course));
      const next = d.puzzles.find(p => !have.has(p.n));
      const known = d.terms.filter(t => have.has(t.in));
      const missed = store.missed(course).filter(m => d.puzzles[m.n]);
      const lines = [
        `Be my tutor for "${d.title}", a free course I'm taking at ${d.url}. Stay with it until I say stop.`,
        '',
        'How to teach me:',
        '- Foundation first: one small idea at a time, each standing on one I already have. If I lack a block, teach that block first.',
        '- For each idea: a plain explanation, an everyday analogy, then one quick question. Wait for my answer before going on.',
        '- Use only the words I know (listed below); define any new word the first time you use it.',
        "- Go under the hood: who does the work, on which thread or process, and why it's built that way.",
        "- If you're unsure of a fact, say so and point me to a primary source (official docs, the spec, the source code).",
        '',
        `The course, in order (✓ = I've passed it):`,
        ...d.puzzles.map(p => `${have.has(p.n) ? '✓' : '·'} ${p.n}. ${p.title}: ${p.takeaway}`),
        ...(d.upcoming.length ? ['', 'Not written yet (good places to go next):', ...d.upcoming.map(u => `- ${u}`)] : []),
        ...(d.assumes ? ['', `The course assumes I know: ${d.assumes}.`] : []),
        '',
        known.length ? 'Words I know from it:' : "I haven't passed a puzzle yet, so assume only that I know Kotlin and Android app basics.",
        ...known.map(t => `- ${t.t}: ${t.def}`),
        ...(missed.length ? ['', 'Questions I got wrong at first (my weak spots):', ...missed.map(m => `- Puzzle ${m.n}: ${m.q}`)] : []),
        '',
        next
          ? `Where I am: next is puzzle ${next.n}, "${next.title}". Start with one question to check I really have the block it builds on${missed.length ? ', or one of my weak spots' : ''}. Then teach me what it covers, your way, and keep going.`
          : `I've passed every puzzle. ${missed.length ? 'Start by testing my weak spots. Then' : 'Start with one question on the hardest idea. Then'} take me into the topics that aren't written yet, the same way.`,
      ];
      const text = lines.join('\n');
      out.value = text;
      out.hidden = false;
      let copied = false;
      try { await navigator.clipboard.writeText(text); copied = true; } catch {}
      if (!copied) { out.focus(); out.select(); }
      status.textContent = copied
        ? `Copied (${have.size} of ${d.puzzles.length} puzzles passed${missed.length ? `, ${missed.length} weak spot${missed.length === 1 ? '' : 's'}` : ''}). Open Claude and paste it.`
        : 'Select the text below and copy it, then paste it into Claude.';
      count(`tutor ${course}`, true, 'Copied a tutor prompt');
    });
  }
})();
