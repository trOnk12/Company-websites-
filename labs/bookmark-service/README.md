# Bookmark service lab

Use Python 3.11+, curl and two terminals. Start in a fresh checkout:

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

Use a separate fresh directory with the local server and its disposable database. In another terminal in that same directory, temporarily rename the table:

```sh
python3 -c "import sqlite3; c=sqlite3.connect('bookmarks.db'); c.execute('ALTER TABLE bookmarks RENAME TO parked'); c.commit()"
curl -i http://127.0.0.1:8080/live
curl -i http://127.0.0.1:8080/ready
python3 -c "import sqlite3; c=sqlite3.connect('bookmarks.db'); c.execute('ALTER TABLE parked RENAME TO bookmarks'); c.commit()"
curl -i http://127.0.0.1:8080/ready
```

Record the first failing signal, one hypothesis, the recovery action and the result of a real write. Turn the build and probe commands into a pipeline in your own portfolio repository. Keep the test log and demonstrate that a deliberately failing test stops the build. For the operations portfolio, include the incident timeline, before/after probes, image versions and proof the row survived rollback.
