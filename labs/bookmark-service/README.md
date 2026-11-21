# Bookmark service lab

You will need Python 3.11+, Git, curl and a terminal. Basic variables, functions and running a script are enough to start. A terminal is the window where you enter these commands. To download the lab, run:

```sh
git clone --depth 1 https://github.com/trOnk12/Company-websites-.git
cd Company-websites-
```

Start the server in that terminal:

```sh
cd labs/bookmark-service
python3 server.py
```

In terminal two, run the following against your own machine. The bookmark name is its identity. The body is empty.

```sh
curl -i -X PUT http://127.0.0.1:8080/bookmarks/river
curl -i -X PUT http://127.0.0.1:8080/bookmarks/river
curl -i http://127.0.0.1:8080/bookmarks
```

On a new database expect 201, then 200, then a list containing river once. Stop the server with Ctrl+C, restart from the same directory and list again. Try two different names and explain the new count. The lab uses Python's teaching HTTP server and a single local database file. Keep it on your machine.

## Backend assignment

Run `python3 test_service.py` from this directory. The test starts its own processes and temporary database on port 18765. Implement deletion of one bookmark. Decide what a second identical delete returns. Test both calls, a missing name and the state after restart. Submit the code, the request/response contract and a passing test log. Keep the existing concurrent retry test green.

## DevOps assignment

Install Docker Engine or Docker Desktop for this section. From the lab directory:

```sh
docker build -t bookmark-lab:v1 .
docker volume create bookmark-lab-data
docker run -d --name bookmark-v1 --network none -v bookmark-lab-data:/data bookmark-lab:v1
docker exec bookmark-v1 python -c "from urllib.request import Request, urlopen; print(urlopen(Request('http://127.0.0.1:8080/bookmarks/river', method='PUT')).status)"
```

Build a second version after adding a version field to the live response. Gate the build on the service tests. Stop the old container before handing its data volume to the candidate:

```sh
python3 test_service.py && docker build -t bookmark-lab:v2 .
docker stop bookmark-v1
docker run -d --name bookmark-v2 --network none -v bookmark-lab-data:/data bookmark-lab:v2
docker exec bookmark-v2 python -c "from urllib.request import urlopen; print(urlopen('http://127.0.0.1:8080/ready').read())"
docker exec bookmark-v2 python -c "from urllib.request import urlopen; print(urlopen('http://127.0.0.1:8080/bookmarks').read())"
docker logs bookmark-v2
```

If startup takes a moment, retry the probes. Check the version at /live and the saved bookmark. Rehearse rollback with the same volume:

```sh
docker stop bookmark-v2
docker start bookmark-v1
docker exec bookmark-v1 python -c "from urllib.request import urlopen; print(urlopen('http://127.0.0.1:8080/bookmarks').read())"
```

Stop the running lab container when finished. This exercise uses the same database layout for both versions. If a candidate removes a column the previous release needs, switching images alone cannot repair compatibility.

## Incident drill

Use a separate fresh directory with the local server and its disposable database. In another terminal in that same directory, save river, then temporarily rename the table:

```sh
curl -i -X PUT http://127.0.0.1:8080/bookmarks/river
python3 -c "import sqlite3; c=sqlite3.connect('bookmarks.db'); c.execute('ALTER TABLE bookmarks RENAME TO parked'); c.commit()"
curl -i http://127.0.0.1:8080/live
curl -i http://127.0.0.1:8080/ready
python3 -c "import sqlite3; c=sqlite3.connect('bookmarks.db'); c.execute('ALTER TABLE parked RENAME TO bookmarks'); c.commit()"
curl -i http://127.0.0.1:8080/ready
```

After restoring the table, write hill and verify that a list returns both names.

```sh
curl -i -X PUT http://127.0.0.1:8080/bookmarks/hill
curl -i http://127.0.0.1:8080/bookmarks
```

Repeat the drill on a fresh disposable copy and change only the recovery action: restart the process immediately after the rename. Startup creates an empty bookmarks table, so readiness can return 200 while river is still in parked. Inspect both tables and the client-visible list. Use a fresh copy for each variation.

Record the first failing signal, one hypothesis, the recovery action and the result of a real write. Turn the build and probe commands into a pipeline in your own portfolio repository. Keep the test log and demonstrate that a deliberately failing test stops the build. For the operations portfolio, include the incident timeline, before/after probes, image versions and proof the row survived rollback.

## Docker filesystem drill

From this directory build the lab image, then compare identical code with and without writable storage. Use a fresh volume name for the exercise.

```sh
docker build -t bookmark-lab:local .
docker run --rm --network none --read-only bookmark-lab:local
docker volume create bookmark-course-files
docker run -d --name bookmark-course-files-test --network none --read-only -v bookmark-course-files:/data bookmark-lab:local
docker exec bookmark-course-files-test python -c "from urllib.request import Request,urlopen; print(urlopen(Request('http://127.0.0.1:8080/bookmarks/river', method='PUT')).status)"
docker stop bookmark-course-files-test
```

The first run should exit when it tries to create its database. The second should return 201 on a fresh volume. If the second process starts slowly, repeat the write. A later response of 200 means the row already exists. Inspect the Dockerfile to explain how the process user and mount location affect the outcome.

Continue with the [local Kubernetes rollout](k8s/README.md). For the database experiments run `python3 data_drills.py`. The script operates entirely in memory.

