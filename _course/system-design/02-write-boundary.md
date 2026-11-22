---
title: Where is Ada’s booking when her reply is lost?
short: Where is Ada’s booking when her reply is lost?
summary: Find Ada’s booking after the program that saved it stops.
takeaway: Process B can recover a booking saved by A when both use the same database and B knows which booking to look for.
---

## The problem

In puzzle 1, we estimated the rush after a concert. Suppose the team starts a second copy of the parking program to help handle the traffic. A **process** is one running copy of that program. Call the two processes A and B. Ada’s phone includes reference 17 in its request. A saves her booking under that reference and stops before replying. Ada’s phone asks process B about 17. Where should B look?

## See it

```diagram write-boundary
```

## The building block

Each process has its own working memory. A can remember the booking while it runs, but B cannot read A’s variables. If both processes keep their own free-space count, each could start at one and believe it had B12 to give away.

Give A and B access to the same database, which stores the records outside either process’s memory. To commit the booking means to finish saving it for other processes to read. The program sends “B12 is yours” only after that save succeeds. Think of two ticket clerks at separate desks. Each can lose their scratch pad. Either can still look up 17 in the shared booking book.

### Follow booking 17

Follow reference 17. A receives the request. The database saves the booking. A stops. B receives a lookup for 17 and reads that row from the database. For this exercise assume the phone already knows reference 17. Puzzle 4 explains where that reference comes from when the phone loses the original reply.

Move the failure earlier. A stops before saving 17. B can still reach the database, but its lookup finds no row. Just getting a reply from B gives Ada no booking. The next puzzle asks what happens when A and B attempt to book the same space while both are running.

## Go deeper: Who may read this reservation?

Ada is signed in but requests Ben’s reservation identity. Authentication establishes who Ada is. Authorization asks whether that person may perform this operation on this record. Query by the requested identity and the owner derived from the authenticated context. Include that owner restriction in cached answers or a shared cache entry could defeat the read check.

- How do you test the claim with a warm cache?::Read Ben’s grant as Ben, then request the same identity as Ada. Ada must receive none of Ben’s data.

## Close one connection and look up the booking

This Python 3 experiment uses SQLite, which stores the practice database in a file. A connection is the open channel a program uses to read and write the database. Read the code in three parts. The setup creates an empty table and saves it. The first connection adds one row and saves it, then closes. The second connection opens the same file and asks for that row. Predict what it prints if the first connection undoes its unfinished change by calling rollback instead of saving it.

Save the code as reservation.py and run this command from the same folder. On Windows with the Python launcher, use the second command.

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

The second connection prints ada-17. The question mark is a placeholder for the value "ada-17" supplied by Python. At the marked line, replace first.commit() with first.rollback() and run again. The lookup now prints “missing.” The script uses two connections in a single Python process. Closing one connection stands in for losing access to A. The exercise checks which data survives that boundary.

## Try it

Use the same sequence with booking 18. The save succeeds and the reply disappears. Decide which of the three places holds the answer at that moment: Ada’s phone, A’s lost working memory or the database. Then ask what B could read if the save had failed.

## Check yourself

- What survives if both running copies stop and the database stays up?::*The booking saved in the database||The variables in process A >> Process memory disappears when A stops. >> the-building-block::Either copy can read the saved booking after restarting.
- A has started writing Ada’s booking. When can it confirm B12?::As soon as it starts the save >> The save can still fail. >> the-building-block||*After the save succeeds::Then B can find the booking if A stops.
- A stops before saving booking 17. B checks the database. What will it find?::*No booking under 17||The completed booking 17 >> A stopped before completing the save. >> the-building-block::B can read only what the database kept.

## Sources

- [AWS · Making retries safe](https://aws.amazon.com/builders-library/making-retries-safe-with-idempotent-APIs/)
- [Google SRE · Load Balancing in the Datacenter](https://sre.google/sre-book/load-balancing-datacenter/)
