// Display formatting for Minecraft DB cells. Pure functions, safe on server and client.
// A DB cell after serialization: blobs become their size, bigints become strings.
export type CellValue = string | number | null | { blob: number };

export type Formatted = { text: string; cls: string; filterable: boolean };

const pad = (n: number) => String(n).padStart(2, '0');

export const fmtDate = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
  `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

export const fmtDuration = (ms: number) => {
  let s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  return [h && `${h}h`, m && `${m}m`, (s || (!h && !m)) && `${s}s`].filter(Boolean).join(' ');
};

const ISO_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(\.\d+)?$/;

// Readable text for a cell. Raw value goes in the tooltip; filterable = can click to filter.
export const formatCell = (col: string, v: CellValue): Formatted => {
  if (v === null || v === undefined) return { text: 'null', cls: 'null', filterable: false };
  if (typeof v === 'object') return { text: `blob ${v.blob} B`, cls: 'muted', filterable: false };
  if (typeof v === 'number') {
    if (/_at$/.test(col) && Number.isInteger(v)) {
      if (v === 0) return { text: '—', cls: 'muted', filterable: true };
      if (v > 1e11) return { text: fmtDate(new Date(v)), cls: 'date', filterable: true };
    }
    if (/_millis$/.test(col) && Number.isInteger(v)) return { text: fmtDuration(v), cls: 'num', filterable: true };
    if (!Number.isInteger(v)) return { text: String(Number(v.toFixed(3))), cls: 'num', filterable: true };
    return { text: String(v), cls: 'num', filterable: true };
  }
  if (v === '') return { text: '(empty)', cls: 'muted', filterable: true };
  const iso = v.match(ISO_RE);
  if (iso) return { text: `${iso[1]} ${iso[2]}`, cls: 'date', filterable: true };
  return { text: v, cls: v.length > 60 ? 'long' : '', filterable: true };
};

// Links between tables: column -> the table/column it identifies.
export const RELATIONS: Record<string, Record<string, [table: string, column: string]>> = {
  lab_fights: { run_id: ['lab_runs', 'id'] },
  lab_runs: { id: ['lab_fights', 'run_id'] },
  mobs: { group_id: ['groups', 'id'] },
  groups: { id: ['mobs', 'group_id'] },
};
