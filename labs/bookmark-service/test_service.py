import os
import sqlite3
import subprocess
import sys
import tempfile
import time
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


def call(path, method="GET"):
    try:
        with urlopen(Request("http://127.0.0.1:18765" + path, method=method), timeout=2) as response:
            return response.status, response.read()
    except HTTPError as error:
        return error.code, error.read()


class ServiceTest(unittest.TestCase):
    def test_retry_restart_and_storage_incident(self):
        with tempfile.TemporaryDirectory() as temp:
            database = Path(temp) / "test.db"

            def start():
                proc = subprocess.Popen(
                    [sys.executable, str(Path(__file__).with_name("server.py"))],
                    env={**os.environ, "PORT": "18765", "BOOKMARK_DB": str(database)},
                )
                self.addCleanup(stop, proc)
                for _ in range(100):
                    if proc.poll() is not None:
                        self.fail("server exited during startup")
                    try:
                        if call("/ready")[0] == 200:
                            return proc
                    except URLError:
                        pass
                    time.sleep(0.03)
                self.fail("server did not become ready")

            def stop(proc):
                if proc.poll() is None:
                    proc.terminate()
                    proc.wait(timeout=5)

            proc = start()
            self.assertEqual(call("/typo")[0], 404)
            with ThreadPoolExecutor(2) as pool:
                codes = list(pool.map(lambda _: call("/bookmarks/river", "PUT")[0], range(2)))
            self.assertEqual(sorted(codes), [200, 201])
            stop(proc)
            start()
            self.assertEqual(call("/bookmarks"), (200, b'["river"]'))
            with sqlite3.connect(database) as db:
                db.execute("ALTER TABLE bookmarks RENAME TO parked")
            self.assertEqual(call("/live")[0], 200)
            self.assertEqual(call("/ready")[0], 503)
            self.assertEqual(call("/bookmarks/river", "PUT")[0], 503)
            with sqlite3.connect(database) as db:
                db.execute("ALTER TABLE parked RENAME TO bookmarks")
            self.assertEqual(call("/bookmarks"), (200, b'["river"]'))


if __name__ == "__main__":
    unittest.main()
