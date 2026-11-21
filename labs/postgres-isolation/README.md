# Who gets the last space?

A parking lot has one space. Ada and Ben each send one request. The business promise is precise: at most one committed claim, and the free count must agree with the claims. A second case asks whether the same reasoning works when two people edit different rows.

## Run the four experiments

Use Python 3.9+ and a disposable PostgreSQL 17 database where your account can create a schema. The runner creates a uniquely named schema and removes it on exit. If you have Docker, this starts a local database on port 55432. Run these commands from this directory in a POSIX shell.

```sh
docker run --name isolation-course --rm -d -p 127.0.0.1:55432:5432 \
  -e POSTGRES_PASSWORD=local_lab -e POSTGRES_DB=lab postgres:17
until docker exec isolation-course pg_isready -h 127.0.0.1 -U postgres -d lab; do sleep 1; done
export LAB_DSN='postgresql://postgres:local_lab@127.0.0.1:55432/lab'
python3 -m venv .venv
. .venv/bin/activate
python -m pip install 'psycopg[binary]>=3.2,<4'
python races.py
```

With an existing lab database, set `LAB_DSN` to its connection string and start at the Python commands. After using the Docker example, run `docker stop isolation-course`.

## Experiment 1 · Ada commits

Predict what Ben sees while his update waits. Does the phone receive zero immediately? Can a third connection still read one free space?

| Moment | Ada's connection | Ben's connection | Independent observer |
| --- | --- | --- | --- |
| Both begin | Inserts Ada's claim | Inserts Ben's claim | Neither claim is committed |
| Ada updates | Changes one free space to zero | Tries to update that lot | Can read the committed value of one |
| Ada commits | Claim and counter become visible together | Wakes and checks the updated row | Can now read zero |
| Ben finishes | | Updates zero rows and rolls back his claim | Sees exactly one claim, Ada's |

Both connections run the same statement at Read Committed:

```sql
UPDATE lot SET free = free - 1 WHERE id = 1 AND free > 0;
```

The primary key identifies at most one row. The second predicate decides whether this particular space can still be claimed. Ben's zero is a successful SQL command with an empty set of matching rows. The service interprets that result. In this fixture we know the lot exists. In a general API the same count could also mean an unknown lot ID.

The observer asks PostgreSQL which connection blocks Ben. Only after PostgreSQL names Ada does the runner let her commit. This establishes the order without guessing how long either request takes.

## Experiment 2 · Change one event

Ada rolls back at the same point. Predict the final free count and the name on the claim. Ben was waiting for Ada's transaction to finish. Her rollback discards both changes. His update can now match the available space and his claim commits. **Both experiments end with zero free spaces.** Looking only at the counter cannot tell you who won or even whether you issued two claims. Check both tables.

At the HTTP boundary, a client can time out while the service waits, or lose the response after a successful commit. What can the phone infer about the claim from a timeout alone? Its outcome is unknown. The next course puzzle adds a stable request identity so a retry can recover that outcome.

## Experiment 3 · Both writes succeed and the rule breaks

At least one attendant must stay on call. Ada and Ben each read the count before either changes it. Both see two. Ada takes herself off duty and commits. Ben acts on his earlier count and takes himself off duty. The two updates touch different rows.

At PostgreSQL Repeatable Read each decision used a stable view of the database. Both transactions can commit. The final count is zero. Try placing the two decisions in either possible serial order on paper. The second person would have seen only one attendant and stayed. A result that neither serial order can produce exposes the anomaly called **write skew**.

## Experiment 4 · Retry the decision

Repeat the same schedule at Serializable. PostgreSQL rejects Ben's attempt with SQLSTATE `40001`, a serialization failure. The program handles failure around both the write and the commit. In a fresh transaction Ben counts again, sees one and stays. Repeating only his last update would carry the obsolete decision into a new transaction.

| Evidence from the run | Meaning for the service |
| --- | --- |
| Update returned zero | Apply the domain rule for this request and roll back its provisional claim. |
| SQLSTATE 40001 | Discard this attempt's reads and writes. Retry the whole decision within a bounded retry budget. |
| Response never reached the phone | Recover the outcome using the request identity. A timeout alone gives no verdict. |

