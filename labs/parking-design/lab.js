'use strict';
const byId = id => document.getElementById(id);

function openDatabase(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('inventory');
      request.result.createObjectStore('claims');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function finished(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

async function reserve(db, id, abortBeforeCommit = false) {
  const tx = db.transaction(['inventory', 'claims'], 'readwrite');
  const done = finished(tx);
  const claims = tx.objectStore('claims');
  const inventory = tx.objectStore('inventory');
  const existing = claims.get(id);
  let outcome;
  existing.onsuccess = () => {
    if (existing.result) { outcome = 'replayed the existing claim'; return; }
    const free = inventory.get('free');
    free.onsuccess = () => {
      if (free.result === 0) { outcome = 'lot full'; return; }
      claims.put(true, id);
      inventory.put(free.result - 1, 'free');
      outcome = 'confirmed';
      if (abortBeforeCommit) tx.abort();
    };
  };
  try { await done; }
  catch (error) { if (abortBeforeCommit && !tx.error) return 'aborted before commit'; throw error; }
  return outcome;
}

async function runParking(form, output, retry) {
  const config = new FormData(form);
  const name = 'parking-course-' + crypto.randomUUID();
  const connections = [];
  try {
    const first = await openDatabase(name);
    connections.push(first);
    const second = await openDatabase(name);
    connections.push(second);
    const seed = first.transaction('inventory', 'readwrite');
    seed.objectStore('inventory').put(retry ? 2 : Number(config.get('spaces')), 'free');
    await finished(seed);
    let results;
    if (retry) {
      const cut = config.get('cut') === 'before';
      const attempted = await reserve(first, 'Ada-1', cut);
      const replay = await reserve(second, config.get('identity') === 'same' ? 'Ada-1' : 'Ada-2');
      results = ['First call: ' + attempted + ' (phone received no reply)', 'Retry: ' + replay];
    } else {
      const a = config.get('first');
      const b = a === 'Ada' ? 'Ben' : 'Ada';
      const outcomes = await Promise.all([reserve(first, a), reserve(second, b)]);
      results = [a + ': ' + outcomes[0], b + ': ' + outcomes[1]];
    }
    const read = first.transaction(['inventory', 'claims']);
    const free = read.objectStore('inventory').get('free');
    const claims = read.objectStore('claims').getAllKeys();
    await finished(read);
    output.textContent = [...results, 'Committed state: ' + free.result + ' free · Claims: ' + claims.result.join(', ')].join('\n');
  } finally {
    for (const db of connections) db.close();
    indexedDB.deleteDatabase(name);
  }
}

for (const [formId, outputId, retry] of [['parking','race-output',false], ['replay','retry-output',true]]) {
  const form = byId(formId);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('button');
    button.disabled = true;
    try { await runParking(form, byId(outputId), retry); }
    catch (error) { byId(outputId).textContent = 'The browser database could not run: ' + error.message; }
    finally { button.disabled = false; }
  });
}

const rowStart = [
  'Committed: one free space and no claims. Ada and Ben begin separate transactions.',
  'Each inserts a provisional claim. Other connections still see no claims.',
  'Ada changes free from one to zero in her transaction. Ben attempts the same update and waits. The observer still reads one.'
];
const dutyStart = [
  'Ada and Ben are both on duty. The rule requires at least one to stay.',
  'Each reads two attendants in a separate transaction. Each decides it is safe to leave.',
  'Ada updates her own row and commits. The observer now sees only Ben on duty.'
];
const schedules = {
  commit: [...rowStart, 'Ada commits. Ben rechecks free > 0 against zero. His update changes zero rows.', 'Ben rolls back his provisional claim. Committed: zero free, Ada owns the only claim.'],
  rollback: [...rowStart, 'Ada rolls back. The stored count is one. Ben wakes and changes one row.', 'Ben commits. Committed: zero free, Ben owns the only claim.'],
  repeatable: [...dutyStart, 'Ben updates his own row using the earlier count. Both transactions commit.', 'Committed: zero on duty. Each row update succeeded, but the shared rule failed.'],
  serial: [...dutyStart, 'PostgreSQL rejects Ben’s transaction with SQLSTATE 40001. His attempted change does not commit.', 'Ben retries the entire decision, reads one attendant, and stays. Committed: one on duty.']
};
let step = 0;
function showStep() {
  const events = schedules[byId('schedule').value];
  byId('trace').textContent = 'Event ' + (step + 1) + ' of ' + events.length + '\n' + events[step];
  byId('next').disabled = step === events.length - 1;
}
byId('next').onclick = () => { step++; showStep(); };
byId('restart').onclick = byId('schedule').onchange = () => { step = 0; showStep(); };
showStep();

byId('traffic').onsubmit = event => {
  event.preventDefault();
  const fields = new FormData(event.currentTarget);
  const limit = fields.get('limit') === '' ? Infinity : Number(fields.get('limit'));
  let waiting = 0;
  let dropped = 0;
  const results = [];
  for (const phase of ['peak','after']) {
    for (let second = 0; second < 60; second++) {
      waiting = Math.max(0, waiting + Number(fields.get(phase)) - Number(fields.get('capacity')));
      dropped += Math.max(0, waiting - limit);
      waiting = Math.min(waiting, limit);
    }
    results.push((phase === 'peak' ? 'After peak' : 'After recovery') + ': ' + waiting + ' waiting, ' + dropped + ' dropped in total.');
  }
  byId('queue-output').textContent = results.join('\n');
};
