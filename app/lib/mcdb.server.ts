// Read-only access to the Minecraft PokemonServer plugin's SQLite DB.
// The plugin owns the file and writes to it constantly (WAL mode). We only read.
// The host dir /home/ubuntu/mc/data/plugins/PokemonServer is mounted at /mcdata
// (the whole dir, so the -wal and -shm files sit beside the .db).
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { MC_DB_PATH } from '../../mcdb-path.js';
import type { CellValue } from './format';

export const DB_PATH: string = MC_DB_PATH;

// Every table is browsable, but UUID columns are never shown or queried (see isUuidColumn).

export type Column = { name: string; type: string; pk: number };
export type Row = Record<string, unknown>;
export type Filter = [column: string, value: string];
export type TableSummary = { name: string; rows: number; columns: Column[] };
export type RowsResult = {
  table: string;
  columns: Column[];
  rows: Row[];
  total: number;
  limit: number;
  offset: number;
  filters: Filter[];
  sort: string | null;
  dir: 'asc' | 'desc';
};

// What an unreachable DB reports: the dependency and the setting, never a secret.
export const UNAVAILABLE = {
  error: 'Minecraft DB unavailable', dependency: 'mcdb', path: DB_PATH, setting: 'MC_DB_PATH',
};

export class McDbUnavailableError extends Error {
  code = 'MCDB_UNAVAILABLE';
}

export const isUnavailable = (err: unknown): boolean => {
  const code = (err as { code?: string } | null)?.code;
  return code === 'MCDB_UNAVAILABLE' || code === 'SQLITE_CANTOPEN';
};

let db: Database.Database | null = null;

const open = (): Database.Database => {
  if (!db) {
    if (!fs.existsSync(DB_PATH)) throw new McDbUnavailableError(`Minecraft DB not found at ${DB_PATH}`);
    db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
    db.pragma('busy_timeout = 5000');
  }
  return db;
};

// Run fn with the shared handle; on failure, drop the handle so the next call reopens
// (e.g. if the plugin recreated the file or the mount wasn't ready yet).
export const withDb = <T>(fn: (conn: Database.Database) => T): T => {
  try {
    return fn(open());
  } catch (err) {
    try { db?.close(); } catch { /* ignore */ }
    db = null;
    throw err;
  }
};

const quoteIdent = (name: string) => `"${String(name).replace(/"/g, '""')}"`;

// The plugin adds tables and columns without migrations, so read the schema live every time.
// sqlite_* are SQLite's own bookkeeping tables.
const existingTables = (conn: Database.Database): string[] =>
  (conn.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite\\_%' ESCAPE '\\' ORDER BY name`)
    .all() as { name: string }[])
    .map(r => r.name);

// ---- UUID columns stay hidden ----
// By name (uuid, player_uuid, ...) or by content: a column where ANY sampled value is a
// UUID. "Any", not "all": map_blocks.created_by mixes player UUIDs with 'console'.
// Content checks are cached briefly, since every page lists every table's columns.
// serializeRow also redacts UUIDs in whatever is shown, as a backstop for values the
// sample missed and UUIDs embedded in free text.
const UUID_NAME_RE = /(^|_)uuid$/i;
const UUID_VALUE_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const UUID_SAMPLE = 200;
const UUID_CACHE_MS = 5 * 60_000;
const uuidCache = new Map<string, { uuid: boolean; at: number }>();

const isUuidColumn = (conn: Database.Database, table: string, column: string): boolean => {
  if (UUID_NAME_RE.test(column)) return true;
  const key = `${table}\u0000${column}`;
  const hit = uuidCache.get(key);
  if (hit && Date.now() - hit.at < UUID_CACHE_MS) return hit.uuid;
  const col = quoteIdent(column);
  const sample = conn.prepare(
    `SELECT ${col} AS v FROM ${quoteIdent(table)} WHERE ${col} IS NOT NULL AND ${col} != '' LIMIT ${UUID_SAMPLE}`,
  ).all() as { v: unknown }[];
  const uuid = sample.some(r => typeof r.v === 'string' && UUID_VALUE_RE.test(r.v));
  uuidCache.set(key, { uuid, at: Date.now() });
  return uuid;
};

