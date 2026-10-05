'use strict';

/* =====================
   UTILITIES
   ===================== */
function isMobile() {
  return window.innerWidth <= 768;
}

/* =====================
   FOOTER YEAR
   ===================== */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

/* =====================
   SMOOTH SCROLL
   ===================== */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const href = link.getAttribute('href');
    if (!href || href === '#') return;
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

/* =====================
   SCROLL REVEAL
   ===================== */
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

/* =====================
   SIGNAL — curated reading list
   ===================== */
function hostFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch (_) {
    return '';
  }
}

async function loadSignal() {
  const list = document.getElementById('signal-list');
  if (!list) return;

  try {
    const res = await fetch('signal.json', { credentials: 'same-origin' });
    if (!res.ok) throw new Error('signal.json ' + res.status);
    const items = await res.json();
    if (!Array.isArray(items) || !items.length) throw new Error('empty signal');

    const frag = document.createDocumentFragment();
    items.forEach(item => {
      const li = document.createElement('li');
      li.className = 'signal-item fade-up';

      const host = document.createElement('span');
      host.className = 'signal-host';
      host.textContent = hostFromUrl(item.url);

      const a = document.createElement('a');
      a.className = 'signal-link';
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = item.title;

      const take = document.createElement('p');
      take.className = 'signal-take';
      take.textContent = item.take;

      li.append(host, a, take);
      frag.appendChild(li);
    });
    list.appendChild(frag);
    list.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));
  } catch (err) {
    list.innerHTML = '<li class="signal-item"><p class="signal-take">Signal list unavailable — try refreshing.</p></li>';
    console.warn('Failed to load signal.json', err);
  }
}

loadSignal();

/* =====================
   TERMINAL EASTER EGG
   ===================== */
const terminal = document.getElementById('terminal');
const termOutput = document.getElementById('term-output');
const termInput = document.getElementById('term-input');
const termClose = document.getElementById('term-close');
const termTrigger = document.getElementById('term-trigger');

let termOpen = false;

function appendTermLine(text, cls) {
  if (!termOutput) return;
  const line = document.createElement('div');
  line.className = 'term-line' + (cls ? ' ' + cls : '');
  line.textContent = text;
  termOutput.appendChild(line);
  termOutput.scrollTop = termOutput.scrollHeight;
}

function openTerminal() {
  if (isMobile() || !terminal) return;
  termOpen = true;
  terminal.classList.add('open');
  terminal.setAttribute('aria-hidden', 'false');
  if (termTrigger) {
    termTrigger.classList.add('hidden');
    termTrigger.setAttribute('aria-expanded', 'true');
  }
  if (termOutput && termOutput.childElementCount === 0) {
    appendTermLine('pachulski.dev — type help', 'accent');
  }
  if (termInput) termInput.focus();
}

function closeTerminal() {
  termOpen = false;
  if (terminal) {
    terminal.classList.remove('open');
    terminal.setAttribute('aria-hidden', 'true');
  }
  if (termTrigger) {
    termTrigger.classList.remove('hidden');
    termTrigger.setAttribute('aria-expanded', 'false');
  }
}

const TERM_COMMANDS = {
  help: () => {
    appendTermLine('commands: help · whoami · stack · contact · clear · exit');
  },
  whoami: () => {
    appendTermLine('Mateusz Pachulski — Senior Android & KMP engineer');
    appendTermLine('Open to remote EU · permanent or B2B · EN/PL/NL');
  },
  stack: () => {
    appendTermLine('Kotlin · Compose · KMP · Swift · Node · WCAG');
  },
  contact: () => {
    appendTermLine('mateusz@pachulski.dev');
    appendTermLine('+47 789 174 023');
    appendTermLine('linkedin.com/in/mateusz-pachulski');
  },
  clear: () => {
    if (termOutput) termOutput.innerHTML = '';
  },
  exit: () => closeTerminal(),
};

function runTermCommand(raw) {
  const cmd = raw.trim().toLowerCase();
  if (!cmd) return;
  appendTermLine('visitor@pachulski.dev:~$ ' + raw);
  const handler = TERM_COMMANDS[cmd];
  if (handler) handler();
  else appendTermLine('command not found: ' + cmd + ' — try help', 'error');
}

if (termTrigger) termTrigger.addEventListener('click', openTerminal);
if (termClose) termClose.addEventListener('click', closeTerminal);

if (termInput) {
  termInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      runTermCommand(termInput.value);
      termInput.value = '';
    } else if (e.key === 'Escape') {
      closeTerminal();
    }
  });
}

document.addEventListener('keydown', e => {
  if (e.key === '`' && !termOpen && !isMobile() && document.activeElement?.tagName !== 'INPUT') {
    e.preventDefault();
    openTerminal();
  } else if (e.key === 'Escape' && termOpen) {
    closeTerminal();
  }
});

document.addEventListener('keydown', e => {
  if (termOpen) return;
  if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
  const map = {
    '1': '#hero',
    '2': '#work',
    '3': '#bar',
    '4': '#stack',
    '5': '#timeline',
    '6': '#signal',
    '7': '#lab',
    '8': '#contact',
  };
  const sel = map[e.key];
  if (sel) {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
});
