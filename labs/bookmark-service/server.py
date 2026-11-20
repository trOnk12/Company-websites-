"""Loopback-only teaching service. Run with Python 3.11 or newer."""
import json
import os
import re
import sqlite3
from contextlib import closing
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DATABASE = os.environ.get("BOOKMARK_DB", "bookmarks.db")
ITEM = re.compile(r"/bookmarks/([a-z0-9-]{1,60})")


class Handler(BaseHTTPRequestHandler):
    def reply(self, status, data):
        body = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_PUT(self):
        item = ITEM.fullmatch(self.path)
        if not item:
            return self.reply(404, {"error": "unknown route"})
        try:
            with closing(sqlite3.connect(DATABASE)) as db, db:
                added = db.execute(
                    "INSERT INTO bookmarks(id) VALUES (?) ON CONFLICT(id) DO NOTHING",
                    (item[1],),
                ).rowcount
        except sqlite3.Error:
            self.log_error("bookmark write failed")
            return self.reply(503, {"error": "storage unavailable"})
        self.reply(201 if added else 200, {"id": item[1]})

    def do_GET(self):
        if self.path == "/live":
            return self.reply(200, {"alive": True})
        if self.path not in ("/ready", "/bookmarks"):
            return self.reply(404, {"error": "unknown route"})
        try:
            with closing(sqlite3.connect(DATABASE)) as db:
                if self.path == "/ready":
                    db.execute("SELECT id FROM bookmarks LIMIT 1").fetchone()
                    data = {"ready": True}
                else:
                    data = [row[0] for row in db.execute("SELECT id FROM bookmarks ORDER BY id")]
        except sqlite3.Error:
            self.log_error("bookmark read failed")
            return self.reply(503, {"error": "storage unavailable"})
        self.reply(200, data)


if __name__ == "__main__":
    with closing(sqlite3.connect(DATABASE)) as db, db:
        db.execute("CREATE TABLE IF NOT EXISTS bookmarks(id TEXT PRIMARY KEY)")
    address = ("127.0.0.1", int(os.environ.get("PORT", "8080")))
    ThreadingHTTPServer(address, Handler).serve_forever()
