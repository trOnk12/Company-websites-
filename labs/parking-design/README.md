# Build and test a reservation service on the JVM

Start with the [system design course](https://pachulski.dev/course/system-design/). Lessons 0–2 work on paper or a phone. For the transaction lesson, use this lab to turn the last-space promise into an executable test.

## Run the first service

From this directory, use JDK 21, Python 3 and the H2 2.3.232 database driver. The first command downloads the driver from Maven Central. The test then runs locally. It creates a temporary file-backed database, starts a Java process on an ephemeral IPv4 loopback port and deletes the fixture on completion.

```sh
curl -fL -o h2.jar https://repo.maven.apache.org/maven2/com/h2database/h2/2.3.232/h2-2.3.232.jar
python3 verify.py h2.jar
```

The driver's SHA-256 digest is `8dae62d22db8982c3dcb3826edb9c727c5d302063a67eef7d63d82de401f07d3`. Expected output:

```text
Two contenders: one confirmed, one full. Replay preserved the original session.
After restart: west still full; the rejected client can reserve east.
```

1. **Predict the race.** Two clients with different identities request the last space in the west lot. Either one may win. Predict the pair of replies and the results of reading each identity afterwards.
2. **Trace the decision.** In [Parking.java](Parking.java), follow `handle`, `reserve` and `lookup`. The identity insert and the conditional inventory update share one transaction. When the update changes zero rows, rollback also removes the pending grant.
3. **Distinguish three outcomes.** A successful replay returns 200 and the original lot. Reusing the same identity for a different lot returns 409. A new client requesting a full lot also receives 409, with body `full`. What should the phone do in each case?
4. **Restart the process.** [verify.py](verify.py) stops Java, starts a fresh process on the same database file and checks both the winner and the remaining inventory. The rejected identity can still reserve at the east lot. Restoring a backup is a separate exercise in lesson 13.
5. **Break one condition.** In a copy, replace `free > 0` with `free >= 0`. Predict which database constraint will reject a negative count and which response the client will receive. Run the test. Does keeping the count nonnegative satisfy the whole response contract?

For manual calls, run `java -cp h2.jar Parking.java ./parking-demo`. In another terminal replace PORT with the printed number:

```sh
curl -i -X PUT --data-binary west http://127.0.0.1:PORT/sessions/ada-17
curl -i http://127.0.0.1:PORT/sessions/ada-17
```

The manual run retains its local database file when stopped. The fixture models synthetic sessions in one process without sign-in. A multiuser implementation must derive the owner from an authenticated identity and enforce authorization on each read and write. Extend the experiment to two instances and PostgreSQL in the [JVM graduation project](../jvm/README.md#jvm-backend-graduation-project).

## Model overload

```sh
python3 queue_model.py
python3 queue_model.py --after 100
python3 queue_model.py --limit 300
```

| Run | After the peak minute | After the recovery minute |
| --- | --- | --- |
| Defaults | 1,200 waiting | Zero waiting |
| Arrivals after peak at 100/s | 1,200 waiting | 1,200 waiting |
| Waiting limit of 300 | 300 waiting, 900 dropped | Zero waiting, 900 dropped in total |

Each simulated second adds arrivals, completes available work and bounds the remaining queue. Requests have equal cost and capacity is fixed. In a real load test, also measure latency distribution, errors and resource hold time. Predict the result for `--peak 160 --after 70 --capacity 120 --limit 500` before running it.

## Defend the design

Complete the [three case studies and review rubric](cases.md), then the [JVM graduation project](../jvm/README.md#jvm-backend-graduation-project). Retain your first sketch, the observed result and your revised decision so a reviewer can see which evidence changed your mind.
