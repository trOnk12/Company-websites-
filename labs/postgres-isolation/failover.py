"""Compare two acknowledgement policies in private, disposable PostgreSQL clusters."""
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
from contextlib import ExitStack
from pathlib import Path

import psycopg


def port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


class Server:
    def __init__(self, data, number, password):
        self.data = data
        self.port = number
        self.password = password
        self.started = False

    def control(self, *args):
        subprocess.run(["pg_ctl", "-D", str(self.data), "-w", "-t", "30", *args],
                       stdout=subprocess.DEVNULL, check=True)

    def start(self):
        self.control("-l", str(self.data.parent / (self.data.name + ".log")), "-o",
                     f"-h 127.0.0.1 -p {self.port} -k ''", "start")
        self.started = True

    def stop(self, mode="fast"):
        if self.started:
            self.control("-m", mode, "stop")
            self.started = False

    def connect(self):
        return psycopg.connect(host="127.0.0.1", port=self.port, user="lab", dbname="postgres",
                               password=self.password, connect_timeout=3, autocommit=True)


def run(directory):
    password = secrets.token_hex(24)
    primary = Server(directory / "primary", port(), password)
    password_file = directory / "init-password"
    password_file.write_text(password)
    password_file.chmod(0o600)
    subprocess.run(["initdb", "-D", str(primary.data), "-U", "lab", "--no-locale", "-E", "UTF8",
                    "-A", "scram-sha-256", "--pwfile", str(password_file)],
                   stdout=subprocess.DEVNULL, check=True)
    password_file.unlink()
    with ExitStack() as cleanup:
        cleanup.callback(primary.stop)
        primary.start()
        standby = Server(directory / "standby", port(), password)
        cleanup.callback(standby.stop)
        with primary.connect() as writer:
            writer.execute("CREATE TABLE grant_log (id integer PRIMARY KEY)")
        primary.stop()
        # With the writer cleanly stopped, this is a consistent physical starting copy.
        shutil.copytree(primary.data, standby.data)
        (standby.data / "standby.signal").touch()
        with (standby.data / "postgresql.auto.conf").open("a") as config:
            config.write(f"\nprimary_conninfo = 'host=127.0.0.1 port={primary.port} "
                         f"user=lab password={password} application_name=seat_standby'\n")
        with (primary.data / "postgresql.auto.conf").open("a") as config:
            config.write("\nsynchronous_standby_names = 'seat_standby'\n")
        primary.start()
        standby.start()
        with primary.connect() as writer:
            writer.execute("SET statement_timeout = '15s'")
            deadline = time.monotonic() + 15
            while not writer.execute(
                "SELECT EXISTS (SELECT FROM pg_stat_replication "
                "WHERE application_name='seat_standby' AND state='streaming' AND sync_state='sync')"
            ).fetchone()[0]:
                if time.monotonic() >= deadline:
                    raise RuntimeError("Standby did not reach synchronous streaming")
                time.sleep(0.05)
            writer.execute("SET synchronous_commit = 'remote_apply'")
            writer.execute("INSERT INTO grant_log VALUES (41)")
            with standby.connect() as reader:
                assert reader.execute("SELECT id FROM grant_log").fetchall() == [(41,)]
            print("41: primary acknowledged; standby independently read the committed row.")
            standby.stop()
            writer.execute("SET synchronous_commit = 'local'")
            writer.execute("INSERT INTO grant_log VALUES (42)")
            assert writer.execute("SELECT count(*) FROM grant_log").fetchone()[0] == 2
            print("42: primary acknowledged locally while standby was offline.")
        primary.stop("immediate")
        standby.start()
        standby.control("promote")
        with standby.connect() as promoted:
            assert not promoted.execute("SELECT pg_is_in_recovery()").fetchone()[0]
            actual = promoted.execute("SELECT id FROM grant_log ORDER BY id").fetchall()
            assert actual == [(41,)], actual
            print("Promoted standby: surviving IDs = [41]. Old primary remains stopped.")


if __name__ == "__main__":
    with tempfile.TemporaryDirectory(prefix="course-failover-") as directory:
        run(Path(directory))
