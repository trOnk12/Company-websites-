"""Observe a lock queue on a private disposable PostgreSQL cluster."""
import argparse
import secrets
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from psycopg.errors import QueryCanceled

from failover import Server, port
from races import wait_for_block


def observe(server, cancel_migration):
    with (server.connect() as reader, server.connect() as migration,
          server.connect() as request, server.connect() as observer):
        observer.execute("CREATE TABLE receipts (id int PRIMARY KEY)")
        observer.execute("INSERT INTO receipts VALUES (1)")
        for db in (reader, migration, request):
            db.execute("SET statement_timeout = '15s'")

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
                if cancel_migration:
                    canceled = observer.execute("SELECT pg_cancel_backend(%s)", (pids[1],)).fetchone()
                    assert canceled == (True,)
                    try:
                        ddl.result(timeout=16)
                    except QueryCanceled:
                        pass
                    else:
                        raise AssertionError("The migration was not canceled")
                    assert read.result(timeout=16).fetchall() == [(1,)]
                    state = observer.execute("SELECT state FROM pg_stat_activity WHERE pid = %s",
                                             (pids[0],)).fetchone()
                    assert state == ("idle in transaction",)
                    print("Migration canceled; request returned receipt 1 while report remained open")
            finally:
                reader.execute("ROLLBACK")
            if not cancel_migration:
                ddl.result(timeout=16)
                assert read.result(timeout=16).fetchall() == [(1,)]
                print("After ending the report transaction: migration committed; request returned receipt 1")
        expected_columns = 1 if cancel_migration else 2
        assert len(observer.execute("SELECT * FROM receipts").description) == expected_columns


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cancel-migration", action="store_true")
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
            observe(server, args.cancel_migration)
        finally:
            server.stop()


if __name__ == "__main__":
    main()
