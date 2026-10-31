import { withDb, existingTables, columnsOf, quoteIdent, DB_PATH } from '../../util/McDb.js';

const MAX_LIMIT = 500;

// BLOBs (e.g. supply_slots.item) aren't readable in JSON; show their size instead.
const cleanRow = (row) => {
  for (const key of Object.keys(row)) {
    const v = row[key];
    if (Buffer.isBuffer(v)) row[key] = `<blob ${v.length} bytes>`;
    else if (typeof v === 'bigint') row[key] = v.toString();
  }
  return row;
};

const fail = (res, err) => {
  console.error('McDb error:', err.message);
  // Unreachable DB: say which dependency and which setting, so it can be fixed.
  if (err?.code === 'MCDB_UNAVAILABLE' || err?.code === 'SQLITE_CANTOPEN') {
    return res.status(503).json({ error: 'Minecraft DB unavailable', dependency: 'mcdb', path: DB_PATH, setting: 'MC_DB_PATH' });
  }
  res.status(500).json({ error: 'Query failed' });
};

const McDb = {
  // GET /api/v1/mc/tables -> allowed tables that exist, with columns and row counts
  tables: (req, res) => {
    try {
      const tables = withDb(conn => existingTables(conn).map(name => ({
        name,
        rows: conn.prepare(`SELECT COUNT(*) AS n FROM ${quoteIdent(name)}`).get().n,
        columns: columnsOf(conn, name),
      })));
      res.json({ tables });
    } catch (err) { fail(res, err); }
  },

  // GET /api/v1/mc/tables/:table?limit=&offset=&sort=&dir=asc|desc&<column>=<value>...
  // Any query param matching a column name becomes an equality filter.
  rows: (req, res) => {
    try {
      const result = withDb(conn => {
        const table = req.params.table;
        if (!existingTables(conn).includes(table)) return null;

        const columns = columnsOf(conn, table);
        const names = columns.map(c => c.name);

        const limit = Math.min(Math.max(parseInt(req.query.limit) || 100, 1), MAX_LIMIT);
        const offset = Math.max(parseInt(req.query.offset) || 0, 0);
        const sort = names.includes(req.query.sort) ? req.query.sort : null;
        const dir = String(req.query.dir).toLowerCase() === 'asc' ? 'ASC' : 'DESC';

        const filters = Object.entries(req.query)
          .filter(([key, val]) => names.includes(key) && typeof val === 'string');
        const where = filters.length
          ? 'WHERE ' + filters.map(([key]) => `${quoteIdent(key)} = ?`).join(' AND ')
          : '';
        const params = filters.map(([, val]) => val);

        // Default order: newest first by rowid (or by the column given in ?sort=).
        const order = sort ? `ORDER BY ${quoteIdent(sort)} ${dir}` : `ORDER BY rowid ${dir}`;
        const from = `FROM ${quoteIdent(table)} ${where}`;

        let rows;
        try {
          rows = conn.prepare(`SELECT * ${from} ${order} LIMIT ? OFFSET ?`).all(...params, limit, offset);
        } catch (err) {
          // WITHOUT ROWID tables have no rowid; fall back to unordered.
          if (sort || !/rowid/i.test(err.message)) throw err;
          rows = conn.prepare(`SELECT * ${from} LIMIT ? OFFSET ?`).all(...params, limit, offset);
        }
        const total = conn.prepare(`SELECT COUNT(*) AS n ${from}`).get(...params).n;

        return { table, columns, total, limit, offset, rows: rows.map(cleanRow) };
      });
      if (!result) return res.status(404).json({ error: 'Unknown table' });
      res.json(result);
    } catch (err) { fail(res, err); }
  },
};

export default McDb;
