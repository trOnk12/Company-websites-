---
title: Who can grant the last space?
short: Who can grant the last space?
summary: Trace a request through two service instances and one store.
takeaway: Every service instance needs the same durable authority for a contested grant.
---

## The problem

A **process** is one running instance of a program with its own memory. The handler is the part of that running program that answers the request. To commit a reservation is to finish saving the decision so another copy can retrieve it. Two copies of the service run behind one address. The phone may reach either. Which component can decide whether the last space still exists?

## See it

```diagram write-boundary
```

## The building block

The phone resolves a service name to an address and sends its request. A load balancer chooses a healthy process. That process validates the request and checks the driver's permission. The two processes have separate memory. If both keep their own authoritative count, each can see one free space.

Start with one deployable program backed by one relational database. All copies send reservations to the same store. That store commits the change before the process sends a success response. If the process stops after commit, a replacement can read the outcome. Map reads and reservations can be separate modules of the same program. Splitting them into services introduces another boundary where a request or reply can be lost.

### Locate the last durable decision

Ada's phone sends one reservation through process A. The database commits, then A stops before sending the reply. Process B takes the next request. B cannot inspect A's memory. It can read the stored grant if the client supplies an identity that points back to it. The next two lessons build the concurrency rule and that identity.

Change the failure point: the database is unreachable before the write. B still has a healthy network connection to the phone. What can B promise? It can report that the service is unavailable. Returning a fabricated confirmation from its own memory would give the driver a reservation no replacement process could retrieve.

## Go deeper: Who may read this reservation?

Ada is signed in but requests Ben’s reservation identity. Authentication establishes who Ada is. Authorization asks whether that person may perform this operation on this record. Query by the requested identity and the owner derived from the authenticated context. Include that owner restriction in cached answers or a shared cache entry could defeat the read check.

- How do you test the claim with a warm cache?::Read Ben’s grant as Ben, then request the same identity as Ada. Ada must receive none of Ben’s data.

## Restart the handler after the commit

Here is a single-file experiment in Python 3. It uses SQLite, a database stored in a file. A connection is a program's open handle to that database. Predict the second handler's result before saving the file as reservation.py and running this command in its directory. On Windows with the Python launcher, use the second command instead.

```sh
python3 reservation.py
```

```sh
py -3 reservation.py
```

```python
import sqlite3
from pathlib import Path
from tempfile import TemporaryDirectory

with TemporaryDirectory() as directory:
    path = Path(directory) / "parking.db"
    first = sqlite3.connect(path)
    first.execute("CREATE TABLE grant_log (id TEXT PRIMARY KEY)")
    first.commit()
    first.execute("INSERT INTO grant_log VALUES (?)", ("ada-17",))
    first.commit()  # Try replacing only this commit with first.rollback().
    first.close()   # The first handler no longer has an open connection.

    second = sqlite3.connect(path)
    row = second.execute(
        "SELECT id FROM grant_log WHERE id = ?", ("ada-17",)
    ).fetchone()
    print(row[0] if row else "missing")
    second.close()
```

You should see ada-17. At the marked line, call rollback on the first connection and run again. Now the lookup prints “missing”. The question mark binds a value to the query. The two handlers share only the database file and the requested ID. Closing the first connection before the reply models one failure boundary. This exercise tests which decision the replacement can read. A machine failure would also test the storage device and its durability settings.

## Try it

Draw both request and reply paths. Break one arrow at a time. Name the last component that knows the outcome and the components that still need to discover it. Now separate email delivery. A driver should be able to reserve while the mail provider is unavailable.

## Check yourself

- What survives a restart of both instances?::*A committed database row||The counter in process A >> Process memory disappears on restart. >> the-building-block::Process memory disappears on restart.
- What must precede a successful grant reply?::Starting the database call >> An unfinished write can still roll back. >> the-building-block||*Committing the grant::An unfinished write can still roll back.
- What does a second process add?::*Another request handler||Another independent last space >> Both handlers must honor the same inventory. >> the-building-block::Both handlers must honor the same inventory.

## Sources

- [AWS · Making retries safe](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
- [Google SRE · Load Balancing in the Datacenter](https://sre.google/sre-book/load-balancing-datacenter/)
