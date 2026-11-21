'use strict';

// These functions also supply the code printed in the lessons and offline notes.
function routeRequests(policy, requests) {
  const finishTimes = [[], []];
  return requests.map(([arrival, duration], index) => {
    const busy = finishTimes.map(times => times.filter(t => t > arrival).length);
    let worker = index % 2;
    if (policy === 'fewest outstanding') worker = busy[0] <= busy[1] ? 0 : 1;

    const lastFinish = finishTimes[worker].at(-1) ?? 0;
    const start = Math.max(arrival, lastFinish);
    const finish = start + duration;
    finishTimes[worker].push(finish);
    return { request: index + 1, worker: ['A', 'B'][worker],
      arrival, start, finish, waiting: start - arrival };
  });
}

async function readBurst(share, failWest, clearSettled = true) {
  const pending = new Map();
  const calls = { west: 0, east: 0 };

  async function fetchReading(key) {
    calls[key]++;
    const shouldFail = key === 'west' && failWest;
    await Promise.resolve(); // Let all three callers enter before completion.
    if (shouldFail) throw new Error('temporarily unavailable');
    return key + ' map';
  }

  function read(key) {
    if (!share) return fetchReading(key);
    if (!pending.has(key)) {
      const result = fetchReading(key).finally(() => {
        if (clearSettled) pending.delete(key);
      });
      pending.set(key, result);
    }
    return pending.get(key);
  }

  const results = await Promise.allSettled(['west', 'west', 'east'].map(read));
  const describe = item => item.status === 'fulfilled' ? item.value : 'unavailable';
  const burst = { phase: 'burst', westCalls: calls.west, eastCalls: calls.east,
    replies: results.map(describe).join(', ') };
  failWest = false;
  const [later] = await Promise.allSettled([read('west')]);
  return [burst, { phase: 'later read', westCalls: calls.west,
    eastCalls: calls.east, replies: describe(later) }];
}

function testBreaker(probeReply) {
  let state = 'closed';
  let failures = 0;
  let nextProbe = 0;
  const rows = [];
  function attempt(time, name) {
    if (state === 'open' && time >= nextProbe) state = 'ready';
    const allowed = state === 'closed' || state === 'ready';
    if (state === 'ready') state = 'probing';
    rows.push({ time, event: name, state, decision: allowed ? 'call' : 'refuse' });
    return allowed;
  }
  function complete(time, ok) {
    failures = ok ? 0 : failures + 1;
    if (ok) state = 'closed';
    else if (state === 'probing' || failures >= 2) {
      state = 'open';
      nextProbe = time + 100;
    }
    rows.push({ time, event: 'reply', state, decision: ok ? 'success' : 'failure' });
  }

  if (attempt(0, 'first')) complete(5, false);
  if (attempt(6, 'second')) complete(10, false);
  attempt(50, 'early');
  if (attempt(110, 'probe')) {
    attempt(111, 'during probe');
    if (probeReply !== 'missing') complete(115, probeReply === 'success');
  }
  attempt(116, 'next');
  return rows;
}

async function compareWaiters(split) {
  let releaseStorage, expireCaller;
  let reads = 0;
  const storageReady = new Promise(resolve => { releaseStorage = resolve; });
  const shortDeadline = new Promise(resolve => { expireCaller = resolve; });
  const noDeadlineInThisTrace = new Promise(() => {});

  function makeInstance() {
    const pending = new Map();
    return function read(lot, deadline) {
      if (!pending.has(lot)) {
        reads++;
        const work = storageReady.then(() => '200 ' + lot);
        pending.set(lot, work.finally(() => pending.delete(lot)));
      }
      return Promise.race([pending.get(lot), deadline]);
    };
  }

  const first = makeInstance();
  const second = split ? makeInstance() : first;
  const short = first('west', shortDeadline);
  const long = second('west', noDeadlineInThisTrace);
  expireCaller('504 timeout');
  const shortReply = await short;
  const rows = [{ event: 'deadline', short: shortReply, long: 'waiting', reads }];
  releaseStorage();
  const longReply = await long;
  rows.push({ event: 'storage replies', short: shortReply, long: longReply, reads });
  const later = await second('west', noDeadlineInThisTrace);
  rows.push({ event: 'later lookup: ' + later, short: 'finished', long: 'finished', reads });
  return rows;
}

const traffic = [[0, 100], [0, 10], [10, 10], [20, 10]];
const readPathExamples = {
  routing: { run: routeRequests, focus: ['const busy =', 'if (policy ==='], variants: [
    ['Round robin', ['round robin', traffic]],
    ['Fewest outstanding requests', ['fewest outstanding', traffic]],
    ['Equal jobs, round robin', ['round robin', [[0, 10], [0, 10], [10, 10], [20, 10]]]]
  ] },
  coalescing: { run: readBurst, focus: ['if (!pending.has(key))', 'return pending.get(key);'], variants: [
    ['Independent reads', [false, false]],
    ['Share reads for each lot', [true, false]],
    ['Shared west read fails', [true, true]],
    ['Keep the failed promise', [true, true, false]]
  ] },
  breaker: { run: testBreaker, focus: ["if (state === 'open'", "if (state === 'ready') state"], variants: [
    ['Recovery probe succeeds', ['success']],
    ['Recovery probe fails', ['failure']],
    ['Recovery probe never replies', ['missing']]
  ] },
  waiters: { run: compareWaiters, focus: ['if (!pending.has(lot))', 'return Promise.race'], variants: [
    ['Both callers reach one instance', [false]],
    ['One caller on each instance', [true]]
  ] }
};

if (typeof module !== 'undefined') module.exports = readPathExamples;
