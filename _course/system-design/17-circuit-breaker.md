---
title: When is it worth calling a failing dependency again?
short: Refuse calls and admit one recovery probe
summary: Use failure replies and a quiet interval to control how many calls reach a recovering dependency.
takeaway: A circuit breaker refuses work while open and limits the probes that test recovery.
---

## The problem

Request coalescing let two callers share a result, including a failed result. Now suppose storage keeps failing after that shared read. Each new request can occupy a worker until its own deadline. If callers keep arriving, how can the map service give storage a quiet interval and still discover that it has recovered?

## See it

```diagram breaker
```

## The building block

A **circuit breaker** remembers recent call outcomes. Think of a closed electrical switch allowing current to flow. In the closed state this policy allows calls. Two consecutive qualifying failures open it. While open it refuses new attempts immediately. This policy waits 100 milliseconds after opening before permitting a trial call, known as a probe. During that half-open trial, other requests are refused.

A timeout answers how long one call can wait. A breaker decides whether a new call may start. The probe itself also needs a timeout. A full-lot business refusal can be a healthy response from storage, so define in advance which errors count as dependency failures.

## Try a successful and a failed probe

Each time in the code is milliseconds on one local clock. The fixture delivers failure responses at times 5 and 10, opens the breaker at 10, and sends a request at 50. Predict whether storage receives that request. Then compare the row at 111, when the probe is in flight, with the row at 116, when its response has arrived.

```read-path breaker
```

The caller at 50 is refused locally. The caller at 110 holds the one probe slot. The caller at 111 cannot start a second trial. A successful reply at 115 closes the breaker, allowing the attempt at 116. A failed reply opens it for another 100 milliseconds, until 215. The rows separate attempts from responses so the interval while the probe is unanswered stays visible.

## Go deeper: What does the simple policy leave out?

The fixture orders the first two calls and their replies. In a busy service dozens of older calls might finish after the breaker opens. Associate probes and results with the generation of the breaker state that admitted them. An old success should not close a newer open generation. Each service instance also makes its own decision unless the design explicitly shares state.

- If ten instances each admit one probe, how many probes might the dependency see?::Up to ten in that recovery interval. The one-probe rule in this fixture belongs to one instance.

## Try it

Select the missing-reply scenario. The probe begins at 110 and never reports success or failure. Predict the state at 116 and whether the next call reaches storage.

## Compare your result

The fixture stays in the probing state and refuses the next call. The experiment has no probe timeout. Describe the deadline and cleanup your real client needs before applying the policy.

## Check yourself

- What happens to the request at time 50?::*It gets a local refusal||It joins the storage queue >> An open breaker stops new dependency calls. >> s2::The quiet interval lasts until time 110.
- Why refuse the request at 111?::Its caller has a short deadline >> The fixture limits concurrent trials independently of caller deadlines. >> s3||*Another probe is already running::The half-open policy reserves one trial slot.
- When may new work enter after a successful probe?::*After its success is observed||As soon as its request is sent >> An unanswered probe has not established recovery. >> s4::The reply at 115 changes the state.

## Sources

- [Azure Architecture Center · Circuit Breaker pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker) — “A limited number of requests from the application are allowed to pass through”
