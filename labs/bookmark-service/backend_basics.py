"""Small, deterministic models for the backend course. No network or credentials."""
import json
import math
import sqlite3


def read_bookmark(raw):
    try:
        item = json.loads(raw)
    except (ValueError, UnicodeDecodeError):
        return 400, None
    if not isinstance(item, dict) or not isinstance(item.get("name"), str):
        return 422, None
    name = item["name"].strip()
    if not 1 <= len(name) <= 60:
        return 422, None
    return 200, name


assert [read_bookmark(s)[0] for s in ('{', '{}', '{"name":"river","color":"blue"}')] == [400, 422, 200]

db = sqlite3.connect(":memory:")
db.execute("PRAGMA foreign_keys=ON")
db.executescript("""
CREATE TABLE account(id INTEGER PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE bookmark(owner INTEGER REFERENCES account(id) NOT NULL,
                      name TEXT NOT NULL, PRIMARY KEY(owner,name));
INSERT INTO account VALUES (1,'Ada'),(2,'Ben');
INSERT INTO bookmark VALUES (1,'river');
""")
counts = db.execute("""
    SELECT a.name, count(b.name) FROM account a LEFT JOIN bookmark b ON a.id=b.owner
    GROUP BY a.id ORDER BY a.id
""").fetchall()
assert counts == [('Ada', 1), ('Ben', 0)]
try:
    db.execute("INSERT INTO bookmark VALUES (3,'invalid')")
except sqlite3.IntegrityError:
    pass
else:
    raise AssertionError("missing owner should fail")

# Synthetic session fixtures representing the result of an earlier identity check.
sessions = {"example-a": (1, 100), "example-b": (2, 100)}
def authorize(session, resource_owner, now):
    entry = sessions.get(session)
    if entry is None or now >= entry[1]:
        return 401
    return 200 if entry[0] == resource_owner else 403

assert [authorize(k, 1, t) for k, t in [('example-a', 99), ('example-b', 99), ('example-a', 100)]] == [200, 403, 401]

cache = {}
def names(owner, now):
    entry = cache.get(owner)
    if entry and now < entry[0]:
        return entry[1]
    rows = db.execute("SELECT name FROM bookmark WHERE owner=? ORDER BY name", (owner,)).fetchall()
    result = tuple(row[0] for row in rows)
    cache[owner] = (now + 10, result)
    return result

assert names(1, 0) == ('river',)
db.execute("INSERT INTO bookmark VALUES (1,'hill')")
assert names(1, 9) == ('river',) and names(2, 9) == ()
assert names(1, 10) == ('hill', 'river')
db.close()

samples = [10] * 94 + [200] * 6
rank = math.ceil(0.95 * len(samples))
print("Latency in ms: mean", sum(samples) / len(samples), "p95", sorted(samples)[rank - 1])
print("Contracts, owner constraints, session expiry and cache isolation passed.")
