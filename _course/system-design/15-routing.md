---
title: Why does an idle worker watch a request wait?
short: Send the third request to a worker
summary: Route four reads and measure time spent waiting behind earlier work.
takeaway: Evenly distributed request counts can hide an uneven distribution of work.
---

## The problem

The capacity estimate counted requests in flight across the whole service. Now split that work between two workers serving the same map. Each can run one request at a time. The first read takes 100 milliseconds. The next three take 10 each. After ten milliseconds one worker is idle. Why might the next arrival still wait ninety milliseconds?

## See it

```diagram routing
```

## The building block

A load balancer receives requests and picks a healthy worker for each. **Round robin** means taking turns: A, B, A, B. Imagine two supermarket checkouts where one shopper arrives with a full cart. Sending every other shopper to that checkout distributes shoppers evenly, yet someone with one item may wait behind the full cart.

In this experiment the dispatcher knows which requests have finished. A second policy picks the worker with the fewest outstanding requests and breaks ties in favor of A. At time 10, B has just finished its first read. A still has 90 milliseconds of work. The policy can see that difference without knowing how long the new request will take.

## Run both routing policies

Each input pair gives arrival time and service time in milliseconds. A worker starts a request when both the request and the worker are ready. An earlier completion at exactly the arrival time frees that worker before dispatch. Before pressing Run scenario, predict request three's worker, start and finish. Run the scenario and check the third row. Now switch policies and make a second prediction.

```read-path routing
```

With round robin, request three arrives at 10, starts on A at 100 and finishes at 110. With the second policy it starts on B at 10 and finishes at 20. Neither worker became faster. Only the queue in front of that request changed.

## Go deeper: Which count can the balancer see?

A network connection can carry several requests at once. A balancer that counts open connections observes something different from the outstanding request count in this experiment. If A has one connection carrying 100 concurrent reads and B has two carrying one read each, a least-connections policy can choose A. Decide what your actual proxy measures before treating its setting as a solution.

- Which observation would help you check the setting?::Compare per-worker active requests, connection counts and waiting times under the same burst.

## Try it

Select the equal-jobs scenario. Only the first read's duration changes, from 100 to 10 milliseconds. Predict the third request's waiting time under round robin, then run the code.

## Compare your result

Both workers finish at 10. The difference in waiting time disappears. Next ask what happens when every worker waits on the same overloaded database. Routing alone cannot increase that database's capacity.

## Check yourself

- At time 10, where does round robin send request three?::*A, whose first read is running||B, which just became idle >> Taking turns does not look at the queue. >> s3::The first two assignments were A and B.
- What explains a 90-millisecond wait?::The third read needs 90 milliseconds of execution >> Its own service time is ten milliseconds. >> s4||*Earlier work occupies its chosen worker::The request arrived at 10 but A became free at 100.
- What does the second policy need to observe?::*How many assigned requests still await completion||The predicted duration of each arriving read >> The experiment counts unfinished requests at dispatch. >> the-building-block::A completion changes what the next dispatch sees.

## Sources

- [NGINX · Load balancing methods](https://nginx.org/en/docs/http/load_balancing.html) — “least number of active connections”
