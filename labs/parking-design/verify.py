"""Run the HTTP contract against a fresh database and restart the Java process."""
from concurrent.futures import ThreadPoolExecutor
from contextlib import contextmanager
from http.client import HTTPConnection
from pathlib import Path
from subprocess import PIPE, Popen
from tempfile import TemporaryDirectory
from threading import Barrier
import sys

HERE = Path(__file__).resolve().parent

@contextmanager
def service(driver, database):
    with Popen(["java", "-cp", driver, str(HERE / "Parking.java"), database],
               stdout=PIPE, text=True) as proc:
        try:
            line = proc.stdout.readline()
            if not line.startswith("PORT "):
                raise RuntimeError("Java service did not start")
            yield int(line.split()[1])
        finally:
            proc.terminate()
            proc.wait(timeout=10)

def request(port, method, key, body=None):
    conn = HTTPConnection("127.0.0.1", port, timeout=10)
    try:
        conn.request(method, "/sessions/" + key, body)
        response = conn.getresponse()
        return response.status, response.read().decode()
    finally:
        conn.close()

def check(driver):
    with TemporaryDirectory() as tmp:
        database = str(Path(tmp) / "parking")
        with service(driver, database) as port:
            ready = Barrier(2)
            def contender(key):
                ready.wait(timeout=5)
                return key, request(port, "PUT", key, "west")
            with ThreadPoolExecutor(max_workers=2) as pool:
                writes = dict(pool.map(contender, ["one", "two"]))
            winner, loser = sorted(writes, key=lambda key: writes[key][0])
            assert writes[winner] == (201, "west") and writes[loser] == (409, "full"), writes
            assert request(port, "GET", loser) == (404, "missing")
            assert request(port, "PUT", winner, "west") == (200, "west")
            assert request(port, "PUT", winner, "east") == (409, "id already used")
            assert request(port, "PUT", "bad", "north") == (400, "choose west or east")
            print("Two contenders: one confirmed, one full. Replay preserved the original session.")
        with service(driver, database) as port:
            assert request(port, "GET", winner) == (200, "west")
            assert request(port, "PUT", loser, "west") == (409, "full")
            assert request(port, "PUT", loser, "east") == (201, "east")
            print("After restart: west still full; the rejected client can reserve east.")

if __name__ == "__main__":
    check(str(Path(sys.argv[1]).resolve(strict=True)))
