'use strict';

/* =====================
   CONSTANTS
   ===================== */
const PORTFOLIO_VERSION = 'v2.0.1';

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
   BOOT SCREEN
   ===================== */
(function initBoot() {
  const screen  = document.getElementById('boot-screen');
  if (!screen) return;

  // Only show once per browser session
  if (sessionStorage.getItem('mptech_booted')) {
    screen.classList.add('hidden');
    return;
  }

  const linesEl = document.getElementById('boot-lines');
  const bar     = document.getElementById('boot-bar');

  const messages = [
    { text: 'mptech://boot ~ bash',              cls: 'accent', delay: 0   },
    { text: '> initializing runtime…',            cls: '',       delay: 220 },
    { text: '> loading  [android-sdk]  ✓',        cls: 'green',  delay: 440 },
    { text: '> loading  [kotlin 2.0]   ✓',        cls: 'green',  delay: 620 },
    { text: '> loading  [jetpack-compose] ✓',     cls: 'green',  delay: 800 },
    { text: '> loading  [e2e-encryption] ✓',      cls: 'green',  delay: 960 },
    { text: '> mounting portfolio assets… done',  cls: '',       delay: 1180},
    { text: '> all systems nominal.',             cls: 'accent', delay: 1420},
    { text: '> 7+ years · 4 countries · available now.', cls: '', delay: 1640},
  ];

  function dismiss() {
    sessionStorage.setItem('mptech_booted', '1');
    screen.classList.add('fade-out');
    setTimeout(() => screen.classList.add('hidden'), 520);
    document.removeEventListener('keydown', dismiss);
    screen.removeEventListener('click', dismiss);
  }

  screen.addEventListener('click', dismiss);
  document.addEventListener('keydown', dismiss);

  (async function runBoot() {
    const totalDuration = 1900;
    const barInterval = setInterval(() => {
      const pct = Math.min(parseFloat(bar.style.width || '0') + 2, 100);
      bar.style.width = pct + '%';
      if (pct >= 100) clearInterval(barInterval);
    }, totalDuration / 50);

    for (let i = 0; i < messages.length; i++) {
      const msg      = messages[i];
      const prevDelay = i > 0 ? messages[i - 1].delay : 0;
      await sleep(msg.delay - prevDelay);
      if (screen.classList.contains('fade-out') || screen.classList.contains('hidden')) return;
      const line = document.createElement('div');
      line.className = 'boot-line' + (msg.cls ? ' ' + msg.cls : '');
      line.textContent = msg.text;
      linesEl.appendChild(line);
    }

    await sleep(700);
    dismiss();
  }());
}());

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
   MATRIX RAIN CANVAS
   ===================== */
