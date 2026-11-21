"""Compare a history page and the work of maintaining its index. Run with Python 3."""

import sqlite3
from contextlib import closing


PAGE = """
SELECT id FROM history
WHERE owner = ? AND (started, id) < (?, ?)
ORDER BY started DESC, id DESC LIMIT 5
"""


def rows(first, last):
    for number in range(first, last + 1):
        owner = "Ben" if number % 4 == 0 else "Ada"
        yield number, owner, number // 10


def count_instructions(db, operation):
    instructions = 0

    def count():
        nonlocal instructions
        instructions += 1
        return 0

    db.set_progress_handler(count, 1)
    try:
        result = operation()
    finally:
        db.set_progress_handler(None, 0)
    return result, instructions


def measure(label, index_columns):
    with closing(sqlite3.connect(":memory:", cached_statements=0)) as db:
        db.execute("CREATE TABLE history (id INTEGER PRIMARY KEY, owner TEXT, started INTEGER)")
        insert = "INSERT INTO history VALUES (?, ?, ?)"
        db.executemany(insert, rows(1, 20000))
        if index_columns:
            db.execute("CREATE INDEX history_page ON history(" + index_columns + ")")
        db.commit()

        boundary = (1000, 10002)
        ids, reads = count_instructions(
            db, lambda: [row[0] for row in db.execute(PAGE, ("Ada", *boundary))]
        )
        expected = sorted(
            ((started, number) for number, owner, started in rows(1, 20000)
             if owner == "Ada" and (started, number) < boundary),
            reverse=True,
        )[:5]
        assert ids == [number for _, number in expected], (label, ids, expected)

        def add_history():
            db.executemany(insert, rows(20001, 20100))
            db.commit()

        _, writes = count_instructions(db, add_history)
        pages = db.execute("PRAGMA page_count").fetchone()[0]
        size = db.execute("PRAGMA page_size").fetchone()[0]
        print(f"{label:15} {str(ids):38} {reads:10,d} {writes:12,d} {pages * size:12,d}")


if __name__ == "__main__":
    print("SQLite", sqlite3.sqlite_version)
    print(f"{'Index':15} {'Next page':38} {'Read ops':>10} {'100 writes':>12} {'DB bytes':>12}")
    measure("None", None)
    measure("Driver only", "owner")
    measure("Driver/time/ID", "owner, started DESC, id DESC")
