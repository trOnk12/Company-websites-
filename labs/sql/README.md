# SQL inside a lesson

Fence a self-contained example with `sql run` in a course puzzle. The page shows the SQL even without scripts. Running it starts a fresh SQLite database in a dedicated worker. The offline vault includes the same SQL as an ordinary code block. Examples that depend on concurrent PostgreSQL sessions use the native PostgreSQL lab instead.

The worker loads the unmodified single-file WebAssembly distribution of sql.js 1.17.0 only after a learner presses Run SQL. To reproduce the vendored files, unpack the npm package `sql.js@1.17.0` and copy `dist/sql-wasm-inline.js` , `LICENSE` and `AUTHORS`. The browser needs no external service or database credentials.
