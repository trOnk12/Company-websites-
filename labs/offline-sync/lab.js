'use strict';

function openStore(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('records');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Read and update the one fixture record inside the same transaction.
function change(db, edit) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('records', 'readwrite');
    const store = tx.objectStore('records');
    const request = store.get('state');
    let state;
    request.onsuccess = () => {
      state = edit(request.result);
      store.put(state, 'state');
    };
    tx.oncomplete = () => resolve(state);
    tx.onabort = () => reject(tx.error);
  });
}

async function run(data) {
  const prefix = 'course-offline-sync-' + crypto.randomUUID();
  const names = ['A', 'B', 'server'];
  const db = {};
  const lines = [];
  async function connect() {
    for (const name of names) db[name] = await openStore(prefix + name);
  }
  function close() {
    for (const handle of Object.values(db)) handle.close();
  }
  async function sync(phone, dropReply) {
    const local = await change(db[phone], state => state);
    const op = local.pending;
    const server = await change(db.server, state => {
      if (state.receipts[op.id] || state.version !== op.base) return state;
      state.version++;
      state.title = op.title;
      state.receipts[op.id] = state.version;
      return state;
    });
    const accepted = server.receipts[op.id];
    if (dropReply) {
      lines.push(phone + ': reply lost after commit. Pending edit survives.');
      return;
    }
    await change(db[phone], state => {
      if (accepted) return {title: op.title, version: accepted, pending: null};
      state.pending.status = 'conflict';
      return state;
    });
    lines.push(phone + (accepted ? ': acknowledged at v' + accepted : ': base v' + op.base + ' conflicts with server v' + server.version));
  }
  try {
    await connect();
    await change(db.server, () => ({version: 1, title: 'Field notes', receipts: {}}));
    for (const phone of ['A', 'B']) {
      const title = data.get(phone.toLowerCase());
      await change(db[phone], () => ({title, version: 1, pending: {id: phone + '-1', base: 1, title, status: 'queued'}}));
    }
    close();
    await connect();
    lines.push('Both phone databases reopened. A and B each have one queued edit based on v1.');
    const first = data.get('first');
    const lost = data.get('reply') === 'lost';
    await sync(first, lost);
    if (lost) await sync(first, false);
    await sync(first === 'A' ? 'B' : 'A', false);
    for (const phone of ['A', 'B']) {
      const row = await change(db[phone], state => state);
      lines.push(phone + ' local: ' + row.title + ' | local base version ' + row.version + ' | queue: ' + (row.pending ? row.pending.id + ' (' + row.pending.status + ')' : 'empty'));
    }
    const server = await change(db.server, state => state);
    lines.push('Server: ' + server.title + ' | version ' + server.version + ' | receipt: ' + Object.keys(server.receipts).join(', '));
    return lines.join('\n');
  } finally {
    close();
    for (const name of names) indexedDB.deleteDatabase(prefix + name);
  }
}

document.querySelector('#sync').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  const output = document.querySelector('#trace');
  button.disabled = true;
  try {
    output.textContent = await run(new FormData(event.currentTarget));
  } catch (error) {
    output.textContent = 'The experiment could not finish. Check browser storage permissions and retry. ' + error.message;
  } finally {
    button.disabled = false;
  }
});
