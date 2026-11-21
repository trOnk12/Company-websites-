"""Restore a private PostgreSQL cluster and optionally reconcile a confirmed sale."""
import argparse
import json
import secrets
import shutil
import subprocess
import tempfile
import time
from contextlib import ExitStack
from pathlib import Path

from failover import Server, port


def configure(data, settings):
    with (data / "postgresql.auto.conf").open("a") as config:
        config.write("\n" + settings + "\n")


def reconcile(db, journal):
    applied = 0
    with db.transaction():
        for operation in journal:
            row = db.execute(
                "INSERT INTO receipt VALUES (%s, %s) ON CONFLICT (id) DO NOTHING RETURNING id",
                (operation["id"], operation["amount"]),
            ).fetchone()
            if row:
                applied += 1
            else:
                existing = db.execute("SELECT amount FROM receipt WHERE id = %s",
                                      (operation["id"],)).fetchone()
                if existing != (operation["amount"],):
                    raise ValueError("Receipt identity reused with a different amount")
    return applied


def run(directory, target, replay=False):
    (directory / "archive").mkdir()
    base = directory / "base"
    password = secrets.token_hex(24)
    primary = Server(directory / "original", port(), password)
    password_file = directory / "init-password"
    password_file.write_text(password)
    password_file.chmod(0o600)
    subprocess.run(["initdb", "-D", str(primary.data), "-U", "lab", "--no-locale", "-E", "UTF8",
                    "-A", "scram-sha-256", "--pwfile", str(password_file)],
                   stdout=subprocess.DEVNULL, check=True)
    password_file.unlink()
    configure(primary.data, """archive_mode = on
archive_command = 'test ! -f ../archive/%f && cp %p ../archive/%f.tmp && mv ../archive/%f.tmp ../archive/%f'""")
    with ExitStack() as cleanup:
        cleanup.callback(primary.stop)
        primary.start()
        with primary.connect() as writer:
            writer.execute("CREATE TABLE receipt(id int PRIMARY KEY, amount int NOT NULL)")
            writer.execute("INSERT INTO receipt VALUES (10, 100)")
        primary.stop()
        shutil.copytree(primary.data, base)
        primary.start()
        with primary.connect() as writer:
            writer.execute("INSERT INTO receipt VALUES (20, 200)")
            writer.execute("SELECT pg_create_restore_point('before_delete')")
            writer.execute("DELETE FROM receipt WHERE id=20")
            writer.execute("SELECT pg_create_restore_point('after_delete')")
            writer.execute("INSERT INTO receipt VALUES (30, 300)")
            if replay:
                # This fixture supplies a verified independent record of the acknowledged sale.
                (directory / "confirmed-sales.json").write_text('[{"id":30,"amount":300}]')
            original = writer.execute("SELECT id FROM receipt ORDER BY id").fetchall()
            assert original == [(10,), (30,)], original
            writer.execute("SELECT pg_switch_wal()")
        primary.stop()

        started = time.monotonic()
        restored = Server(directory / "restored", port(), password)
        cleanup.callback(restored.stop)
        shutil.copytree(base, restored.data)
        configure(restored.data, f"""archive_mode = off
restore_command = 'cp ../archive/%f %p'
recovery_target_name = '{target}'
recovery_target_action = 'promote'""")
        (restored.data / "recovery.signal").touch()
        restored.start()
        with restored.connect() as reader:
            deadline = time.monotonic() + 30
            while reader.execute("SELECT pg_is_in_recovery()").fetchone()[0]:
                if time.monotonic() >= deadline:
                    raise RuntimeError("Recovery did not reach the named restore point")
                time.sleep(0.1)
            rows = reader.execute("SELECT id FROM receipt ORDER BY id").fetchall()
            reader.execute("INSERT INTO receipt VALUES (40, 400)")
        with restored.connect() as verifier:
            assert verifier.execute("SELECT id FROM receipt WHERE id=40").fetchone() == (40,)
        expected = [(10,), (20,)] if target == "before_delete" else [(10,)]
        assert rows == expected, (rows, expected)
        print(f"Original: {original}; restored at {target}: {rows}")
        print(f"Base copy to verified new write: {time.monotonic() - started:.2f} s")
        if replay:
            journal = json.loads((directory / "confirmed-sales.json").read_text())
            with restored.connect() as db:
                try:
                    reconcile(db, journal + [{"id": 10, "amount": 999}])
                except ValueError:
                    assert db.execute("SELECT id FROM receipt WHERE id=30").fetchone() is None
                else:
                    raise AssertionError("Conflicting evidence was accepted")
                assert reconcile(db, journal) == 1
                assert reconcile(db, journal) == 0
            with restored.connect() as verifier:
                final = verifier.execute("SELECT id, amount FROM receipt ORDER BY id").fetchall()
                assert final == [(10, 100), (20, 200), (30, 300), (40, 400)], final
                print(f"Reconciled: {final}; duplicate added zero rows; mismatched evidence rolled back")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", choices=["before_delete", "after_delete"])
    parser.add_argument("--reconcile", action="store_true",
                        help="recover the deleted receipt and replay one independently confirmed sale")
    args = parser.parse_args()
    if args.reconcile and args.target != "before_delete":
        parser.error("--reconcile requires before_delete")
    with tempfile.TemporaryDirectory(prefix="course-restore-") as directory:
        run(Path(directory), args.target, args.reconcile)
