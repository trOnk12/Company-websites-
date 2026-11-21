"""Replay two editors against a temporary loopback HTTP service. Python 3."""
import http.client
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
import sqlite3
from tempfile import TemporaryDirectory
from threading import Thread


class BookmarkHandler(BaseHTTPRequestHandler):
    # The fixture has one existing plain-text bookmark and accepts one numeric tag.
    def reply(self, status, body=b"", tag=None):
        self.send_response(status)
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        if tag is not None:
            self.send_header("ETag", f'"{tag}"')
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path != "/bookmarks/1":
            return self.reply(404)
        with sqlite3.connect(self.server.db_path) as db:
            title, version = db.execute("SELECT title, version FROM bookmark WHERE id=1").fetchone()
        self.reply(200, title.encode(), version)

    def do_PUT(self):
        if self.path != "/bookmarks/1":
            return self.reply(404)
        tag = self.headers.get("If-Match")
        if tag is None:
            return self.reply(428)
        title = self.rfile.read(int(self.headers["Content-Length"])).decode()
        with sqlite3.connect(self.server.db_path) as db:
            rows = db.execute(
                """UPDATE bookmark SET title=?, version=version+1
                   WHERE id=1 AND printf('"%d"', version)=?""", (title, tag)
            ).rowcount
        self.reply(204 if rows else 412)

    def log_message(self, *args):
        pass


def replay(port):
    def request(method, title=None, tag=None):
        conn = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        try:
            conn.request(method, "/bookmarks/1", body=title,
                         headers={"If-Match": tag} if tag else {})
            response = conn.getresponse()
            return response.status, response.read().decode(), response.getheader("ETag")
        finally:
            conn.close()

    a = request("GET")
    b = request("GET")
    assert a == b == (200, "River", '"7"')
    assert request("PUT", "Lake", a[2])[0] == 204
    stale = request("PUT", "Forest", b[2])[0]
    current = request("GET")
    print(f"B received {stale}. Reading again gives {current[1]} at {current[2]}.")
    assert stale == 412 and current == (200, "Lake", '"8"')
    # B has seen the new title and deliberately chooses a combined title.
    assert request("PUT", "Lake and Forest", current[2])[0] == 204
    assert request("GET") == (200, "Lake and Forest", '"9"')


if __name__ == "__main__":
    with TemporaryDirectory() as directory:
        path = Path(directory) / "bookmarks.db"
        with sqlite3.connect(path) as db:
            db.execute("CREATE TABLE bookmark(id INTEGER PRIMARY KEY, title TEXT, version INTEGER)")
            db.execute("INSERT INTO bookmark VALUES(1, 'River', 7)")
        with HTTPServer(("127.0.0.1", 0), BookmarkHandler) as server:
            server.db_path = path
            worker = Thread(target=server.serve_forever)
            worker.start()
            try:
                replay(server.server_port)
            finally:
                server.shutdown()
                worker.join()