(function initMatrix() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;

  const MATRIX_CHARS         = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワン0123456789ABCDEFKLMNPQRSUVXYZ{}[]<>/|\\'.split('');
  const MATRIX_FRAME_INTERVAL = 48; // ~20 FPS
  const ctx                   = canvas.getContext('2d');
  const fontSize              = 13;
  let cols, drops;

  function resize() {
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    cols  = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: cols }, () => Math.random() * -50);
  }

  resize();
  window.addEventListener('resize', resize);

  function draw() {
    ctx.fillStyle = 'rgba(13, 13, 13, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#F59E0B';
    ctx.font      = fontSize + 'px "Space Mono", monospace';

    for (let i = 0; i < drops.length; i++) {
      const char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
      ctx.fillText(char, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i] += 0.55;
    }
  }

  setInterval(draw, MATRIX_FRAME_INTERVAL);
}());

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
  'Production-grade Kotlin & Jetpack Compose, on time.'
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
    appendTermLine('Welcome to mptech terminal. Type "help" to start.', 'accent');
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
  promptSpan.textContent = 'visitor@mptech:~$';
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
    await typeTermLine('Snapshot Testing · WCAG · CI/CD');

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

  } else if (c === 'neofetch') {
    appendTermLine('');
    appendTermLine('  ███╗   ███╗██████╗ ', 'accent');
    appendTermLine('  ████╗ ████║██╔══██╗', 'accent');
    appendTermLine('  ██╔████╔██║██████╔╝', 'accent');
    appendTermLine('  ██║╚██╔╝██║██╔═══╝ ', 'accent');
    appendTermLine('  ██║ ╚═╝ ██║██║     ', 'accent');
    appendTermLine('  ╚═╝     ╚═╝╚═╝     ', 'accent');
    appendTermLine('');
    await typeTermLine('  OS:       Portfolio ' + PORTFOLIO_VERSION);
    await typeTermLine('  Host:     Mateusz Pachulski');
    await typeTermLine('  Shell:    Kotlin 2.0 / Bash');
    await typeTermLine('  CPU:      Senior Android Engineer');
    await typeTermLine('  Memory:   6+ production apps shipped');
    await typeTermLine('  Network:  4 countries · remote worldwide');
    await typeTermLine('  Uptime:   since 2017 — no downtime');
    appendTermLine('');

  } else if (c === 'uptime') {
    const start     = new Date(2017, 0, 1);
    const now       = new Date();
    const diffMs    = now - start;
    const days      = Math.floor(diffMs / 86400000);
    const hours     = Math.floor((diffMs % 86400000) / 3600000);
    await typeTermLine('mptech up ' + days + ' days, ' + hours + ' hours');
    await typeTermLine('load average: 0.82, 0.91, 0.88');
    await typeTermLine('users: 1  processes: 47 running');

  } else if (c.startsWith('ping')) {
    const host = cmd.split(' ')[1] || 'mptech.dev';
    await typeTermLine('PING ' + host + ' (127.0.0.1): 56 bytes');
    for (let i = 1; i <= 4; i++) {
      const ms = (Math.random() * 4 + 1).toFixed(3);
      await typeTermLine('64 bytes from ' + host + ': icmp_seq=' + i + ' ttl=64 time=' + ms + ' ms');
      await sleep(200);
    }
    await typeTermLine('--- ' + host + ' ping statistics ---', 'muted');
    await typeTermLine('4 packets transmitted, 4 received, 0% packet loss', 'green');

  } else if (c === 'sudo hire mateusz') {
    await typeTermLine('[sudo] password for visitor:', 'muted');
    await sleep(600);
    await typeTermLine('✓ Access granted. Redirecting to contact...', 'green');
    setTimeout(() => {
      const contactSection = document.getElementById('contact');
      if (contactSection) contactSection.scrollIntoView({ behavior: 'smooth' });
    }, 900);

  } else if (c.startsWith('sudo')) {
    await typeTermLine('sudo: permission denied — try: sudo hire mateusz', 'muted');

  } else if (c === 'git log') {
    await typeTermLine('* a1b2c3d (HEAD → main) Senior Android Dev @ Santander', 'accent');
    await typeTermLine('* d4e5f6b (origin/wire) Senior Android Dev @ Wire', 'accent');
    await typeTermLine('* g7h8i9c (origin/appunite) Android Dev @ AppUnite', 'accent');
    await typeTermLine('* j0k1l2d (origin/bright) SDK Engineer @ Bright Inventions', 'accent');
    await typeTermLine('* n3o4p5e (origin/edu) B.Eng Electrical @ Hanze, Groningen', 'accent');

  } else if (c === 'cat readme.md') {
    await typeTermLine('# Mateusz Pachulski — Senior Android Engineer');
    await typeTermLine('');
    await typeTermLine('Available for new projects. Specialising in:');
    await typeTermLine('- Production Kotlin & Jetpack Compose apps');
    await typeTermLine('- Kotlin Multiplatform (KMP)');
    await typeTermLine('- Architecture consulting & ADRs');
    await typeTermLine('- E2E encrypted messaging (gRPC / Protobuf)');
    await typeTermLine('- BLE / IoT SDK development');

  } else if (c === 'man mptech') {
    await typeTermLine('MPTECH(1)              User Commands             MPTECH(1)', 'muted');
    await typeTermLine('');
    await typeTermLine('NAME');
    await typeTermLine('       mptech — Senior Android Engineer for hire');
    await typeTermLine('');
    await typeTermLine('SYNOPSIS');
    await typeTermLine('       mptech [--kotlin] [--compose] [--kmp] [project]');
    await typeTermLine('');
    await typeTermLine('DESCRIPTION');
    await typeTermLine('       7+ years delivering production-grade Android apps.');
    await typeTermLine('       Run: sudo hire mateusz  to begin collaboration.');

  } else if (c === 'help') {
    await typeTermLine('Available commands:');
    await typeTermLine('  whoami            — About me');
    await typeTermLine('  ls projects       — List projects');
    await typeTermLine('  stack             — Technology stack');
    await typeTermLine('  neofetch          — System info');
    await typeTermLine('  uptime            — Time since first commit');
    await typeTermLine('  git log           — Work history');
    await typeTermLine('  cat readme.md     — Project overview');
    await typeTermLine('  ping <host>       — Connectivity check');
    await typeTermLine('  sudo hire mateusz — ⚡ Hire me');
    await typeTermLine('  man mptech        — Manual page');
    await typeTermLine('  contact           — Scroll to contact');
    await typeTermLine('  clear             — Clear terminal');
    await typeTermLine('  exit              — Close terminal');

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
const navSections = ['hero', 'case-studies', 'services', 'stack', 'timeline'];

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

  // Always handle Escape (close terminal)
  if (e.key === 'Escape') {
    if (termOpen) {
      e.preventDefault();
      closeTerminal();
    }
    return;
  }

  // Disable other shortcuts when focused in a form field (but not terminal input)
  const inFormField = (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') && !isTermInput;
  if (inFormField) return;

  // 1–5: navigate to sections
  if (e.key >= '1' && e.key <= '5') {
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
