// Music recipes: tick off each setting as you turn it (saved in this browser), and hide the "why" lines
// to turn a recipe into a one-screen cheat card. Nothing is sent anywhere.
(() => {
  const article = document.querySelector('article[data-recipe]');
  if (!article) return;
  const key = `music:${article.dataset.recipe}:ticks`;
  const rows = [...article.querySelectorAll('.setting')];
  const tools = article.querySelector('.tools');
  const counter = article.querySelector('.tick-count');
  const load = () => { try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); } catch { return new Set(); } };
  const save = s => { try { localStorage.setItem(key, JSON.stringify([...s])); } catch {} };
  let ticks = load();
  const show = () => {
    rows.forEach((r, i) => { r.classList.toggle('ticked', ticks.has(i)); r.setAttribute('aria-pressed', String(ticks.has(i))); });
    if (counter) counter.textContent = `${ticks.size} of ${rows.length} set`;
  };
  const toggle = i => { ticks.has(i) ? ticks.delete(i) : ticks.add(i); save(ticks); show(); };
  rows.forEach((r, i) => {
    r.setAttribute('role', 'button');
    r.addEventListener('click', e => { if (!e.target.closest('a')) toggle(i); });
    r.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } });
  });
  if (tools) {
    tools.hidden = false;
    const compact = tools.querySelector('[data-compact]');
    try { if (localStorage.getItem('music:compact') === '1') { article.classList.add('compact'); compact.textContent = 'Show the whys'; } } catch {}
    compact.addEventListener('click', () => {
      const on = article.classList.toggle('compact');
      compact.textContent = on ? 'Show the whys' : 'Hide the whys';
      try { localStorage.setItem('music:compact', on ? '1' : '0'); } catch {}
    });
    tools.querySelector('[data-untick]').addEventListener('click', () => { ticks = new Set(); save(ticks); show(); });
  }
  show();
})();
