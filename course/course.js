// Course diagram player: plays each step-through diagram like a GIF.
// Progressive enhancement: without this script the steps still work with the Back / Next labels.
// Self-hosted, no dependencies, no tracking.
(() => {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Anonymous, cookie-free counts with GoatCounter (a 1×1 image request; no third-party script).
  // Events show how far people get: started, played a diagram, mastered puzzle N.
  const count = (p, event, title) => {
    if (!/(^|\.)pachulski\.dev$/.test(location.hostname)) return; // never count local previews or tests
    const q = new URLSearchParams({ p, t: title || document.title, r: event ? '' : document.referrer, rnd: String(Math.random()).slice(2, 8) });
    if (event) q.set('e', 'true');
    new Image().src = `https://pachulski.goatcounter.com/count?${q}`;
  };
  count(location.pathname);

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
    fig.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
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

  // ── Mastery: answer every question correctly to unlock the next puzzle ──────────
  const store = {
    get(course) { try { return JSON.parse(localStorage.getItem(`course:${course}:mastered`) || '[]'); } catch { return []; } },
    add(course, n) { try { const s = new Set(store.get(course)); s.add(n); localStorage.setItem(`course:${course}:mastered`, JSON.stringify([...s])); } catch {} },
    clear(course) { try { localStorage.removeItem(`course:${course}:mastered`); } catch {} },
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
      if (done && !mastered()) { store.add(course, n); count(`mastered ${course} ${n}`, true, `Mastered puzzle ${n}`); }
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
    quizzes.forEach(q => q.addEventListener('change', update));
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

    // Mark mastered puzzles in the progress bar.
    const have = store.get(course);
    puzzle.querySelectorAll('.progress a').forEach((a, i) => { if (have.includes(i)) a.classList.add('done'); });
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
})();
