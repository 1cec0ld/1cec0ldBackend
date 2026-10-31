// Server-rendered HTML views of the Minecraft DB: /mcdb and /mcdb/:table.
// No client JS. Sorting, filtering and paging are all in the URL, so views can be
// bookmarked, shared and navigated with the back button.
//
// URL shape:  /mcdb/lab_fights?kit=iron&outcome=escaped&_sort=damage&_dir=asc&_page=2&_per=100
//   <column>=<value>   equality filter (any number of them)
//   _sort, _dir        sort column and direction (default: newest first)
//   _page, _per        paging (per: 25 | 100 | 500)
//   _fcol + _fval      from the "add filter" form; redirected to <column>=<value>

import { withDb, queryRows, tableSummaries } from '../../util/McDb.js';
import { isUnavailable, UNAVAILABLE } from './McDb.js';

const PER_PAGE = [25, 100, 500];
const DEFAULT_PER = 100;

// Links between tables: column -> the table/column it identifies.
// Shown as a small arrow beside the value.
const RELATIONS = {
  lab_fights: { run_id: ['lab_runs', 'id'] },
  lab_runs: { id: ['lab_fights', 'run_id'] },
  mobs: { group_id: ['groups', 'id'] },
  groups: { id: ['mobs', 'group_id'] },
};

const esc = (v) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const href = (table, params) => {
  const q = new URLSearchParams();
  for (const [k, v] of params) if (v !== undefined && v !== null && v !== '') q.append(k, v);
  const s = q.toString();
  return `/mcdb/${encodeURIComponent(table)}${s ? '?' + s : ''}`;
};

// ---- value formatting: readable text, raw value in the tooltip ----

const pad = (n) => String(n).padStart(2, '0');
const fmtDate = (d) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;

const fmtDuration = (ms) => {
  let s = Math.round(ms / 1000);
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  return [h && `${h}h`, m && `${m}m`, (s || (!h && !m)) && `${s}s`].filter(Boolean).join(' ');
};

const ISO_RE = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(\.\d+)?$/;

// Returns { text, cls } for display. Clickable unless cls includes 'nolink'.
const formatCell = (col, v) => {
  if (v === null || v === undefined) return { text: 'null', cls: 'null nolink' };
  if (Buffer.isBuffer(v)) return { text: `blob ${v.length} B`, cls: 'muted nolink' };
  if (typeof v === 'bigint') return { text: v.toString(), cls: 'num' };
  if (typeof v === 'number') {
    if (/_at$/.test(col) && Number.isInteger(v)) {
      if (v === 0) return { text: '—', cls: 'muted' };
      if (v > 1e11) return { text: fmtDate(new Date(v)), cls: 'date' };
    }
    if (/_millis$/.test(col) && Number.isInteger(v)) return { text: fmtDuration(v), cls: 'num' };
    if (!Number.isInteger(v)) return { text: String(Number(v.toFixed(3))), cls: 'num' };
    return { text: String(v), cls: 'num' };
  }
  const s = String(v);
  if (s === '') return { text: '(empty)', cls: 'muted' };
  const iso = s.match(ISO_RE);
  if (iso) return { text: `${iso[1]} ${iso[2]}`, cls: 'date' };
  return { text: s, cls: s.length > 60 ? 'long' : '' };
};

// ---- page shell ----