## Transfer exercise · Reserve two adjacent seats

A request needs seats 10 and 11 together. Another request wants 11 and 12. Decide what you will count, when you will commit, and how you will detect a partial success.

One design updates the two requested seat rows inside one transaction with a predicate that each seat is free. Require two distinct seat IDs before starting. Commit the reservation only when exactly two rows changed. If one changed, roll back the entire transaction so that the single seat becomes available again. After the race, read all three seats and both reservations. A passing result has one complete pair, one free seat and no partial reservation. If the database aborts an attempt, start its decision again within the service's retry budget.

## Reference

[PostgreSQL 17 transaction isolation, including concurrent updates and serialization failures](https://www.postgresql.org/docs/17/transaction-iso.html)

## Which acknowledged grant survives promotion?

Use PostgreSQL 17 server tools (`initdb`, `postgres` and `pg_ctl` on PATH) and the Python environment above on a Unix-like machine. Run as an ordinary user. This fixture initializes its own two local database directories and discards them on exit. It does not use LAB_DSN or connect to an existing database.

```sh
python failover.py
```

1. Start from an identical, cleanly stopped physical copy. Configure the copy to stream from the primary and wait until the primary reports a synchronous streaming standby.
2. Insert grant 41 with synchronous_commit=remote_apply. The client receives success. A separate connection reads 41 on the standby.
3. Stop the standby. For grant 42, explicitly switch to local commit acknowledgement. The client receives success again. Record the two successful IDs.
4. Stop the primary immediately, keep it stopped and promote the standby. Read the actual IDs from the new writer. Only 41 survives on it. The evidence demonstrates an acknowledged write missing from the promoted history. It does not establish that every copy of 42 was physically destroyed.
5. Explain what the client could have inferred from the two replies alone. For an application promise that a confirmation survives one primary loss, name the required acknowledger, which node may be promoted and how the system behaves when that node is unavailable.

Stopping the old primary fences it in this lab. A real deployment requires a mechanism to prevent an isolated former primary from serving writes. This fixture tests two configured PostgreSQL acknowledgement policies. It does not implement leader election or simulate an entire region outage.

[PostgreSQL 17 · Synchronous replication](https://www.postgresql.org/docs/17/warm-standby.html#SYNCHRONOUS-REPLICATION)

## Restore a receipt deleted by mistake

With the same local binaries and Python environment as the promotion exercise, run `python3 restore.py before_delete` and `python3 restore.py after_delete`. Predict the results in the [recovery lesson](https://pachulski.dev/course/system-design/13-recovery.html#try-it). Each run restores from a stopped database copy into a second directory using archived WAL. The reported interval covers copying the backup through verification of a new committed write. Operator response, production backup transfer, reconciliation and traffic cutover require separate measurements.

### Reconcile a later confirmed sale

Run `python3 restore.py before_delete --reconcile`. The isolated fixture supplies a verified sales record outside the database being rewound. It confirms receipt 30 and its amount. Before running, predict which IDs and amounts will exist after restoring receipt 20 and replaying sale 30. What if the replay is repeated or another sales record claims receipt 10 with an amount of 999?

The importer checks the stable receipt ID and amount in a transaction. A repeat with the same amount changes zero rows. A reused ID with a different amount rejects the entire batch, even when an earlier operation in that batch inserted a new receipt. The fixture proves both outcomes and checks the final rows from a fresh connection. In production, establish which independent system can prove each operation succeeded. Missing or contradictory evidence needs review before opening traffic. The lab measures only the restore and verification of a new write, before reconciliation.

## Deadlock or a one-way wait?

Use the same `LAB_DSN` and Python environment as the four isolation experiments. Run `python3 deadlocks.py`. First predict the wait graph and final counters in the [design drill](https://pachulski.dev/labs/parking-design/cases.html#two-edits-wait-on-each-other). The lab waits for the first dependency using a third connection before creating the second dependency. It reports the actual deadlock victim, checks both seat counters and verifies a full retry. The disposable schema is removed on exit.
