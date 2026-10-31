import { withDb, queryRows, tableSummaries, DB_PATH } from '../../util/McDb.js';

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

export const isUnavailable = (err) => err?.code === 'MCDB_UNAVAILABLE' || err?.code === 'SQLITE_CANTOPEN';
export const UNAVAILABLE = { error: 'Minecraft DB unavailable', dependency: 'mcdb', path: DB_PATH, setting: 'MC_DB_PATH' };

const fail = (res, err) => {
  console.error('McDb error:', err.message);
  // Unreachable DB: say which dependency and which setting, so it can be fixed.
  if (isUnavailable(err)) return res.status(503).json(UNAVAILABLE);
  res.status(500).json({ error: 'Query failed' });
};

const McDb = {
  // GET /api/v1/mc/tables -> allowed tables that exist, with columns and row counts
  tables: (req, res) => {
    try {
      res.json({ tables: withDb(tableSummaries) });
    } catch (err) { fail(res, err); }
  },

  // GET /api/v1/mc/tables/:table?limit=&offset=&sort=&dir=asc|desc&<column>=<value>...
  // Any query param matching a column name becomes an equality filter.
  rows: (req, res) => {
    try {
      const result = withDb(conn => queryRows(conn, req.params.table, {
        filters: Object.entries(req.query),
        sort: req.query.sort,
        dir: req.query.dir,
        limit: Math.min(Math.max(parseInt(req.query.limit) || 100, 1), MAX_LIMIT),
        offset: Math.max(parseInt(req.query.offset) || 0, 0),
      }));
      if (!result) return res.status(404).json({ error: 'Unknown table' });
      const { table, columns, total, limit, offset, rows } = result;
      res.json({ table, columns, total, limit, offset, rows: rows.map(cleanRow) });
    } catch (err) { fail(res, err); }
  },
};

export default McDb;
