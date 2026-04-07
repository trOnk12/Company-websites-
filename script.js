'use strict';

/* =====================
   UTILITIES
   ===================== */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isMobile() {
  return window.innerWidth <= 640;
}

/* =====================
   CLICK TRACKER
   ===================== */
const CLICK_STATS_KEY = 'pachulski_click_stats';

function recordClick(label) {
  let stats = {};
  try {
    stats = JSON.parse(localStorage.getItem(CLICK_STATS_KEY) || '{}');
  } catch (_) {}
  const now = new Date().toISOString();
  if (!stats[label]) {
    stats[label] = { count: 0, firstClicked: now, lastClicked: now };
  }
  stats[label].count++;
  stats[label].lastClicked = now;
  try {
    localStorage.setItem(CLICK_STATS_KEY, JSON.stringify(stats));
  } catch (_) {}
}

function getClickStats() {
  try {
    return JSON.parse(localStorage.getItem(CLICK_STATS_KEY) || '{}');
  } catch (_) {
    return {};
  }
}

/* =====================
   FOOTER YEAR
   ===================== */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* =====================
   CUSTOM CURSOR
   ===================== */
const cursor = document.getElementById('cursor');

if (!isMobile() && cursor) {
  document.body.style.cursor = 'none';
  document.addEventListener('mousemove', e => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top  = e.clientY + 'px';
  });

  document.addEventListener('mousedown', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(2.2)';
  });

  document.addEventListener('mouseup', () => {
    cursor.style.transform = 'translate(-50%, -50%) scale(1)';
  });
}

/* =====================
   SMOOTH SCROLL (all #anchors)
   ===================== */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* =====================
   SCROLL REVEAL (.fade-up)
   ===================== */
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

/* =====================
   CASE STUDY STAT COUNTER
   ===================== */
