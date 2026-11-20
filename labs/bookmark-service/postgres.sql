-- Run against the disposable PostgreSQL container in the lab guide.
BEGIN;
CREATE TEMP TABLE account (id bigint PRIMARY KEY, name text NOT NULL);
CREATE TEMP TABLE bookmark (
    owner bigint REFERENCES account(id) NOT NULL,
    name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (owner, name)
);
INSERT INTO account VALUES (1, 'Ada'), (2, 'Ben');
INSERT INTO bookmark(owner, name) VALUES (1, 'river')
    ON CONFLICT (owner, name) DO NOTHING;
INSERT INTO bookmark(owner, name) VALUES (1, 'river')
    ON CONFLICT (owner, name) DO NOTHING;
SELECT a.name, count(b.name) AS bookmarks
FROM account a LEFT JOIN bookmark b ON b.owner = a.id
GROUP BY a.id, a.name ORDER BY a.id;
ALTER TABLE bookmark ADD COLUMN label text;
UPDATE bookmark SET label = name WHERE label IS NULL;
ALTER TABLE bookmark ALTER COLUMN label SET NOT NULL;
EXPLAIN (ANALYZE, BUFFERS)
SELECT name FROM bookmark WHERE owner = 1 ORDER BY created_at DESC, name LIMIT 5;
ROLLBACK;
