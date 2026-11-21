'use strict';

function makeExperiment(slug, title, fixture, question, options, run) {
  return {slug, title, fixture, question, options, run};
}

const experiments = [
  makeExperiment('00-request', 'Trace a request',
    'A client sends GET /bookmarks. The service has one matching route and one stored row named river.',
    'Change the request or the process.', ['Use the matching route', 'Use an unknown route', 'Stop the process first'], choice => {
      const running = choice !== 2;
      const path = choice === 1 ? '/missing' : '/bookmarks';
      const routes = {'/bookmarks': '200 · ["river"]'};
      return [`GET ${path}\n${running ? routes[path] || '404 · route missing' : 'Connection refused · no HTTP response'}`,
        'The server can return an HTTP status only after the client reaches it. Check the connection before interpreting a status code.'];
    }),
  makeExperiment('01-retry', 'Replay a write',
    'Start with an empty set. PUT uses the bookmark name as its identity. The third request follows two writes of river.',
    'Which name does the third request use?', ['river again', 'hill'], choice => {
      const names = new Set();
      const log = ['river', 'river', choice ? 'hill' : 'river'].map(name => {
        const status = names.has(name) ? 200 : 201;
        names.add(name);
        return `PUT ${name} → ${status}`;
      });
      return [[...log, 'Stored: ' + [...names].join(', ')].join('\n'), 'A stable identity maps repeated writes onto one row. A different name addresses a different resource.'];
    }),
  makeExperiment('02-test', 'Test deletion after restart',
    'The durable store contains river. DELETE returns 204 on success and 404 for an absent row in this fixture.',
    'Where does the implementation remove the row?', ['Durable store and working copy', 'Working copy only'], choice => {
      const stored = new Set(['river']);
      let working = new Set(stored);
      working.delete('river');
      if (!choice) stored.delete('river');
      working = new Set(stored);
      const afterRestart = [...working];
      return [`First DELETE: 204\nAfter restart: [${afterRestart}]\nSecond DELETE: ${working.delete('river') ? 204 : 404}`,
        'A fresh process reconstructs its state from storage. Testing through restart catches a deletion that looked successful in memory.'];
    }),
  makeExperiment('03-release', 'Replace a release',
    'Version 1 stored river in volume A. Version 2 passes its test suite and replaces version 1.',
    'What does the new release mount?', ['Volume A', 'A fresh volume B'], choice => {
      const volumes = {A: ['river'], B: []};
      const selected = choice ? 'B' : 'A';
      return [`Version: v2\nMounted: ${selected}\nGET /bookmarks → [${volumes[selected]}]`, 'A healthy new process can serve the wrong dataset. Verify release identity and a previously committed row after replacement.'];
    }),
  makeExperiment('04-incident', 'Diagnose a readiness failure',
    'An accidental migration renamed the bookmarks table. The process responds, but its database query fails.',
    'Choose a recovery action.', ['Restart the same image', 'Roll back only the image', 'Restore the expected table name'], choice => {
      const tables = new Set(['parked']);
      if (choice === 2) { tables.delete('parked'); tables.add('bookmarks'); }
      const ready = tables.has('bookmarks');
      return [`GET /live → 200\nGET /ready → ${ready ? 200 : 503}\nPUT river → ${ready ? '201' : 'fails: missing table'}`,
        'The probe depends on the database layout. Replacing a process reuses the same stored schema. Check a real write after recovery.'];
    }),
  makeExperiment('05-contract', 'Validate an API contract',
    'The fixture accepts a JSON object with a nonblank text name of at most 60 characters. It permits unknown fields.',
    'Select a request body.', ['{"name":"river","color":"blue"}', '{"name":" "}', '{"name":["river"]}', '{'], choice => {
      const body = ['{"name":"river","color":"blue"}', '{"name":" "}', '{"name":["river"]}', '{'][choice];
      let outcome;
      try {
        const { name } = JSON.parse(body);
        outcome = typeof name === 'string' && name.trim().length >= 1 && name.trim().length <= 60 ? '200 · ' + name.trim() : '422 · invalid name';
      } catch { outcome = '400 · malformed JSON'; }
      return [`Input: ${body}\nResult: ${outcome}`, 'Parsing checks the encoding. Validation checks the meaning of the parsed fields. An unknown optional field is tolerated under this specific contract.'];
    }),
  makeExperiment('06-model', 'Count bookmarks per account',
    'Ada and Ben are registered. Ada owns river, and Ben has no bookmarks. Count non-null bookmark names for each owner.',
    'Which join supplies the groups?', ['LEFT JOIN from accounts', 'INNER JOIN'], choice => {
      const rows = [{owner: 'Ada', name: 'river'}];
      const groups = ['Ada', 'Ben'].map(owner => [owner, rows.filter(row => row.owner === owner).length]);
      return [groups.filter(([, n]) => !choice || n > 0).map(([owner, n]) => owner + ' → ' + n).join('\n'), 'An outer join keeps the account even when there is no matching bookmark. Count the matched name to produce zero for Ben.'];
    }),
  makeExperiment('07-commit', 'Stop between two writes',
    'Creating river should also record an event for a worker. The process crashes after the bookmark statement and before the event statement.',
    'Choose the transaction boundary.', ['One transaction around both statements', 'Commit each statement separately'], choice => {
      const rows = [];
      const pending = ['river'];
      if (choice) rows.push(...pending);
      pending.length = 0;
      return [`Durable bookmarks: [${rows}]\nDurable events: []\nInvariant: ${rows.length ? 'broken' : 'preserved'}`,
        'Crash recovery discards uncommitted work. If the bookmark already committed, the worker has no event to explain the durable change.'];
    }),
  makeExperiment('08-query', 'Page across a tie',
    'Rows sorted by (time, id) ascending are (10,1), (10,2), (11,3). A page holds one row. Page one returned (10,1).',
    'Which cursor condition starts page two?', ['time > 10', '(time, id) > (10, 1)'], choice => {
      const rows = [[10,1], [10,2], [11,3]];
      const next = rows.find(([time,id]) => time > 10 || (choice === 1 && time === 10 && id > 1));
      return [`Page two: (${next.join(', ')})\nRow 2: ${next[1] === 2 ? 'returned' : 'skipped'}`,
        'The cursor must represent the same ordering as the query. A stable unique tie-breaker separates rows sharing a timestamp.'];
    }),
  makeExperiment('09-owner', 'Delete within an owner boundary',
    'The saved river row belongs to Ada. A verified client asks to delete the row. This fixture returns 403 for a different owner.',
    'Who is signed in?', ['Ben', 'Ada'], choice => {
      const rows = [{owner:'Ada', name:'river'}];
      const owner = choice ? 'Ada' : 'Ben';
      const match = rows.findIndex(row => row.name === 'river' && row.owner === owner);
      if (match >= 0) rows.splice(match, 1);
      return [`DELETE by ${owner} → ${match >= 0 ? 204 : 403}\nRemaining: [${rows.map(row => row.name)}]`, 'Resource identity alone grants no access. Derive the owner from the authenticated session and scope the operation to that owner.'];
    }),
  makeExperiment('10-session', 'Check an expiring session',
    'Ada has one session expiring at tick 100. She wants to read her own bookmark.',
    'When does the request reach the service?', ['Tick 99', 'Tick 100', 'Tick 99, after revocation'], choice => {
      const sessions = new Map([['Ada', 100]]);
      if (choice === 2) sessions.delete('Ada');
      const now = choice === 1 ? 100 : 99;
      const accepted = sessions.has('Ada') && now < sessions.get('Ada');
      return [`Now: ${now}\nSession record: ${sessions.has('Ada') ? 'present' : 'absent'}\nRead → ${accepted ? 200 : 401}`, 'Expiry is exclusive in this contract. A revoked record fails even before its original expiration time.'];
    }),
  makeExperiment('11-cache', 'Read after a cached write',
    'At tick 0 Ada caches [river] until tick 10. At tick 1 she adds hill to storage. Ben has a separate cache key.',
    'Choose the next read.', ['Ada at 9', 'Ada at 10', 'Invalidate Ada on write; read at 9', 'Ben at 9'], choice => {
      const entries = new Map([['Ada', {until:10, names:['river']}]]);
      const database = {Ada:['hill','river'],Ben:[]};
      if (choice === 2) entries.delete('Ada');
      const owner = choice === 3 ? 'Ben' : 'Ada';
      const now = choice === 1 ? 10 : 9;
      const entry = entries.get(owner);
      const hit = entry && now < entry.until;
      return [`Read from: ${hit ? 'cache' : 'storage'}\n${owner} sees: [${hit ? entry.names : database[owner]}]`,
        'Separate owner keys preserve visibility boundaries. Expiry or explicit invalidation sends this read back to storage.'];
    }),
  makeExperiment('12-migrate', 'Backfill while an old writer lives',
    'A migration adds a nullable label and copies each existing name into it. An old client then inserts hill with only a name.',
    'When do you inspect labels?', ['After the initial backfill', 'After the old writer inserts', 'After a catch-up backfill'], choice => {
      const rows = [{name:'river', label:'river'}];
      if (choice >= 1) rows.push({name:'hill',label:null});
      if (choice === 2) rows.forEach(row => { row.label ??= row.name; });
      return [rows.map(row => row.name + ' → ' + (row.label ?? 'NULL')).join('\n'),
        'A backfill covers rows present at its execution. Keep compatible readers and writers until the old write path closes, then verify and enforce the new rule.'];
    }),
  makeExperiment('13-image', 'Start a container with read-only files',
    'The service starts on a read-only root filesystem. It creates a new database at /data/bookmarks.db on first startup.',
    'Choose the mount for /data.', ['No separate mount', 'Read-only mount', 'Writable volume with matching permissions'], choice => {
      const writable = choice === 2;
      return [`Open database for creation → ${writable ? 'success' : 'read-only filesystem'}\nStartup → ${writable ? 'ready' : 'failed'}`,
        'A writable mount can provide one explicit persistence boundary while the rest of the image stays read-only.'];
    }),
  makeExperiment('14-pod', 'Replace a pod',
    'Pod A wrote river. A rollout replaces A with pod B. One writer runs at a time in this exercise.',
    'Where is the database kept?', ['Each pod has its own temporary directory', 'Both mount the same persistent volume across replacements'], choice => {
      const oldStore = ['river'];
      const newStore = choice ? oldStore : [];
      return [`Previous pod: A\nCurrent pod: B\nGET /bookmarks → [${newStore}]`, 'A replacement can preserve storage when its mount survives the pod. Pod identity and durable data have different lifetimes.'];
    }),
  makeExperiment('15-signals', 'Calculate the 95th percentile',
    'One hundred requests finish at either 10 ms or 200 ms. Calculate the nearest-rank p95 and the arithmetic mean.',
    'How many requests take 200 ms?', ['Six', 'Five', 'One', 'Twenty'], choice => {
      const slow = [6,5,1,20][choice];
      const sample = [...Array(100-slow).fill(10), ...Array(slow).fill(200)];
      const rank = Math.ceil(.95 * sample.length);
      return [`Slow requests: ${slow}/100\nRank: ${rank}\np95: ${sample[rank-1]} ms\nMean: ${sample.reduce((sum,n) => sum+n,0)/100} ms`,
        'Read the 95th item in sorted order. A small change at the threshold can move p95 abruptly while the mean changes gradually.'];
    }),
  makeExperiment('16-deliver', 'Rehearse a restore',
    'At noon the backup contains river. At 12:05 the service confirms hill. At 12:10 its data disk fails. The independent recovery log, when available, contains the committed hill write.',
    'What can the operator restore?', ['The noon snapshot', 'The snapshot and the recovery log', 'Only the application image'], choice => {
      const names = choice === 2 ? [] : ['river'];
      if (choice === 1) names.push('hill');
      return [`Restored rows: [${names}]\nMissing acknowledged rows: ${2-names.length}`,
        'State an acceptable loss window before choosing a backup design. In a restore rehearsal, verify committed records as well as process startup.'];
    }),
  makeExperiment('17-edit-conflict', 'Race two title edits',
    'Ada and Ben both read River at version 7. Ada proposes Lake and Ben proposes Forest. The server increments the version on each accepted write.',
    'Choose order and condition.', ['Ada first, check versions', 'Ben first, check versions', 'Ada first, ignore versions'], choice => {
      let title = 'River', version = 7;
      const proposals = choice === 1 ? ['Forest','Lake'] : ['Lake','Forest'];
      const trace = proposals.map(name => {
        if (choice !== 2 && version !== 7) return name + ' → 412';
        title = name; version++;
        return name + ' → 204';
      });
      return [[...trace, `Stored: ${title} (v${version})`].join('\n'), 'Place the expected version inside the update condition. A client that loses can fetch the new representation and reconcile the edit.'];
    })
];
