---
title: If one driver gives up, whose read should stop?
short: Let one caller leave a shared read
summary: Give two callers different deadlines and trace what survives the first timeout.
takeaway: One caller can stop waiting while a shared operation still serves another caller.
---

## The problem

The circuit breaker currently allows calls. Ada and Ben ask the same worker for the west map. Request coalescing gives them one pending storage read. Ada can wait 400 milliseconds. Ben can wait six seconds. Storage has not replied when Ada's time runs out. When Ada gets a timeout, is Ben still waiting? What must happen before his six-second deadline for him to receive the map?

## See it

```diagram waiter-deadline
```

## The building block

Separate three lifetimes: Ada's wait, Ben's wait and the storage operation. A single storage read can supply both callers. Each caller waits for whichever happens first: its own deadline or the shared result. When Ada's deadline wins, the service can send her a timeout. Ben still holds a reference to the shared work.

Think of two people waiting for the same printed train timetable. Ada leaves to catch a bus. Ben is still at the counter, so the clerk keeps printing. If expensive work should stop when everyone leaves, the clerk needs to know how many people remain. That is a separate policy.

## Run the two callers

The browser starts both waits and releases the deadline and storage result in a controlled order. It models the deadline as an explicit event so the result does not depend on how fast your phone is. Before pressing Run scenario, predict Ben's reply if storage succeeds before his deadline and how many storage reads will have started. Then run both callers on one instance. Then change only the routing so each caller reaches a different instance. Predict which column changes. The reads column is cumulative, including the fresh lookup in the last row.

```read-path waiters
```

The code first looks up the pending work for the lot. The last line creates a separate wait for each caller. Winning that race does not cancel the other promise. Each instance has its own list of pending operations. A later call after cleanup starts a new read because this fixture has no completed-answer cache.

## Try it

Does this outcome also occur across real HTTP connections? Save [the local experiment](https://pachulski.dev/labs/read-path/waiters.py) as waiters.py and run the command below with Python 3. The script starts temporary HTTP servers on your own computer. Each service instance has its own pending table. They run in the same Python process and share an executor for the storage calls.

```sh
python3 waiters.py
```

The script holds the storage response until both driver requests have entered their handlers and the short wait has ended. The following lines are the decision in the handler. The timeout belongs to the caller waiting on the future, the object holding the eventual answer. The storage worker continues running.

```python
try:
    return result.result(timeout=0.4 if budget == "short" else 6)
except TimeoutError:
    return 504, "caller deadline"
```

## Compare your result

On one instance, the server returns 504 to Ada and 200 to Ben after one overlapping storage read. Across two instances the driver replies stay the same, but storage receives two reads. Both runs also verify a successful fresh lookup after cleanup. The difference comes from the location of the pending table.

What if both drivers leave? This implementation still lets an already-started storage read finish. To justify canceling it, count remaining waiters under the same ownership rule as registration and check that storage actually stopped the work. A client timeout alone cannot establish that the underlying work stopped.

## Check yourself

- What expires when Ada's time runs out?::*Ada's wait for this result||The lifetime of Ben's lookup >> Ben has his own deadline and still needs the read. >> s2::A caller can stop waiting while shared work is pending.
- What changes after routing the callers to separate instances?::Ben must also time out >> The second instance can still return the released storage result. >> run-the-two-callers||*The storage read count::Each instance has an independent pending table.
- Why does the later lookup start fresh work?::*The pending entry was removed||A 200 response invalidates all map data >> This experiment keeps only unfinished reads. >> the-building-block::It deliberately has no completed-answer cache.

## Sources

- [Python · Future.result](https://docs.python.org/3/library/concurrent.futures.html#concurrent.futures.Future.result) — “this method will wait up to timeout seconds”
- [MDN · Promise.race](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)