// Visible columns only. Everything downstream (SELECT list, filters, sort) uses this.
const columnsOf = (conn: Database.Database, table: string): Column[] =>
  (conn.prepare(`SELECT name, type, pk FROM pragma_table_info(?)`).all(table) as Column[])
    .filter(c => !isUuidColumn(conn, table, c.name));

const count = (conn: Database.Database, sql: string, params: unknown[] = []): number =>
  (conn.prepare(sql).get(...params) as { n: number }).n;

// Row counts and visible columns for every table.
export const tableSummaries = (conn: Database.Database): TableSummary[] =>
  existingTables(conn).map(name => ({
    name,
    rows: count(conn, `SELECT COUNT(*) AS n FROM ${quoteIdent(name)}`),
    columns: columnsOf(conn, name),
  }));

// One page of rows (visible columns only). Unknown filter/sort columns are ignored.
// sort null = newest first by rowid. Returns null for a table that isn't visible.
export const queryRows = (
  conn: Database.Database,
  table: string,
  { filters = [], sort = null, dir = 'desc', limit = 100, offset = 0 }:
    { filters?: [string, unknown][]; sort?: unknown; dir?: unknown; limit?: number; offset?: number } = {},
): RowsResult | null => {
  if (!existingTables(conn).includes(table)) return null;

  const columns = columnsOf(conn, table);
  const names = columns.map(c => c.name);
  const useFilters = filters.filter((f): f is Filter => names.includes(f[0]) && typeof f[1] === 'string');
  const useSort = typeof sort === 'string' && names.includes(sort) ? sort : null;
  const useDir: 'asc' | 'desc' = String(dir).toLowerCase() === 'asc' ? 'asc' : 'desc';

  const where = useFilters.length
    ? 'WHERE ' + useFilters.map(([key]) => `${quoteIdent(key)} = ?`).join(' AND ')
    : '';
  const params = useFilters.map(([, val]) => val);
  const from = `FROM ${quoteIdent(table)} ${where}`;
  // Name the visible columns rather than SELECT *, so hidden UUID values never leave SQLite.
  const select = `SELECT ${columns.length ? names.map(quoteIdent).join(', ') : 'NULL AS _'}`;
  const order = useSort ? `ORDER BY ${quoteIdent(useSort)} ${useDir}` : `ORDER BY rowid ${useDir}`;

  let rows: Row[];
  try {
    rows = conn.prepare(`${select} ${from} ${order} LIMIT ? OFFSET ?`).all(...params, limit, offset) as Row[];
  } catch (err) {
    // WITHOUT ROWID tables have no rowid; fall back to unordered.
    if (useSort || !/rowid/i.test((err as Error).message)) throw err;
    rows = conn.prepare(`${select} ${from} LIMIT ? OFFSET ?`).all(...params, limit, offset) as Row[];
  }

  return {
    table, columns, rows, limit, offset,
    total: count(conn, `SELECT COUNT(*) AS n ${from}`, params),
    filters: useFilters, sort: useSort, dir: useDir,
  };
};

// BLOBs (e.g. supply_slots.item) and bigints can't go through JSON or loader data as-is.
// Loader data is serialized, so convert before it leaves the server. UUIDs anywhere in a
// string are redacted (see isUuidColumn).
const UUID_ANYWHERE_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
export const serializeRow = (row: Row): Record<string, CellValue> => {
  const out: Record<string, CellValue> = {};
  for (const [k, v] of Object.entries(row)) {
    if (Buffer.isBuffer(v)) out[k] = { blob: v.length };
    else if (typeof v === 'bigint') out[k] = v.toString();
    else if (typeof v === 'string') out[k] = v.replace(UUID_ANYWHERE_RE, '(uuid hidden)');
    else out[k] = v as CellValue;
  }
  return out;
};
