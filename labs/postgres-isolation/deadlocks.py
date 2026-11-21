"""Contrast a one-way lock timeout with a deadlock in a disposable PostgreSQL database."""
import os
from concurrent.futures import ThreadPoolExecutor
from contextlib import ExitStack
from uuid import uuid4

import psycopg
from psycopg import sql
from psycopg.errors import DeadlockDetected, LockNotAvailable

from races import wait_for_block


def increment(db, seat):
    updated = db.execute("UPDATE seats SET edits = edits + 1 WHERE id = %s", (seat,)).rowcount
    assert updated == 1


def second_edit(db, seat):
    try:
        increment(db, seat)
        db.execute("COMMIT")
        return "committed"
    except DeadlockDetected as error:
        db.execute("ROLLBACK")
        return error.sqlstate


def run(observer, ada, ben):
    observer.execute("CREATE TABLE seats(id int PRIMARY KEY, edits int NOT NULL)")
    observer.execute("INSERT INTO seats VALUES (1, 0), (2, 0)")
    ada.execute("BEGIN")
    increment(ada, 1)
    # A one-way wait has no cycle. Keep Ada's transaction open through Ben's deadline.
    ben.execute("SET lock_timeout = '200ms'")
    try:
        increment(ben, 1)
    except LockNotAvailable as error:
        print(f"One direction only: SQLSTATE {error.sqlstate}")
    else:
        raise AssertionError("Expected a lock timeout")
    ada.execute("ROLLBACK")
    ben.execute("SET lock_timeout = 0")

    for worker, first in ((ada, 1), (ben, 2)):
        worker.execute("BEGIN")
        increment(worker, first)
    with ThreadPoolExecutor(max_workers=1) as workers:
        pending = workers.submit(second_edit, ada, 2)
        wait_for_block(observer, ada, ben)
        result = second_edit(ben, 1)
        other = pending.result(timeout=15)
    assert {result, other} == {"40P01", "committed"}, (result, other)
    assert observer.execute("SELECT edits FROM seats ORDER BY id").fetchall() == [(1,), (1,)]
    print(f"Cycle: Ben={result}, Ada={other}; counts after rollback: [1, 1]")

    victim = ben if result == "40P01" else ada
    with victim.transaction():
        for seat in (1, 2):
            increment(victim, seat)
    assert observer.execute("SELECT edits FROM seats ORDER BY id").fetchall() == [(2,), (2,)]
    print("Whole transaction retried in seat-ID order: [2, 2]")


def main():
    schema = sql.Identifier("deadlock_lab_" + uuid4().hex)
    with ExitStack() as stack:
        dsn = os.environ["LAB_DSN"]
        observer = stack.enter_context(psycopg.connect(dsn, autocommit=True))
        observer.execute(sql.SQL("CREATE SCHEMA {}").format(schema))
        stack.callback(observer.execute, sql.SQL("DROP SCHEMA {} CASCADE").format(schema))
        ada, ben = [stack.enter_context(psycopg.connect(dsn, autocommit=True)) for _ in range(2)]
        for db in (observer, ada, ben):
            db.execute(sql.SQL("SET search_path TO {}").format(schema))
            db.execute("SET statement_timeout = '12s'")
        run(observer, ada, ben)


if __name__ == "__main__":
    main()
