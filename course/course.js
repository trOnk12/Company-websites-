// Course diagram player: plays each step-through diagram like a GIF.
// Progressive enhancement: without this script the steps still work with the Back / Next labels.
// Self-hosted, no dependencies.
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js'); // moving parts only show when this script runs

  // Anonymous, cookie-free counts with GoatCounter (a 1×1 image request; no third-party script).
  // Events show how far people get: started, played a diagram, mastered puzzle N.
  const count = (p, event, title) => {
    if (!/(^|\.)pachulski\.dev$/.test(location.hostname)) return; // never count local previews or tests
    if (navigator.globalPrivacyControl || navigator.doNotTrack === '1') return;
    const q = new URLSearchParams({ p, t: title || document.title, rnd: String(Math.random()).slice(2, 8) });
    if (event) q.set('e', 'true');
    const pixel = new Image();
    pixel.referrerPolicy = 'no-referrer';
    pixel.src = `https://pachulski.goatcounter.com/count?${q}`;
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
  // Progress is saved by puzzle slug (course:<id>:done), so it survives new puzzles being inserted; callers still
  // work with puzzle numbers in the current order. Progress saved by number (course:<id>:mastered) is migrated once,
  // through the course's old order when it has since been renumbered.
  const IDX = window.COURSE_INDEX || { cur: {}, legacy: {} };
  const slugs = c => IDX.cur[c] || [];
  const read = k => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const done = c => {
    const have = read(`course:${c}:done`);
    if (Array.isArray(have)) return have;
    const old = read(`course:${c}:mastered`) || [], order = IDX.legacy[c] || slugs(c);
    const migrated = [...new Set(old.map(n => order[n]).filter(Boolean))];
    if (slugs(c).length) write(`course:${c}:done`, migrated);
    return migrated;
  };
  const store = {
    get(course) { const s = slugs(course); return done(course).map(x => s.indexOf(x)).filter(i => i >= 0); },
    add(course, n) { const slug = slugs(course)[n]; if (!slug) return; const d = new Set(done(course)); d.add(slug); write(`course:${course}:done`, [...d]); },
    clear(course) { try { ['done', 'mastered', 'missed', 'last'].forEach(k => localStorage.removeItem(`course:${course}:${k}`)); } catch {} },
    // Questions you first answered wrong: your weak spots, for the tutor prompt. Only in this browser.
    missed(course) {
      const s = slugs(course), order = IDX.legacy[course] || s;
      return (read(`course:${course}:missed`) || []).map(m => ({ n: s.indexOf(m.s || order[m.n]), q: m.q })).filter(m => m.n >= 0);
    },
    miss(course, n, q) {
      const slug = slugs(course)[n]; if (!slug) return;
      const s = slugs(course), order = IDX.legacy[course] || s;
      const m = (read(`course:${course}:missed`) || []).map(x => ({ s: x.s || order[x.n], q: x.q })).filter(x => !(x.s === slug && x.q === q));
      m.push({ s: slug, q });
      write(`course:${course}:missed`, m.slice(-30));
    },
  };

  function unfinishedVisit(course, passed) {
    const index = slugs(course).indexOf(read(`course:${course}:last`));
    return passed.has(index) ? -1 : index;
  }

  const puzzle = document.querySelector('article.puzzle[data-course]');
  if (puzzle) {
    const course = puzzle.dataset.course;
    const n = Number(puzzle.dataset.n);
    if (!store.get(course).includes(n)) write(`course:${course}:last`, slugs(course)[n]);
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
        msg.textContent = `Answer ${left === 1 ? 'the last question' : `the ${left} questions`} above correctly to ${next ? 'unlock the next puzzle' : 'mark this puzzle as passed'}.`;
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

    const passed = new Set(store.get(course));
    const missing = [...puzzle.querySelectorAll('.builds-on li[data-block]')]
      .filter(li => !passed.has(Number(li.dataset.block)));
    if (!passed.has(n) && missing.length) {
      const gate = document.createElement('div');
      gate.className = 'gate';
      gate.setAttribute('role', 'note');
      const prerequisite = missing[0].querySelector('details a');
      gate.innerHTML = '<p><b>Building blocks to review</b></p><p class="actions"><a class="button primary"></a><button type="button" class="button">Continue anyway</button></p>';
      const review = gate.querySelector('a');
      review.href = prerequisite.href;
      review.textContent = missing[0].querySelector('summary').textContent;
      gate.querySelector('button').addEventListener('click', () => { gate.remove(); count(`skipped to ${course} ${n}`, true, `Skipped ahead to puzzle ${n}`); });
      puzzle.querySelector('.lesson-jumps').after(gate);
    }

    // Mark the building blocks you've already passed.
    for (const li of puzzle.querySelectorAll('.builds-on li[data-block]')) if (passed.has(Number(li.dataset.block))) li.classList.add('done');
    for (const [i, a] of [...puzzle.querySelectorAll('.progress a')].entries()) {
      if (passed.has(i)) a.classList.add('done');
    }

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

  // Opening a shared link to an optional section makes that section visible.
  const openLinkedDetail = () => {
    const detail = document.getElementById(location.hash.slice(1));
    if (detail?.matches('details')) detail.open = true;
  };
  openLinkedDetail();
  window.addEventListener('hashchange', openLinkedDetail);

  const search = document.querySelector('#puzzle-search');
  if (search) {
    const panel = search.closest('section');
    const rows = [...panel.querySelectorAll('li')];
    const status = panel.querySelector('[role="status"]');
    const list = panel.querySelector('ul');
    function filterPuzzles() {
      const terms = search.value.toLowerCase().trim().split(/\s+/).filter(Boolean);
      let count = 0;
      for (const row of rows) {
        const words = (row.textContent + ' ' + row.dataset.summary).toLowerCase();
        row.hidden = !terms.length || !terms.every(term => words.includes(term));
        if (!row.hidden) count++;
      }
      list.hidden = !count;
      status.textContent = !terms.length ? '' : count ? `${count} matching puzzle${count === 1 ? '' : 's'}` : 'No puzzles found. Try a shorter term or browse the courses below.';
    }
    filterPuzzles();
    panel.hidden = false;
    search.addEventListener('input', filterPuzzles);
  }

  // ── Course cards on the catalog: resume an unfinished course ──
  for (const card of document.querySelectorAll('[data-progress]')) {
    const course = card.dataset.progress;
    const have = new Set(store.get(course));
    const total = Number(card.dataset.total);
    const bar = card.querySelector('progress');
    bar.value = have.size;
    const last = unfinishedVisit(course, have);
    if (!have.size && last < 0) continue;
    card.querySelector('.mine').textContent = have.size === total ? 'Completed' : `${have.size} of ${total} passed`;
    const go = card.querySelector('[data-puzzles]');
    const puzzles = go.dataset.puzzles.split(' ');
    const next = last >= 0 ? last : puzzles.findIndex((_, i) => !have.has(i));
    go.textContent = next === -1 ? 'Review course' : 'Continue learning';
    if (next !== -1) go.href = `${course}/${puzzles[next]}.html`;
  }

  // ── Overview: show progress and expand the module that contains the next puzzle ──
  const items = [...document.querySelectorAll('.modules li[data-course]')];
  if (items.length) {
    const course = items[0].dataset.course;
    const have = new Set(store.get(course));
    const last = unfinishedVisit(course, have);
    const next = items.find(li => Number(li.dataset.n) === last && !have.has(last)) || items.find(li => !have.has(Number(li.dataset.n)));
    items.forEach(li => {
      const passed = have.has(Number(li.dataset.n));
      li.dataset.state = passed ? 'done' : li === next ? 'next' : 'upcoming';
      li.querySelector('.puzzle-state').textContent = passed ? 'Passed' : li === next && have.size ? 'Up next' : '';
    });
    const resume = document.querySelector(`[data-resume="${course}"]`);
    if (resume && (have.size || last >= 0)) {
      if (next) {
        const lesson = next.querySelector('a');
        resume.textContent = `Continue: ${lesson.textContent}`;
        resume.href = lesson.getAttribute('href');
        const module = next.closest('.course-module');
        if (module) module.open = true;
      } else {
        resume.textContent = 'Review from the start';
      }
      const progress = document.createElement('p');
      progress.className = 'mastery';
      progress.innerHTML = `${have.size} of ${items.length} puzzles passed · <button type="button" class="linklike">Reset my progress</button>`;
      progress.querySelector('button').addEventListener('click', () => {
        if (window.confirm('Reset your saved progress for this course?')) { store.clear(course); location.reload(); }
      });
      resume.parentElement.after(progress);
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
      const last = unfinishedVisit(course, have);
      const next = d.puzzles.find(p => p.n === last) || d.puzzles.find(p => !have.has(p.n));
      const known = d.terms.filter(t => have.has(t.in));
      const missed = store.missed(course).filter(m => d.puzzles[m.n]);
      const lines = [
        `Be my tutor for "${d.title}", a free course I'm taking at ${d.url}. Stay with it until I say stop.`,
        '',
        'How to teach me:',
        '- Foundation first: one small idea at a time, each standing on one I already have. If I lack a block, teach that block first.',
        '- For each idea: a plain explanation, an everyday analogy, then one quick question. Wait for my answer before going on.',
        '- Define each new term on first use. If I ask why an explanation works, follow that mechanism down one layer and return to the original problem with the same example.',
        '- Ask me to predict an outcome after changing one condition, then explain the answer from the earlier puzzles.',
        "- Go under the hood: who does the work, on which thread or process, and why it's built that way.",
        "- If you're unsure of a fact, say so and point me to a primary source (official docs, the spec, the source code).",
        '',
        `The course, in order (✓ = I've passed it):`,
        ...d.puzzles.map(p => `${have.has(p.n) ? '✓' : '·'} ${p.n}. ${p.title}: ${p.takeaway}`),
        ...(d.upcoming.length ? ['', 'Not written yet (good places to go next):', ...d.upcoming.map(u => `- ${u}`)] : []),
        ...(d.assumes ? ['', `The course assumes I know: ${d.assumes}.`] : []),
        '',
        known.length ? 'Words I know from it:' : "I haven't passed a puzzle yet. Start from the stated prerequisites and check what I already know.",
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
  // ── Your learning: progress everywhere, what to learn next, weak spots, export/import ──
  const meData = document.getElementById('me-data');
  if (meData) {
    let courses = [];
    try { courses = JSON.parse(meData.textContent); } catch {}
    const passed = id => new Set(store.get(id));
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
    const link = (href, text) => { const a = el('a', null, text); a.href = href; return a; };
    const byId = Object.fromEntries(courses.map(c => [c.id, c]));
    const done = c => c.puzzles.every(p => passed(c.id).has(p.n));

    // Where you are
    const where = document.querySelector('.me-courses');
    for (const c of courses) {
      const have = passed(c.id), li = el('li', 'me-course');
      li.append(link(`${c.id}/`, c.title));
      const bar = el('progress'); bar.max = c.puzzles.length; bar.value = have.size; bar.setAttribute('aria-label', `${c.title}: ${have.size} of ${c.puzzles.length}`);
      li.append(bar, el('span', 'small', have.size === 0 ? (unfinishedVisit(c.id, have) >= 0 ? ' started · 0 passed' : ' not started') : have.size === c.puzzles.length ? ' complete ✓' : ` ${have.size} of ${c.puzzles.length}`));
      where.append(li);
    }

    // Learn next: the next puzzle whose building blocks you have, in courses you've started;
    // then courses whose prerequisite you've finished; then starting points.
    const next = [];
    for (const c of courses) {
      const have = passed(c.id);
      const last = unfinishedVisit(c.id, have);
      const saved = c.puzzles.find(p => p.n === last);
      if (saved) {
        next.push({ c, p: saved, why: 'Continue the puzzle you last opened in this course.' });
        continue;
      }
      if (!have.size || have.size === c.puzzles.length) continue;
      const ready = c.puzzles.find(p => !have.has(p.n) && p.blocks.every(b => have.has(b)));
      const p = ready || c.puzzles.find(p => !have.has(p.n));
      const why = !ready ? 'Start by checking the building blocks listed in this puzzle.'
        : p.blocks.length ? `You have its building blocks: ${p.blocks.map(b => c.puzzles[b].title).join(', ')}.` : `Next in ${c.title}.`;
      next.push({ c, p, why });
    }
    for (const c of courses) {
      if (next.some(item => item.c === c) || passed(c.id).size || !c.assumes || !byId[c.assumes] || !done(byId[c.assumes])) continue;
      next.push({ c, p: c.puzzles[0], why: `It builds on ${byId[c.assumes].title}, which you've finished.` });
    }
    if (!next.length) for (const id of ['android', 'sysdesign', 'security']) if (byId[id] && !passed(id).size) next.push({ c: byId[id], p: byId[id].puzzles[0], why: 'A course that starts from zero.' });
    const ol = document.querySelector('.me-next'); ol.textContent = '';
    for (const { c, p, why } of next.slice(0, 4)) {
      const li = el('li', 'me-suggestion');
      li.append(link(`${c.id}/${p.slug}.html`, p.title), el('span', 'small me-course-name', ` · ${c.title}`), el('p', 'small', why));
      ol.append(li);
    }

    // Go back to: questions first answered wrong
    const weak = document.querySelector('.me-weak'); let any = false;
    for (const c of courses) for (const m of store.missed(c.id)) {
      const p = c.puzzles[m.n]; if (!p) continue; any = true;
      const li = el('li'); li.append(link(`${c.id}/${p.slug}.html`, m.q), el('span', 'small', ` · ${p.title}`)); weak.append(li);
    }
    if (!any) weak.append(el('li', 'small', 'Nothing yet: wrong answers you give in a quiz show up here.'));

    // Export / import
    const status = document.querySelector('.me-status');
    document.querySelector('[data-export]').addEventListener('click', () => {
      const dump = {};
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (/^(course|music):/.test(k)) dump[k] = localStorage.getItem(k); } } catch {}
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify({ site: 'pachulski.dev', saved: new Date().toISOString(), progress: dump }, null, 1)], { type: 'application/json' }));
      a.download = 'pachulski-progress.json'; document.body.append(a); a.click(); a.remove();
      status.textContent = 'Saved. Load this file on your other device.';
      count('progress export', true, 'Saved progress to a file');
    });
    document.querySelector('[data-import]').addEventListener('change', async e => {
      const file = e.target.files[0]; if (!file) return;
      try {
        const d = JSON.parse(await file.text());
        const entries = Object.entries(d.progress || {}).filter(([k, v]) => /^(course|music):[\w:-]+$/.test(k) && typeof v === 'string' && v.length < 20000);
        for (const [k, v] of entries) localStorage.setItem(k, v);
        status.textContent = `Loaded ${entries.length} saved items.`; setTimeout(() => location.reload(), 600);
      } catch { status.textContent = "That file isn't a progress file from this site."; }
    });
  }
})();
