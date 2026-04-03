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
}

function closeTerminal() {
  if (!terminal) return;
  termOpen = false;
  terminal.classList.remove('open');
  terminal.setAttribute('aria-hidden', 'true');
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

  } else if (c === 'help') {
    await typeTermLine('Available commands:');
    await typeTermLine('  whoami        — About me');
    await typeTermLine('  ls projects   — List projects');
    await typeTermLine('  stack         — Technology stack');
    await typeTermLine('  contact       — Scroll to contact');
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
