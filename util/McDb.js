import Database from 'better-sqlite3';

// Read-only access to the Minecraft PokemonServer plugin's SQLite DB.
// The plugin owns the file and writes to it constantly (WAL mode). We only read.
// The host dir /home/ubuntu/mc/data/plugins/PokemonServer is mounted at /mcdata
// (the whole dir, so the -wal and -shm files sit beside the .db).
const DB_PATH = process.env.MC_DB_PATH || '/mcdata/pokemonserver.db';

// Only these tables may be browsed. Everything else (claude_messages, deaths,
// fight_events, block_log, ...) holds player names/UUIDs and stays hidden.
export const ALLOWED_TABLES = [
  'lab_runs', 'lab_fights', 'price_seeds', 'price_ops',
  'towns', 'groups', 'mobs', 'supply_slots',
];

let db = null;

const open = () => {
  if (!db) {
    db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
    db.pragma('busy_timeout = 5000');
  }
  return db;
};

// Run fn with the shared handle; on failure, drop the handle so the next call reopens
// (e.g. if the plugin recreated the file or the mount wasn't ready yet).
export const withDb = (fn) => {
  try {
    return fn(open());
  } catch (err) {
    try { db?.close(); } catch { /* ignore */ }
    db = null;
    throw err;
  }
};

// The plugin adds tables and columns without migrations, so read the schema live every time.
export const existingTables = (conn) =>
  conn.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all()
    .map(r => r.name)
    .filter(name => ALLOWED_TABLES.includes(name));

export const columnsOf = (conn, table) =>
  conn.prepare(`SELECT name, type, pk FROM pragma_table_info(?)`).all(table);

export const quoteIdent = (name) => `"${String(name).replace(/"/g, '""')}"`;