## Data drills

Run `python3 data_drills.py`. Compare the effect of a rollback, redelivery, owner-filtered queries and an index. Save the output, your predictions and a counterexample for each design decision.

## Backend portfolio checklist

Use this as a second pass through the same service. Each row asks for a deliverable you can demonstrate in a code review.

| Skill | Assignment | Acceptance check |
|---|---|---|
| API contracts and evolution | Define request validation, status codes, pagination and the error format in an OpenAPI document. Add one optional field. | Run an old client against the changed service. Record an invalid request, an empty result and a successful write. |
| Relational design and migrations | Port the two-owner dataset to local PostgreSQL. Add a foreign key and a composite unique constraint. Introduce a nullable column, backfill it, then require it. | Run the old and new app versions during the compatible stage. Restore a backup into a fresh database and compare row counts and sample values. |
| Concurrency and retries | Reuse the concurrent write test and the pending-event exercise. Retry only transient failures with a bounded budget and backoff. | Simulate a lost response, a duplicate event and permanent invalid input. Count attempts and durable effects separately. |
| Authentication and authorization | Document how a verified session becomes an application principal. Implement owner checks for list, update and delete against synthetic users. | Check unauthenticated, owner and other-user cases for each operation. Use synthetic credentials only. |
| Caching and freshness | Cache a list per owner. Choose an expiry and an invalidation rule. | Change one row and show when a reader sees the change. Prove one owner cannot see another owner’s cached response. |
| Load and observability | Time a fixed local workload. Collect request counts, error counts, latency percentiles and database duration. | Compare identical workloads before and after the index. Identify one bottleneck from evidence and distinguish failures from slow successes. |
| Delivery and operations | Gate the image build on tests. Record image identity, configuration, probe results, rollback steps and recovery time. | Demonstrate a failed test stopping the build and a restored service reading the expected data. |
| System design | Sketch the path from phone to database and worker. Mark ownership of data, timeout boundaries, failure modes and capacity assumptions. | Explain what changes when traffic increases tenfold, a worker redelivers a message or the database becomes unavailable. |

## Core workbench

Run `python3 backend_basics.py`. Use a local copy to change one condition per run. You will parse a request, inspect a join, test a session boundary, expire a cache entry and compare a mean with a percentile. These fixtures isolate individual mechanisms. The graduation project combines them.

## Graduation project

Build an API for two synthetic users from a blank directory. You may consult the worked examples after writing a failing test. Use the language and web framework of your choice. Publish source and synthetic fixtures only if you choose to share your portfolio. Run the service locally.

1. **Build.** Implement create, list and delete. Document validation, response shapes, ordering, duplicate requests and owner checks. Have a second client consume the contract.
2. **Persist.** Supply a relational schema, one backwards-compatible migration, a transaction that records pending work, and a paginated query. Prove correctness under a repeated request and tied timestamps.
3. **Operate.** Package the service in a container. Run tests before building. Capture latency and errors for a repeatable workload. Explain what readiness measures and what an operator should inspect first.
4. **Recover.** Restore data into a fresh database. Rehearse a faulty release, revert to a compatible version and verify a write followed by a read. Submit the timeline and one design change justified by the evidence.

Pass when a reviewer can start the project from a clean checkout, execute the tests, reproduce the failure and follow your recovery instructions. For a backend-focused submission, include the query plan and authorization tests. For an operations-focused submission, include the local Kubernetes rollout and probe evidence.

## PostgreSQL extension

From the lab directory, start a disposable PostgreSQL 17 database. Docker needs internet access to download the image the first time. The running database has no container network and publishes no port. The password is generated inside the container at startup. The following commands connect through its local socket.

```sh
docker run --rm -d --name bookmark-course-pg --network none --tmpfs /var/lib/postgresql/data postgres:17 sh -c 'export POSTGRES_PASSWORD="$(cat /proc/sys/kernel/random/uuid)"; exec docker-entrypoint.sh postgres'
docker exec bookmark-course-pg pg_isready -U postgres
docker exec -i bookmark-course-pg psql -U postgres -v ON_ERROR_STOP=1 < postgres.sql
docker stop bookmark-course-pg
```

Wait until pg_isready reports accepting connections before running the SQL file. Expect Ada with one row and Ben with zero. Read the actual plan for this tiny dataset. Repeat with thousands of rows and a composite index before drawing a performance conclusion. The SQL runs inside a transaction and rolls back at the end.

## Two editors, one bookmark

Run `python3 edit_conflict.py`. It uses the Python standard library, an ephemeral loopback port and a fresh SQLite file. Both clients finish reading before either sends its edit. The fixture accepts the single quoted version returned on its read endpoint. It models one bookmark with one editable text representation.

| Predict before running | Observe |
| --- | --- |
| Both clients read River. Which tag does each keep? | Both receive `"7"`. |
| Ada saves Lake. Ben sends Forest with the original tag. | Ada receives 204. Ben receives 412. |
| Ben reads again. | The body is Lake and the tag is `"8"`. |
| Ben reviews both titles and saves Lake and Forest with the new tag. | A subsequent read returns the chosen title at `"9"`. |

For the graduation project, repeat this exercise with **two independently running service instances sharing the same database**. Route Ada to one instance and Ben to the other. Preserve the responses and final row as evidence. Explain where a version check must run for that evidence to hold, and what would happen if each instance kept a separate in-memory counter.