const layout = ({ title, tables = [], current = null, body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="/mcdb/style.css">
</head>
<body>
<header>
  <a class="home" href="/mcdb">Minecraft DB</a>
  <nav>${tables.map(t =>
    `<a href="/mcdb/${esc(t.name)}"${t.name === current ? ' class="active"' : ''}>${esc(t.name)}<small>${t.rows.toLocaleString()}</small></a>`).join('')}
  </nav>
</header>
<main>
${body}
</main>
</body>
</html>`;

const errorPage = (res, status, message, detail = '') =>
  res.status(status).type('html').send(layout({
    title: 'Minecraft DB',
    body: `<div class="error"><h1>${esc(message)}</h1>${detail ? `<p>${detail}</p>` : ''}<p><a href="/mcdb">Back to tables</a></p></div>`,
  }));

const fail = (res, err) => {
  console.error('McDbPages error:', err.message);
  if (isUnavailable(err)) {
    return errorPage(res, 503, UNAVAILABLE.error,
      `Dependency <code>${esc(UNAVAILABLE.dependency)}</code>: no SQLite file at <code>${esc(UNAVAILABLE.path)}</code>. Check the <code>${esc(UNAVAILABLE.setting)}</code> setting and the <code>/mcdata</code> mount.`);
  }
  errorPage(res, 500, 'Query failed');
};

// ---- /mcdb ----

const index = (req, res) => {
  try {
    const tables = withDb(tableSummaries);
    const body = `<h1>Tables</h1>
<table class="grid index">
<thead><tr><th>Table</th><th class="num">Rows</th><th>Columns</th></tr></thead>
<tbody>${tables.map(t => `<tr>
  <td><a href="/mcdb/${esc(t.name)}">${esc(t.name)}</a></td>
  <td class="num">${t.rows.toLocaleString()}</td>
  <td class="muted">${t.columns.map(c => esc(c.name)).join(', ')}</td>
</tr>`).join('')}</tbody>
</table>`;
    res.type('html').send(layout({ title: 'Minecraft DB', tables, body }));
  } catch (err) { fail(res, err); }
};

// ---- /mcdb/:table ----

const RESERVED = new Set(['_sort', '_dir', '_page', '_per', '_fcol', '_fval']);

const table = (req, res) => {
  const name = req.params.table;
  const q = req.query;

  // "Add filter" form: fold _fcol/_fval into a normal column filter and redirect.
  if (typeof q._fcol === 'string' && q._fcol) {
    const params = Object.entries(q).filter(([k]) => k !== '_fcol' && k !== '_fval' && k !== '_page');
    params.push([q._fcol, typeof q._fval === 'string' ? q._fval : '']);
    return res.redirect(303, href(name, params));
  }

  const per = PER_PAGE.includes(parseInt(q._per)) ? parseInt(q._per) : DEFAULT_PER;
  const page = Math.max(parseInt(q._page) || 1, 1);
  const filterParams = Object.entries(q).filter(([k, v]) => !RESERVED.has(k) && typeof v === 'string');

  let tables, result;
  try {
    ({ tables, result } = withDb(conn => ({
      tables: tableSummaries(conn),
      result: queryRows(conn, name, {
        filters: filterParams, sort: q._sort, dir: q._dir || 'desc', limit: per, offset: (page - 1) * per,
      }),
    })));
  } catch (err) { return fail(res, err); }
  if (!result) return errorPage(res, 404, `Unknown table "${name}"`, 'Only allowlisted tables can be browsed.');

  const { columns, rows, total, filters, sort, dir } = result;
  const colNames = columns.map(c => c.name);
  const pages = Math.max(Math.ceil(total / per), 1);

  // Current state as URL params, so every link keeps everything except what it changes.
  const state = { filters, sort, dir, per };
  const link = (over = {}) => {
    const s = { ...state, page: 1, ...over };
    return href(name, [
      ...s.filters,
      ['_sort', s.sort], ['_dir', s.sort ? s.dir : (s.dir === 'asc' ? 'asc' : null)],
      ['_per', s.per === DEFAULT_PER ? null : s.per],
      ['_page', s.page > 1 ? s.page : null],
    ]);
  };
  const withFilter = (col, val) => link({ filters: [...filters.filter(([k]) => k !== col), [col, val]] });
  const withoutFilter = (col) => link({ filters: filters.filter(([k]) => k !== col) });

  const headerCell = (c) => {
    const active = sort === c.name;
    const nextDir = active && dir === 'desc' ? 'asc' : 'desc';
    const arrow = active ? (dir === 'asc' ? ' ▲' : ' ▼') : '';
    return `<th title="${esc(c.type || 'untyped')}${c.pk ? ', primary key' : ''}"><a href="${esc(link({ sort: c.name, dir: nextDir }))}">${esc(c.name)}${arrow}</a></th>`;
  };

  const bodyCell = (col, raw) => {
    const { text, cls } = formatCell(col, raw);
    const rel = RELATIONS[name]?.[col];
    const relLink = rel && raw !== null && raw !== undefined && raw !== ''
      ? ` <a class="rel" href="${esc(href(rel[0], [[rel[1], String(raw)]]))}" title="Show in ${esc(rel[0])}">↗ ${esc(rel[0])}</a>`
      : '';
    const content = cls.includes('nolink')
      ? esc(text)
      : `<a href="${esc(withFilter(col, String(raw)))}" title="${esc(raw)}&#10;click to filter">${esc(text)}</a>`;
    return `<td class="${cls}">${content}${relLink}</td>`;
  };

  const first = total ? (page - 1) * per + 1 : 0;
  const last = Math.min(page * per, total);
  const pager = `<div class="pager">
  <span>${total ? `${first.toLocaleString()}–${last.toLocaleString()} of ${total.toLocaleString()}` : 'No rows'}</span>
  ${page > 1 ? `<a href="${esc(link({ page: 1 }))}">« First</a><a href="${esc(link({ page: page - 1 }))}">‹ Prev</a>` : '<span class="off">« First</span><span class="off">‹ Prev</span>'}
  <span class="muted">page ${page} / ${pages}</span>
  ${page < pages ? `<a href="${esc(link({ page: page + 1 }))}">Next ›</a><a href="${esc(link({ page: pages }))}">Last »</a>` : '<span class="off">Next ›</span><span class="off">Last »</span>'}
  <span class="per">rows: ${PER_PAGE.map(n => n === per ? `<b>${n}</b>` : `<a href="${esc(link({ per: n }))}">${n}</a>`).join(' ')}</span>
</div>`;

  const chips = filters.length
    ? `<div class="chips">${filters.map(([k, v]) =>
        `<a class="chip" href="${esc(withoutFilter(k))}" title="Remove filter">${esc(k)} = ${esc(v === '' ? '(empty)' : v)} ✕</a>`).join('')}
       <a class="clear" href="${esc(link({ filters: [] }))}">clear all</a></div>`
    : '';

  // Plain GET form; hidden inputs carry the current view through the submit.
  const keep = [...filters, ['_sort', sort], ['_dir', sort ? dir : null], ['_per', per === DEFAULT_PER ? null : per]]
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('');
  const filterForm = `<form class="filter" method="get" action="/mcdb/${esc(name)}">
  ${keep}
  <select name="_fcol" aria-label="Column">${colNames.map(c => `<option>${esc(c)}</option>`).join('')}</select>
  <input name="_fval" placeholder="equals…" aria-label="Value">
  <button type="submit">Filter</button>
</form>`;

  const body = `<div class="toolbar">
  <h1>${esc(name)}</h1>
  ${filterForm}
  <a class="json" href="/api/v1/mc/tables/${esc(name)}?${esc(new URLSearchParams([...filters, ['limit', per], ['offset', (page - 1) * per], ...(sort ? [['sort', sort], ['dir', dir]] : [])]).toString())}">JSON</a>
</div>
${chips}
${pager}
<div class="wrap">
<table class="grid">
<thead><tr>${columns.map(headerCell).join('')}</tr></thead>
<tbody>${rows.map(r => `<tr>${colNames.map(c => bodyCell(c, r[c])).join('')}</tr>`).join('') ||
  `<tr><td colspan="${colNames.length}" class="muted">No rows match.</td></tr>`}</tbody>
</table>
</div>
${total > per ? pager : ''}`;

  res.type('html').send(layout({ title: `${name} · Minecraft DB`, tables, current: name, body }));
};

export default { index, table };
