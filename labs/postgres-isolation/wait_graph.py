"""Observe a lock queue on a private disposable PostgreSQL cluster."""
import argparse
import secrets
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from psycopg.errors import LockNotAvailable, QueryCanceled

from failover import Server, port
from races import wait_for_block


def observe(server, mode):
    with (server.connect() as reader, server.connect() as migration,
          server.connect() as request, server.connect() as observer):
        observer.execute("CREATE TABLE receipts (id int PRIMARY KEY)")
        observer.execute("INSERT INTO receipts VALUES (1)")
        for db in (reader, migration, request):
            db.execute("SET statement_timeout = '15s'")

        if mode == "lock":
            migration.execute("SET lock_timeout = '3s'")
        elif mode == "statement":
            migration.execute("SET statement_timeout = '3s'")
            migration.execute("SET lock_timeout = '10s'")

        reader.execute("BEGIN")
        reader.execute("SELECT * FROM receipts").fetchall()
        with ThreadPoolExecutor(max_workers=2) as workers:
            try:
                ddl = workers.submit(migration.execute, "ALTER TABLE receipts ADD COLUMN note text")
                wait_for_block(observer, migration, reader)
                read = workers.submit(request.execute, "SELECT id FROM receipts")
                wait_for_block(observer, request, migration)
                pids = [db.info.backend_pid for db in (reader, migration, request)]
                names = dict(zip(pids, ("report", "migration", "request")))
                rows = observer.execute(
                    """SELECT pid, state, wait_event_type, pg_blocking_pids(pid)
                       FROM pg_stat_activity WHERE pid = ANY(%s)""",
                    (pids,),
                ).fetchall()
                edges = {}
                for pid, state, event, blockers in rows:
                    label = names[pid]
                    edges[label] = sorted(names[blocker] for blocker in blockers)
                    print(f"{label}: {state}; wait={event}; blockers={edges[label]}")
                assert edges == {"report": [], "migration": ["report"], "request": ["migration"]}
                if mode == "cancel":
                    canceled = observer.execute("SELECT pg_cancel_backend(%s)", (pids[1],)).fetchone()
                    assert canceled == (True,)
                    try:
                        ddl.result(timeout=16)
                    except QueryCanceled:
                        pass
                    else:
                        raise AssertionError("The migration was not canceled")
                elif mode in ("lock", "statement"):
                    expected = LockNotAvailable if mode == "lock" else QueryCanceled
                    try:
                        ddl.result(timeout=16)
                    except expected as error:
                        print(f"Migration timed out: SQLSTATE {error.sqlstate}")
                    else:
                        raise AssertionError("The migration did not time out")
                if mode != "commit":
                    assert read.result(timeout=16).fetchall() == [(1,)]
                    state = observer.execute("SELECT state FROM pg_stat_activity WHERE pid = %s",
                                             (pids[0],)).fetchone()
                    assert state == ("idle in transaction",)
                    print("Request returned receipt 1 while report remained open")
            finally:
                reader.execute("ROLLBACK")
            if mode == "commit":
                ddl.result(timeout=16)
                assert read.result(timeout=16).fetchall() == [(1,)]
                print("After ending the report transaction: migration committed; request returned receipt 1")
        expected_columns = 2 if mode == "commit" else 1
        assert len(observer.execute("SELECT * FROM receipts").description) == expected_columns


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--cancel-migration", dest="mode", action="store_const", const="cancel")
    modes.add_argument("--timeout", dest="mode", choices=["lock", "statement"])
    parser.set_defaults(mode="commit")
    args = parser.parse_args()
    with tempfile.TemporaryDirectory(prefix="course-lock-queue-") as tmp:
        directory = Path(tmp)
        password = secrets.token_hex(24)
        server = Server(directory / "data", port(), password)
        password_file = directory / "password"
        password_file.touch(mode=0o600)
        password_file.write_text(password)
        subprocess.run(["initdb", "-D", str(server.data), "-U", "lab", "--no-locale",
                        "-E", "UTF8", "-A", "scram-sha-256", "--pwfile", str(password_file)],
                       stdout=subprocess.DEVNULL, check=True)
        password_file.unlink()
        try:
            server.start()
            observe(server, args.mode)
        finally:
            server.stop()


if __name__ == "__main__":
    main()
