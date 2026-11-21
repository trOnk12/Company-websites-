"""Run in a dedicated PostgreSQL lab database. See README.md."""
import os
import time
from concurrent.futures import ThreadPoolExecutor
from contextlib import ExitStack
from uuid import uuid4

import psycopg
from psycopg import sql
from psycopg.errors import SerializationFailure


def scalar(connection, query, params=()):
    return connection.execute(query, params).fetchone()[0]


def wait_for_block(observer, waiter, holder):
    deadline = time.monotonic() + 8
    while time.monotonic() < deadline:
        if scalar(observer, "SELECT %s = ANY(pg_blocking_pids(%s))",
                  (holder.info.backend_pid, waiter.info.backend_pid)):
            return
        time.sleep(0.02)
    raise RuntimeError("The expected row-lock wait did not occur")


def last_space(observer, ada, ben, pool, commit_first):
    observer.execute("TRUNCATE claim, lot")
    observer.execute("INSERT INTO lot VALUES (1, 1)")
    decrement = "UPDATE lot SET free = free - 1 WHERE id = 1 AND free > 0"
    for connection, name in ((ada, "Ada"), (ben, "Ben")):
        connection.execute("BEGIN ISOLATION LEVEL READ COMMITTED")
        connection.execute("INSERT INTO claim VALUES (%s)", (name,))
    assert ada.execute(decrement).rowcount == 1
    pending = pool.submit(ben.execute, decrement)
    wait_for_block(observer, ben, ada)
    # An ordinary reader can still see the previously committed space.
    assert scalar(observer, "SELECT free FROM lot") == 1
    ada.execute("COMMIT" if commit_first else "ROLLBACK")
    rows = pending.result().rowcount
    assert rows == (0 if commit_first else 1)
    ben.execute("COMMIT" if rows else "ROLLBACK")
    claims = observer.execute("SELECT name FROM claim").fetchall()
    assert claims == [("Ada" if commit_first else "Ben",)]
    assert scalar(observer, "SELECT free FROM lot") == 0
    action = "commits" if commit_first else "rolls back"
    print(f"Ada {action}: Ben waited, updated {rows} row(s); sole claim: {claims[0][0]}")


def duty_count(connection):
    return scalar(connection, "SELECT count(*) FROM duty WHERE on_call")


def leave(connection, name):
    connection.execute("UPDATE duty SET on_call = false WHERE name = %s", (name,))


def shift_change(observer, ada, ben, serializable):
    observer.execute("TRUNCATE duty")
    observer.execute("INSERT INTO duty VALUES ('Ada', true), ('Ben', true)")
    begin = ("BEGIN ISOLATION LEVEL SERIALIZABLE" if serializable
             else "BEGIN ISOLATION LEVEL REPEATABLE READ")
    for connection in (ada, ben):
        connection.execute(begin)
        assert duty_count(connection) == 2
    leave(ada, "Ada")
    ada.execute("COMMIT")
    try:
        leave(ben, "Ben")
        ben.execute("COMMIT")
    except SerializationFailure as error:
        assert serializable and error.sqlstate == "40001"
        ben.execute("ROLLBACK")
        ben.execute(begin)
        remaining = duty_count(ben)
        if remaining > 1:
            leave(ben, "Ben")
        ben.execute("COMMIT")
        assert remaining == 1
        print("SERIALIZABLE: Ben received 40001; fresh decision keeps Ben on call")
    remaining = duty_count(observer)
    assert remaining == (1 if serializable else 0)
    print(f"{'SERIALIZABLE' if serializable else 'REPEATABLE READ'}: {remaining} on call")


def main():
    schema = sql.Identifier("isolation_lab_" + uuid4().hex)
    with ExitStack() as stack:
        def connect():
            return stack.enter_context(psycopg.connect(os.environ["LAB_DSN"], autocommit=True))

        observer = connect()
        observer.execute(sql.SQL("CREATE SCHEMA {}").format(schema))
        stack.callback(observer.execute, sql.SQL("DROP SCHEMA {} CASCADE").format(schema))
        ada, ben = connect(), connect()
        for connection in (observer, ada, ben):
            connection.execute(sql.SQL("SET search_path TO {}").format(schema))
            connection.execute("SET statement_timeout = '12s'")
        observer.execute("CREATE TABLE lot (id integer PRIMARY KEY, free integer NOT NULL CHECK (free >= 0))")
        observer.execute("CREATE TABLE claim (name text PRIMARY KEY)")
        observer.execute("CREATE TABLE duty (name text PRIMARY KEY, on_call boolean NOT NULL)")
        with ThreadPoolExecutor(max_workers=1) as pool:
            for commit_first in (True, False):
                last_space(observer, ada, ben, pool, commit_first)
        for serializable in (False, True):
            shift_change(observer, ada, ben, serializable)


if __name__ == "__main__":
    main()