function animateCounter(el) {
  const target   = parseInt(el.dataset.target, 10);
  const suffix   = el.dataset.suffix || '';
  const duration = 1800;
  const start    = performance.now();

  function step(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased    = 1 - Math.pow(1 - progress, 3);
    const current  = Math.round(eased * target);
    el.textContent = current + suffix;
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const statObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      el.classList.add('visible');
      if (el.dataset.target) animateCounter(el);
      statObserver.unobserve(el);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.cs-stat').forEach(el => statObserver.observe(el));

/* =====================
   TYPEWRITER EFFECT (hero)
   ===================== */
const typewriterLines = [
  'Senior Android Engineer. Apps shipped. Architecture that lasts.',
  '7+ years across banking, messaging & IoT in 4 countries.',
  'Production-grade Kotlin & Jetpack Compose, on time.',
  'AI-accelerated delivery. Your app ships in weeks, not months.'
];

const twEl = document.getElementById('typewriter-text');

async function runTypewriter() {
  if (!twEl) return;
  let lineIdx = 0;

  while (true) {
    const line = typewriterLines[lineIdx];

    // Type forward
    for (let i = 0; i <= line.length; i++) {
      twEl.textContent = line.substring(0, i);
      await sleep(50);
    }

    // Pause at full line
    await sleep(2800);

    // Delete backwards
    for (let i = line.length; i >= 0; i--) {
      twEl.textContent = line.substring(0, i);
      await sleep(35);
    }

    // Brief gap before next line
    await sleep(120);
    lineIdx = (lineIdx + 1) % typewriterLines.length;
  }
}

runTypewriter();

/* =====================
   KEYBOARD SHORTCUTS TOAST
   ===================== */
const kbdToast = document.getElementById('kbd-toast');

if (kbdToast) {
  setTimeout(() => {
    kbdToast.classList.add('visible');
    setTimeout(() => kbdToast.classList.remove('visible'), 3000);
  }, 800);
}

/* =====================
   TERMINAL EASTER EGG
   ===================== */
const terminal   = document.getElementById('terminal');
const termOutput = document.getElementById('term-output');
const termInput  = document.getElementById('term-input');
const termClose  = document.getElementById('term-close');

let termOpen    = false;
let termTyping  = false;
let termQueue   = [];

function openTerminal() {
  if (isMobile() || !terminal) return;
  termOpen = true;
  terminal.classList.add('open');
  terminal.setAttribute('aria-hidden', 'false');
  if (termOutput && termOutput.childElementCount === 0) {
    appendTermLine('Welcome to pachulski.dev terminal. Type "help" to start.', 'accent');
  }
  if (termInput) termInput.focus();
  const trigger = document.getElementById('term-trigger');
  if (trigger) {
    trigger.classList.add('hidden');
    trigger.setAttribute('aria-expanded', 'true');
  }
}

function closeTerminal() {
  if (!terminal) return;
  termOpen = false;
  terminal.classList.remove('open');
  terminal.setAttribute('aria-hidden', 'true');
  const trigger = document.getElementById('term-trigger');
  if (trigger) {
    trigger.classList.remove('hidden');
    trigger.setAttribute('aria-expanded', 'false');
  }
}

function appendTermLine(text, cls) {
  if (!termOutput) return;
  const line = document.createElement('div');
  line.className = 'term-line' + (cls ? ' ' + cls : '');
  line.textContent = text;
  termOutput.appendChild(line);
  termOutput.scrollTop = termOutput.scrollHeight;
  return line;
}

async function typeTermLine(text, cls) {
  if (!termOutput) return;
  const line = document.createElement('div');
  line.className = 'term-line' + (cls ? ' ' + cls : '');
  line.textContent = '';
  termOutput.appendChild(line);
  termOutput.scrollTop = termOutput.scrollHeight;

  for (const char of text) {
    line.textContent += char;
    await sleep(22);
  }
  termOutput.scrollTop = termOutput.scrollHeight;
}

async function processCommand(raw) {
  const cmd = raw.trim();
  if (!cmd) return;

  // Echo prompt + command (textContent to avoid XSS)
  const echo = document.createElement('div');
  echo.className = 'term-prompt-echo';
  const promptSpan = document.createElement('span');
  promptSpan.className = 'term-prompt-color';
  promptSpan.textContent = 'visitor@pachulski.dev:~$';
  const cmdText = document.createTextNode(' ' + cmd);
  echo.appendChild(promptSpan);
  echo.appendChild(cmdText);
  termOutput.appendChild(echo);

  const c = cmd.toLowerCase();

  if (c === 'whoami') {
    await typeTermLine('Mateusz Pachulski — Senior Android Engineer.');
    await typeTermLine('7+ years. 4 countries. Available now.');
    await typeTermLine('Building production-grade apps since 2017.');

  } else if (c === 'ls projects') {
    await typeTermLine('synaptic/          wire-messenger/');
    await typeTermLine('santander-bank/    ble-mesh-sdk/');
    await typeTermLine('fitcrony/          blocktrade/');

  } else if (c === 'stack') {
    await typeTermLine('Kotlin · Jetpack Compose · KMP');
    await typeTermLine('Clean Architecture · Coroutines');
    await typeTermLine('gRPC · Protobuf · BLE · Flutter');
    await typeTermLine('WCAG · CI/CD · AI Agents');

  } else if (c === 'contact') {
    await typeTermLine('Opening contact section...');
    setTimeout(() => {
      const contactSection = document.getElementById('contact');
      if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
    }, 500);

  } else if (c === 'clear') {
    termOutput.innerHTML = '';

  } else if (c === 'exit') {
    await typeTermLine('Closing terminal...');
    await sleep(400);
    closeTerminal();

  } else if (c === 'stats') {
    const stats = getClickStats();
    const entries = Object.entries(stats);
    if (entries.length === 0) {
      await typeTermLine('No clicks recorded yet.', 'muted');
    } else {
      await typeTermLine('Click statistics (most clicked first):');
      const sorted = entries.sort((a, b) => b[1].count - a[1].count);
      for (const [label, data] of sorted) {
        await typeTermLine('  ' + data.count + 'x  ' + label);
      }
    }

  } else if (c === 'help') {
    await typeTermLine('Available commands:');
    await typeTermLine('  whoami        — About me');
    await typeTermLine('  ls projects   — List projects');
    await typeTermLine('  stack         — Technology stack');
    await typeTermLine('  contact       — Scroll to contact');
    await typeTermLine('  stats         — Click statistics');
    await typeTermLine('  clear         — Clear terminal');
    await typeTermLine('  exit          — Close terminal');
    await typeTermLine('  help          — Show this list');

  } else {
    await typeTermLine('command not found: ' + cmd, 'muted');
    await typeTermLine('Type "help" to see available commands.', 'muted');
  }

  termOutput.scrollTop = termOutput.scrollHeight;
}

if (termInput) {
  termInput.addEventListener('keydown', async e => {
    if (e.key === 'Enter') {
      const val = termInput.value;
      termInput.value = '';
      await processCommand(val);
    }
  });
}

if (termClose) {
  termClose.addEventListener('click', closeTerminal);
}

const termTrigger = document.getElementById('term-trigger');
if (termTrigger) {
  termTrigger.addEventListener('click', () => {
    if (termOpen) closeTerminal();
    else openTerminal();
  });
}

/* =====================
   KEYBOARD SHORTCUTS
   ===================== */
const navSections = ['hero', 'case-studies', 'services', 'how-i-work', 'stack', 'timeline'];

document.addEventListener('keydown', e => {
  const tag     = document.activeElement ? document.activeElement.tagName : '';
  const isTermInput = document.activeElement === termInput;

  // Always handle backtick (toggle terminal)
  if (e.key === '`') {
    e.preventDefault();
    if (termOpen) closeTerminal();
    else openTerminal();
    return;
  }

  // Always handle Escape (close terminal or quick brief)
  if (e.key === 'Escape') {
    if (termOpen) {
      e.preventDefault();
      closeTerminal();
    } else if (qbOpen) {
      e.preventDefault();
      closeQB();
    }
    return;
  }

  // Disable other shortcuts when focused in a form field (but not terminal input)
  const inFormField = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') && !isTermInput;
  if (inFormField) return;

  // 1–6: navigate to sections
  if (e.key >= '1' && e.key <= '6') {
    const id = navSections[parseInt(e.key, 10) - 1];
    const section = document.getElementById(id);
    if (section) section.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  // B / b: book (scroll to contact)
  if (e.key === 'B' || e.key === 'b') {
    const contact = document.getElementById('contact');
    if (contact) contact.scrollIntoView({ behavior: 'smooth' });
  }
});

/* =====================
   CONTACT FORM
   ===================== */
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (contactForm && formSuccess) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();

    // Basic validation
    const firstName = contactForm.querySelector('#firstName');
    const email     = contactForm.querySelector('#email');
    const message   = contactForm.querySelector('#message');

    let valid = true;
    [firstName, email, message].forEach(field => {
      const ok = field.value.trim() !== '' &&
        (field.type !== 'email' || field.validity.valid);
      field.setAttribute('aria-invalid', ok ? 'false' : 'true');
      field.style.borderColor = ok ? '' : 'var(--accent)';
      if (!ok) valid = false;
    });

    if (!valid) {
      const firstBad = contactForm.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    const btn = contactForm.querySelector('.submit-btn');
    btn.textContent = 'Sending...';
    btn.disabled = true;

    // Simulate async send
    await sleep(1500);

    contactForm.style.display = 'none';
    formSuccess.hidden = false;
  });

  // Reset border highlight + aria-invalid on input
  contactForm.querySelectorAll('input, textarea').forEach(field => {
    field.addEventListener('input', () => {
      field.style.borderColor = '';
      field.removeAttribute('aria-invalid');
    });
  });
}

/* =====================
   PIXEL TAMAGOTCHI
   ===================== */

const PIXEL_SIZE = 4;
const THEME_KEYS = ['default', 'ai', 'mobile', 'specialist'];

// ── Base frame builders (default / green) ──────────────────────────────────
function makeTamaIdle() {
  return [
    [0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0],
    [0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,1,3,3,1,1,1,1,3,3,1,1,0,0],
    [0,0,1,1,3,4,1,1,1,1,3,4,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,1,1,5,5,5,5,5,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0],
    [0,0,0,1,1,0,0,0,0,0,1,1,0,0,0,0],
  ];
}
function makeTamaBlink() {
  const f = makeTamaIdle();
  f[5] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  f[6] = [0,0,1,1,2,2,1,1,1,1,2,2,1,1,0,0];
  return f;
}
function makeTamaWave() {
  const f = makeTamaIdle();
  f[5]  = [0,0,1,1,5,5,1,1,1,1,5,5,1,1,0,0];
  f[6]  = [0,0,1,1,5,5,1,1,1,1,5,5,1,1,0,0];
  f[8]  = [0,0,1,5,5,5,5,5,5,5,5,5,1,1,0,0];
  f[10] = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  f[11] = [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0];
  f[12] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  return f;
}
function makeTamaHappy() {
  const f = makeTamaIdle();
  f[5] = [0,0,1,1,1,3,1,1,1,1,1,3,1,1,0,0];
  f[6] = [0,0,1,1,3,1,1,1,1,1,3,1,1,1,0,0];
  f[8] = [0,0,1,5,5,5,5,5,5,5,5,5,5,1,0,0];
  return f;
}
function makeTamaSleep() {
  const f = makeTamaIdle();
  f[0] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[1] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[2] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[5] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  f[6] = [0,0,1,1,2,2,1,1,1,1,2,2,1,1,0,0];
  f[8] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  return f;
}

// ── AI theme frames (circuit antennae, rectangular eyes) ───────────────────
function makeAiIdle() {
  const f = makeTamaIdle();
  f[0] = [0,0,0,5,0,5,0,0,0,5,0,5,0,0,0,0];
  f[1] = [0,0,0,5,5,5,0,0,0,5,5,5,0,0,0,0];
  f[2] = [0,0,0,0,5,0,0,0,0,0,5,0,0,0,0,0];
  f[5] = [0,0,1,1,3,3,3,1,1,3,3,3,1,1,0,0];
  f[6] = [0,0,1,1,4,4,4,1,1,4,4,4,1,1,0,0];
  return f;
}
function makeAiBlink() {
  const f = makeAiIdle();
  f[5] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  f[6] = [0,0,1,1,2,2,2,1,1,2,2,2,1,1,0,0];
  return f;
}
function makeAiWave() {
  const f = makeAiIdle();
  f[5]  = [0,0,1,1,5,5,5,1,1,5,5,5,1,1,0,0];
  f[6]  = [0,0,1,1,5,5,5,1,1,5,5,5,1,1,0,0];
  f[8]  = [0,0,1,5,5,5,5,5,5,5,5,5,1,1,0,0];
  f[10] = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  f[11] = [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0];
  f[12] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  return f;
}
function makeAiHappy() {
  const f = makeAiIdle();
  f[5] = [0,0,1,1,1,3,3,1,1,1,3,3,1,1,0,0];
  f[6] = [0,0,1,1,3,3,1,1,1,3,3,1,1,1,0,0];
  f[8] = [0,0,1,5,5,5,5,5,5,5,5,5,5,1,0,0];
  return f;
}
function makeAiSleep() {
  const f = makeAiIdle();
  f[0] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[1] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[2] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[5] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  f[6] = [0,0,1,1,2,2,2,1,1,2,2,2,1,1,0,0];
  f[8] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  return f;
}

// ── Mobile theme frames (single centre antenna, signal-bar detail) ─────────
function makeMobileIdle() {
  const f = makeTamaIdle();
  f[0] = [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0];
  f[1] = [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0];
  f[2] = [0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0];
  f[5] = [0,0,1,1,3,3,1,1,1,1,3,3,1,1,0,0];
  f[6] = [0,0,1,1,3,5,1,1,1,1,3,5,1,1,0,0];
  f[8] = [0,0,1,1,1,5,5,1,5,5,5,1,1,1,0,0];
  return f;
}
function makeMobileBlink() {
  const f = makeMobileIdle();
  f[5] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  f[6] = [0,0,1,1,2,2,1,1,1,1,2,2,1,1,0,0];
  return f;
}
function makeMobileWave() {
  const f = makeMobileIdle();
  f[5]  = [0,0,1,1,5,5,1,1,1,1,5,5,1,1,0,0];
  f[6]  = [0,0,1,1,5,5,1,1,1,1,5,5,1,1,0,0];
  f[8]  = [0,0,1,5,5,5,5,5,5,5,5,5,1,1,0,0];
  f[10] = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  f[11] = [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0];
  f[12] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  return f;
}
function makeMobileHappy() {
  const f = makeMobileIdle();
  f[5] = [0,0,1,1,1,3,1,1,1,1,1,3,1,1,0,0];
  f[6] = [0,0,1,1,3,1,1,1,1,1,3,1,1,1,0,0];
  f[8] = [0,0,1,5,5,5,5,5,5,5,5,5,5,1,0,0];
  return f;
}
function makeMobileSleep() {
  const f = makeMobileIdle();
  f[0] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[1] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[2] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[5] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  f[6] = [0,0,1,1,2,2,1,1,1,1,2,2,1,1,0,0];
  f[8] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  return f;
}

// ── Specialist theme frames (gear tips, framed eyes) ──────────────────────
function makeSpecialistIdle() {
  const f = makeTamaIdle();
  f[0] = [0,0,0,0,0,5,0,0,0,0,5,0,0,0,0,0];
  f[1] = [0,0,0,0,5,5,0,0,0,5,5,0,0,0,0,0];
  f[2] = [0,0,0,0,0,5,0,0,0,0,5,0,0,0,0,0];
  f[5] = [0,0,1,5,3,3,1,1,1,1,3,3,5,1,0,0];
  f[6] = [0,0,1,5,3,4,1,1,1,1,3,4,5,1,0,0];
  return f;
}
function makeSpecialistBlink() {
  const f = makeSpecialistIdle();
  f[5] = [0,0,1,5,1,1,1,1,1,1,1,1,5,1,0,0];
  f[6] = [0,0,1,5,2,2,1,1,1,1,2,2,5,1,0,0];
  return f;
}
function makeSpecialistWave() {
  const f = makeSpecialistIdle();
  f[5]  = [0,0,1,5,5,5,1,1,1,1,5,5,5,1,0,0];
  f[6]  = [0,0,1,5,5,5,1,1,1,1,5,5,5,1,0,0];
  f[8]  = [0,0,1,5,5,5,5,5,5,5,5,5,1,1,0,0];
  f[10] = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  f[11] = [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0];
  f[12] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  return f;
}
function makeSpecialistHappy() {
  const f = makeSpecialistIdle();
  f[5] = [0,0,1,5,1,3,1,1,1,1,1,3,5,1,0,0];
  f[6] = [0,0,1,5,3,1,1,1,1,1,3,1,5,1,0,0];
  f[8] = [0,0,1,5,5,5,5,5,5,5,5,5,5,1,0,0];
  return f;
}
function makeSpecialistSleep() {
  const f = makeSpecialistIdle();
  f[0] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[1] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[2] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  f[5] = [0,0,1,5,1,1,1,1,1,1,1,1,5,1,0,0];
  f[6] = [0,0,1,5,2,2,1,1,1,1,2,2,5,1,0,0];
  f[8] = [0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0];
  return f;
}

// ── Theme registry ─────────────────────────────────────────────────────────
const TAMA_THEMES = {
  default: {
    colors: ['transparent','#22C55E','#16a34a','#f0f0f0','#111111','#F59E0B'],
    frames: { idle: makeTamaIdle(), blink: makeTamaBlink(), wave: makeTamaWave(), happy: makeTamaHappy(), sleep: makeTamaSleep() },
    messages: ['Hey there! 👾','Kotlin > ☕','100% uptime ✓','Hire my creator?','BLE mesh gang','MVI architect 🏗️','Compose > XML 👀','Ship it! 🚀','Feed me commits','4 countries 🌍','7+ years deep','Clean code only','Available now!'],
    label: '🟢 Default',
  },
  ai: {
    colors: ['transparent','#38BDF8','#0284C7','#E0F2FE','#0f172a','#A78BFA'],
    frames: { idle: makeAiIdle(), blink: makeAiBlink(), wave: makeAiWave(), happy: makeAiHappy(), sleep: makeAiSleep() },
    messages: ['Processing… 🤖','Neural net ready','Inferring… ⚡','AI + Kotlin FTW','On-device ML 🧠','KMP + AI = 🔥','Smart systems','Tensor deployed','LLM-ready arch','Edge AI ✓','AutoML pending…','Available now!'],
    label: '🤖 AI',
  },
  mobile: {
    colors: ['transparent','#3DDC84','#249E5B','#f0f0f0','#1a1a1a','#64B5F6'],
    frames: { idle: makeMobileIdle(), blink: makeMobileBlink(), wave: makeMobileWave(), happy: makeMobileHappy(), sleep: makeMobileSleep() },
    messages: ['📱 Android gang','Compose all day','Material 3 only','KMP everywhere','Jetpack ✓','60fps always','App shipped! 🚀','Clean MVI arch','BLE connected','Kotlin Flows ✓','DI with Hilt ✓','Available now!'],
    label: '📱 Mobile',
  },
  specialist: {
    colors: ['transparent','#F59E0B','#D97706','#FEF3C7','#1a1a1a','#7C3AED'],
    frames: { idle: makeSpecialistIdle(), blink: makeSpecialistBlink(), wave: makeSpecialistWave(), happy: makeSpecialistHappy(), sleep: makeSpecialistSleep() },
    messages: ['Architecture ✓','7+ yrs deep 🔧','Clean code only','IoT + BLE mesh','Security first 🔒','E2E encrypted','Systems thinking','Scale-ready ✓','Tech lead mode','Mentor mode on','Full-stack deep','Available now!'],
    label: '🔧 Specialist',
  },
};

const tamaEl      = document.getElementById('tama');
const tamaCanvas  = document.getElementById('tama-canvas');
const tamaBubble  = document.getElementById('tama-bubble');
const tamaBarFill = document.getElementById('tama-bar-fill');

if (!isMobile() && tamaCanvas) {
  const ctx = tamaCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  let currentThemeKey = 'default';
  let tamaMood        = 100;
  let tamaState       = 'idle';
  let blinkNext       = Date.now() + 3000 + Math.random() * 3000;
  let blinkEnd        = 0;
  let actionEnd       = 0;
  let lastTamaTime    = 0;
  let bubbleHideTimer = 0;
  let msgIdx          = 0;

  // ── Challenge state ──────────────────────────────────────────────────────
  const CHALLENGE_TARGET = 10;
  const CHALLENGE_MS     = 5000;
  let challengeActive    = false;
  let challengeClicks    = 0;
  let challengeEndTimer  = null;

  function getCurrentTheme() { return TAMA_THEMES[currentThemeKey]; }

  function drawTamaFrame(frame) {
    const colors = getCurrentTheme().colors;
    ctx.clearRect(0, 0, 64, 64);
    for (let r = 0; r < 16; r++) {
      for (let c = 0; c < 16; c++) {
        const ci = frame[r][c];
        if (ci === 0) continue;
        ctx.fillStyle = colors[ci];
        ctx.fillRect(c * PIXEL_SIZE, r * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }

  function showTamaBubble(msg, duration) {
    if (!tamaBubble) return;
    tamaBubble.textContent = msg;
    tamaBubble.classList.add('visible');
    clearTimeout(bubbleHideTimer);
    if (duration !== null) {
      bubbleHideTimer = setTimeout(() => tamaBubble.classList.remove('visible'), duration || 2200);
    }
  }

  function updateTamaMoodBar() {
    if (!tamaBarFill) return;
    tamaBarFill.style.width = tamaMood + '%';
    if (tamaMood > 60) {
      tamaBarFill.style.background = 'var(--green)';
    } else if (tamaMood > 30) {
      tamaBarFill.style.background = 'var(--accent)';
    } else {
      tamaBarFill.style.background = '#ef4444';
    }
  }

  function nextTamaMessage() {
    const msgs = getCurrentTheme().messages;
    return msgs[msgIdx++ % msgs.length];
  }

  // ── Theme cycling ────────────────────────────────────────────────────────
  function cycleTheme() {
    const idx = THEME_KEYS.indexOf(currentThemeKey);
    currentThemeKey = THEME_KEYS[(idx + 1) % THEME_KEYS.length];
    if (tamaEl) tamaEl.dataset.theme = currentThemeKey;
    msgIdx = 0;
    tamaMood = Math.min(100, tamaMood + 20);
    tamaState = 'wave';
    actionEnd = Date.now() + 1500;
    showTamaBubble(getCurrentTheme().label + ' mode!', 2200);
  }

  // ── Challenge mini-game ──────────────────────────────────────────────────
  function startChallenge() {
    if (challengeActive || tamaMood <= 0) return;
    challengeActive = true;
    challengeClicks = 0;
    if (tamaEl) tamaEl.classList.add('challenge-active');
    showTamaBubble(`⚡ TAP ${CHALLENGE_TARGET}x! GO!`, null);
    tamaState = 'happy';
    actionEnd = Date.now() + 600;
    clearTimeout(challengeEndTimer);
    challengeEndTimer = setTimeout(failChallenge, CHALLENGE_MS);
  }

  function challengeHandleClick() {
    challengeClicks++;
    const remaining = CHALLENGE_TARGET - challengeClicks;
    if (remaining <= 0) {
      winChallenge();
    } else {
      showTamaBubble(`⚡ ${remaining} more!`, null);
    }
  }

  function winChallenge() {
    clearTimeout(challengeEndTimer);
    challengeActive = false;
    if (tamaEl) tamaEl.classList.remove('challenge-active');
    tamaMood = 100;
    tamaState = 'happy';
    actionEnd = Date.now() + 2500;
    showTamaBubble('WINNER! 🏆 +100', 3000);
  }

  function failChallenge() {
    challengeActive = false;
    if (tamaEl) tamaEl.classList.remove('challenge-active');
    tamaMood = Math.max(0, tamaMood - 20);
    showTamaBubble('Too slow! 😴 -20', 3000);
    tamaState = tamaMood > 0 ? 'idle' : 'sleep';
  }

  // ── Render loop ──────────────────────────────────────────────────────────
  function tamaLoop(timestamp) {
    const dt = lastTamaTime ? Math.min((timestamp - lastTamaTime) / 1000, 0.1) : 0;
    lastTamaTime = timestamp;

    if (!challengeActive) {
      tamaMood = Math.max(0, tamaMood - 0.4 * dt);
    }
    updateTamaMoodBar();

    const now    = Date.now();
    const frames = getCurrentTheme().frames;
    let frame;

    if (tamaMood <= 0) tamaState = 'sleep';

    if (tamaState === 'wave' || tamaState === 'happy') {
      frame = frames[tamaState];
      if (now >= actionEnd) tamaState = 'idle';
    } else if (tamaState === 'sleep') {
      frame = frames.sleep;
    } else if (now < blinkEnd) {
      frame = frames.blink;
    } else {
      frame = frames.idle;
      if (now >= blinkNext) {
        blinkEnd  = now + 180;
        blinkNext = now + 3500 + Math.random() * 4000;
      }
    }

    drawTamaFrame(frame);
    requestAnimationFrame(tamaLoop);
  }

  // ── Event listeners ──────────────────────────────────────────────────────
  if (tamaEl) {
    tamaEl.addEventListener('click', () => {
      if (challengeActive) {
        challengeHandleClick();
        return;
      }
      tamaMood = Math.min(100, tamaMood + 35);
      tamaState = 'wave';
      actionEnd = Date.now() + 1600;
      showTamaBubble(nextTamaMessage(), 2000);
    });

    tamaEl.addEventListener('dblclick', () => {
      if (!challengeActive) cycleTheme();
    });

    tamaEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      startChallenge();
    });

    tamaEl.addEventListener('mouseenter', () => {
      if (!challengeActive && tamaState !== 'sleep' && tamaState !== 'wave') {
        showTamaBubble(nextTamaMessage(), 2000);
      }
    });
  }

  // Greet on load
  setTimeout(() => {
    tamaState = 'wave';
    actionEnd = Date.now() + 2000;
    showTamaBubble('Hey there! 👾', 2500);
  }, 1800);

  // Periodic idle bubble
  setInterval(() => {
    if (challengeActive) return;
    if (tamaState === 'idle' && tamaMood > 0) {
      showTamaBubble(nextTamaMessage(), 2200);
    } else if (tamaMood <= 0) {
      showTamaBubble('zZzZ… 💤', 3000);
    }
  }, 12000);

  requestAnimationFrame(tamaLoop);
}

/* =====================
   QUICK BRIEF WIDGET
   ===================== */

const SERVICE_MAP = {
  'Android Development':    ['android', 'kotlin', 'compose', 'jetpack', 'mobile app', 'play store', 'google play'],
  'Testing & Quality':      ['test', 'quality', 'snapshot', 'regression', 'bug', 'qa', 'accessibility', 'wcag'],
  'Kotlin Multiplatform':   ['kmp', 'multiplatform', 'shared', 'kotlin multiplatform', 'cross-platform', 'ios'],
  'Architecture Consulting':['architecture', 'refactor', 'codebase', 'consult', 'review', 'adr', 'monorepo', 'gradle'],
  'Encrypted Messaging':    ['e2e', 'encrypted', 'encryption', 'messaging', 'grpc', 'protobuf', 'secure', 'privacy'],
  'IoT & BLE SDK':          ['ble', 'bluetooth', 'iot', 'sdk', 'embedded', 'hardware', 'mesh'],
  'FinTech & Real-time':    ['fintech', 'finance', 'trading', 'websocket', 'real-time', 'banking', 'crypto'],
  'Flutter Development':    ['flutter', 'dart'],
  'Hiring / Contract':      ['hire', 'contract', 'freelance', 'job', 'position', 'work with', 'team up', 'offer'],
};

function detectService(text) {
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const [service, keywords] of Object.entries(SERVICE_MAP)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = service;
    }
  }
  return best || 'General Inquiry';
}

