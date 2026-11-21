"""Offline experiments with synthetic rows. Run with python3 data_drills.py."""
import sqlite3

db = sqlite3.connect(":memory:")
db.executescript("""
CREATE TABLE saved(owner TEXT, name TEXT, PRIMARY KEY(owner, name));
CREATE TABLE pending(id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE delivered(id INTEGER PRIMARY KEY);
CREATE TABLE feed(id INTEGER PRIMARY KEY, owner TEXT, created INTEGER);
""")
try:
    with db:
        db.execute("INSERT INTO saved VALUES ('ada','river')")
        raise RuntimeError("simulated interruption before recording the event")
except RuntimeError:
    pass
assert db.execute("SELECT count(*) FROM saved").fetchone() == (0,)
with db:
    db.execute("INSERT INTO saved VALUES ('ada','river')")
    db.execute("INSERT INTO pending VALUES (1,'river')")
print("After rollback: zero rows. After commit: bookmark and pending event.")

# A worker may see the same event twice after losing an acknowledgement.
for event_id in (1, 1):
    with db:
        db.execute("INSERT INTO delivered VALUES (?) ON CONFLICT(id) DO NOTHING", (event_id,))
assert db.execute("SELECT count(*) FROM delivered").fetchone() == (1,)

def names_for(principal):
    return db.execute("SELECT name FROM saved WHERE owner=?", (principal,)).fetchall()

assert names_for("ada") == [("river",)]
assert names_for("ben") == []
print("Two deliveries, one recorded effect. Ben sees zero of Ada's rows.")

db.executemany("INSERT INTO feed VALUES (?,?,?)",
               ((i, str(i % 10), i // 20) for i in range(2000)))
query = "SELECT id FROM feed WHERE owner=? ORDER BY created DESC, id DESC LIMIT 5"
def plan():
    return [row[3] for row in db.execute("EXPLAIN QUERY PLAN " + query, ("1",))]
before = db.execute(query, ("1",)).fetchall()
print("Before index:", plan())
db.execute("CREATE INDEX feed_page ON feed(owner, created DESC, id DESC)")
print("After index:", plan())
assert before == db.execute(query, ("1",)).fetchall()
print("Same ordered results:", before)

# Resume strictly after the last (time, id) pair, including ties at the boundary.
cursor_id = before[-1][0]
cursor_time = db.execute("SELECT created FROM feed WHERE id=?", (cursor_id,)).fetchone()[0]
second = db.execute("""
    SELECT id FROM feed WHERE owner=? AND (created, id) < (?, ?)
    ORDER BY created DESC, id DESC LIMIT 5
""", ("1", cursor_time, cursor_id)).fetchall()
first_ten = db.execute(query.replace("LIMIT 5", "LIMIT 10"), ("1",)).fetchall()
assert before + second == first_ten
print("Two pages equal the first ten rows:", before + second)

# Expand the schema and keep an old reader working through the transition.
with db:
    db.execute("ALTER TABLE saved ADD COLUMN label TEXT")
    db.execute("UPDATE saved SET label=name WHERE label IS NULL")
assert names_for("ada") == [("river",)]
snapshot = sqlite3.connect(":memory:")
db.backup(snapshot)
with db:
    db.execute("DELETE FROM saved WHERE owner='ada'")
assert not names_for("ada")
assert snapshot.execute("SELECT owner,name,label FROM saved").fetchall() == [
    ("ada", "river", "river")
]
print("Old reader survived migration; independent snapshot preserved the row.")
snapshot.close()
db.close()
