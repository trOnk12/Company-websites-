// One worker and one in-memory database per run. Termination also cancels long queries.
importScripts('vendor/sql-wasm-inline-1.17.0.js');

self.onmessage = async ({ data: sql }) => {
  try {
    const sqlite = await initSqlJs();
    const db = new sqlite.Database();
    const results = [];
    try {
      db.run('PRAGMA foreign_keys = ON');
      for (const statement of db.iterateStatements(sql)) {
        const columns = statement.getColumnNames();
        const rows = [];
        let truncated = false;
        while (statement.step()) {
          if (rows.length === 30) {
            truncated = true;
            break;
          }
          rows.push(statement.get().map(value =>
            value === null ? 'NULL' : String(value).slice(0, 2000)
          ));
        }
        if (columns.length) results.push({ columns, rows, truncated });
        if (results.length > 20) throw new Error('Show at most 20 result sets per run.');
      }
    } finally {
      db.close();
    }
    self.postMessage({ results });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