const qbTrigger = document.getElementById('qb-trigger');
const qbPanel   = document.getElementById('qb-panel');
const qbClose   = document.getElementById('qb-close');
const qbInput   = document.getElementById('qb-input');
const qbAnalyze = document.getElementById('qb-analyze');
const qbResult  = document.getElementById('qb-result');

let qbOpen = false;

function openQB() {
  if (isMobile() || !qbPanel) return;
  qbOpen = true;
  qbPanel.classList.add('open');
  qbPanel.setAttribute('aria-hidden', 'false');
  if (qbTrigger) qbTrigger.setAttribute('aria-expanded', 'true');
  if (qbInput) qbInput.focus();
}

function closeQB() {
  if (!qbPanel) return;
  qbOpen = false;
  qbPanel.classList.remove('open');
  qbPanel.setAttribute('aria-hidden', 'true');
  if (qbTrigger) qbTrigger.setAttribute('aria-expanded', 'false');
}

if (qbTrigger) {
  qbTrigger.addEventListener('click', () => {
    if (qbOpen) closeQB(); else openQB();
  });
}

if (qbClose) qbClose.addEventListener('click', closeQB);

if (qbAnalyze && qbInput && qbResult) {
  qbAnalyze.addEventListener('click', () => {
    const text = qbInput.value.trim();
    if (!text) {
      qbInput.focus();
      return;
    }

    const service  = detectService(text);
    const subject  = encodeURIComponent('[Quick Brief] ' + service);
    const bodyText = [
      'Service: ' + service,
      '',
      'Brief:',
      text,
      '',
      '---',
      'Sent via Quick Brief on pachulski.dev',
    ].join('\n');
    const mailHref = 'mailto:m.pachulski94@gmail.com?subject=' + subject + '&body=' + encodeURIComponent(bodyText);
    const liHref   = 'https://linkedin.com/in/mateusz-pachulski';

    // Build result using DOM to avoid raw HTML injection
    qbResult.innerHTML = '';

    const line1 = document.createElement('div');
    const label = document.createTextNode('Detected: ');
    const badge = document.createElement('span');
    badge.className = 'qb-detected';
    badge.textContent = service;
    line1.appendChild(label);
    line1.appendChild(badge);

    const line2 = document.createElement('div');
    line2.style.cssText = 'margin-top:0.35rem;font-size:0.63rem;color:var(--muted)';
    line2.textContent = 'Your brief is ready. Choose where to send it:';

    const links = document.createElement('div');
    links.className = 'qb-links';

    const emailLink = document.createElement('a');
    emailLink.className = 'qb-link qb-link-email';
    emailLink.href = mailHref;
    emailLink.textContent = '📧 Email';

    const liLink = document.createElement('a');
    liLink.className = 'qb-link qb-link-linkedin';
    liLink.href = liHref;
    liLink.target = '_blank';
    liLink.rel = 'noopener noreferrer';
    liLink.textContent = '💼 LinkedIn';

    links.appendChild(emailLink);
    links.appendChild(liLink);

    qbResult.appendChild(line1);
    qbResult.appendChild(line2);
    qbResult.appendChild(links);
    qbResult.classList.add('visible');
  });

  qbInput.addEventListener('input', () => {
    qbResult.classList.remove('visible');
    qbResult.innerHTML = '';
  });
}

/* =====================
   CLICK TRACKING LISTENERS
   ===================== */

// CTA buttons
document.querySelectorAll('.hero-cta, #fixed-cta').forEach(el => {
  el.addEventListener('click', () => recordClick('CTA: Book a discovery call'));
});

// Quick Brief trigger
if (qbTrigger) {
  qbTrigger.addEventListener('click', () => recordClick('Quick Brief: Opened'));
}

// Case study stats
document.querySelectorAll('.cs-stat').forEach(el => {
  const csName = el.closest('.case-study')
    ? (el.closest('.case-study').querySelector('.cs-name') || {}).textContent || 'Case Study'
    : 'Case Study';
  el.addEventListener('click', () => recordClick('Stat: ' + csName.trim()));
});

// Contact links
document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
  el.addEventListener('click', () => recordClick('Contact: Email'));
});
document.querySelectorAll('a[href^="tel:"]').forEach(el => {
  el.addEventListener('click', () => recordClick('Contact: Phone'));
});
document.querySelectorAll('a[href*="linkedin"]').forEach(el => {
  el.addEventListener('click', () => recordClick('Contact: LinkedIn'));
});
