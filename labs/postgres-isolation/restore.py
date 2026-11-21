"""Restore a private PostgreSQL cluster to either side of an accidental deletion."""
import argparse
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


def run(directory, target):
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
            writer.execute("CREATE TABLE receipt(id int PRIMARY KEY)")
            writer.execute("INSERT INTO receipt VALUES (10)")
        primary.stop()
        shutil.copytree(primary.data, base)
        primary.start()
        with primary.connect() as writer:
            writer.execute("INSERT INTO receipt VALUES (20)")
            writer.execute("SELECT pg_create_restore_point('before_delete')")
            writer.execute("DELETE FROM receipt WHERE id=20")
            writer.execute("SELECT pg_create_restore_point('after_delete')")
            writer.execute("INSERT INTO receipt VALUES (30)")
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
            reader.execute("INSERT INTO receipt VALUES (40)")
        with restored.connect() as verifier:
            assert verifier.execute("SELECT id FROM receipt WHERE id=40").fetchone() == (40,)
        expected = [(10,), (20,)] if target == "before_delete" else [(10,)]
        assert rows == expected, (rows, expected)
        print(f"Original: {original}; restored at {target}: {rows}")
        print(f"Base copy to verified new write: {time.monotonic() - started:.2f} s")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("target", choices=["before_delete", "after_delete"])
    with tempfile.TemporaryDirectory(prefix="course-restore-") as directory:
        run(Path(directory), parser.parse_args().target)
