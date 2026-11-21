"""Replay one ownership handoff. Run with Python 3 and its standard sqlite3 module."""
import sqlite3
import tempfile
from contextlib import closing
from pathlib import Path


def grant(db):
    with db:
        db.execute("UPDATE display SET generation = generation + 1 WHERE id = 1")
        return db.execute("SELECT generation FROM display WHERE id = 1").fetchone()[0]


def publish(db, generation, message, guarded):
    with db:
        if guarded:
            return db.execute(
                "UPDATE display SET message = ? WHERE id = 1 AND generation = ?",
                (message, generation),
            ).rowcount
        return db.execute("UPDATE display SET message = ? WHERE id = 1", (message,)).rowcount


def run(path, guarded, old_first):
    with closing(sqlite3.connect(path)) as old, closing(sqlite3.connect(path)) as new:
        with old:
            old.execute("CREATE TABLE display(id INTEGER PRIMARY KEY, generation INTEGER, message TEXT)")
            old.execute("INSERT INTO display VALUES(1, 0, 'unknown')")
        first = grant(old)
        second = grant(new)
        writes = [(old, first, "open"), (new, second, "full")]
        if not old_first:
            writes.reverse()
        counts = [publish(db, token, value, guarded) for db, token, value in writes]
        actual = new.execute("SELECT message FROM display WHERE id = 1").fetchone()[0]
        expected = "full" if guarded or old_first else "open"
        assert actual == expected
        assert counts == ([int(token == second) for _, token, _ in writes] if guarded else [1, 1])
        print(f"guarded={guarded}, old first={old_first}: affected={counts}, display={actual}")


if __name__ == "__main__":
    with tempfile.TemporaryDirectory() as directory:
        for guarded in (False, True):
            for old_first in (False, True):
                run(Path(directory) / f"{guarded}-{old_first}.db", guarded, old_first)
