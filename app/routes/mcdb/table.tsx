// /mcdb/:table: one page of rows as an HTML table.
// All state is in the URL, so views can be bookmarked and shared:
//   /mcdb/lab_fights?kit=iron&outcome=escaped&_sort=damage&_dir=asc&_page=2&_per=100
//   <column>=<value>   equality filter (any number of them)
//   _sort, _dir        sort column and direction (default: newest first)
//   _page, _per        paging (per: 25 | 100 | 500)
//   _fcol + _fval      from the "add filter" form; redirected to <column>=<value>
import { data, Form, isRouteErrorResponse, Link, redirect } from 'react-router';
import { formatCell, RELATIONS, type CellValue } from '~/lib/format';
import { isUnavailable, queryRows, serializeRow, UNAVAILABLE, withDb, type Filter } from '~/lib/mcdb.server';
import type { Route } from './+types/table';

const PER_PAGE = [25, 100, 500];
const DEFAULT_PER = 100;
const RESERVED = new Set(['_sort', '_dir', '_page', '_per', '_fcol', '_fval']);

type View = { filters: Filter[]; sort: string | null; dir: 'asc' | 'desc'; per: number; page: number };

// The URL for a view of this table. Defaults are left out to keep URLs short.
const viewHref = (table: string, v: View) => {
  const q = new URLSearchParams();
  for (const [k, val] of v.filters) q.append(k, val);
  if (v.sort) { q.set('_sort', v.sort); q.set('_dir', v.dir); }
  else if (v.dir === 'asc') q.set('_dir', 'asc');
  if (v.per !== DEFAULT_PER) q.set('_per', String(v.per));
  if (v.page > 1) q.set('_page', String(v.page));
  const s = q.toString();
  return `/mcdb/${encodeURIComponent(table)}${s ? '?' + s : ''}`;
};

export function loader({ request, params }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const q = url.searchParams;

  // "Add filter" form: fold _fcol/_fval into a normal column filter and redirect.
  const fcol = q.get('_fcol');
  if (fcol) {
    const next = new URLSearchParams([...q].filter(([k]) => k !== '_fcol' && k !== '_fval' && k !== '_page'));
    next.append(fcol, q.get('_fval') ?? '');
    // Built from the table name, not url.pathname: on client navigation the request
    // is for /mcdb/<table>.data, and the redirect must point at the page URL.
    throw redirect(`/mcdb/${encodeURIComponent(params.table)}?${next}`, 303);
  }

  const perParam = parseInt(q.get('_per') ?? '');
  const per = PER_PAGE.includes(perParam) ? perParam : DEFAULT_PER;
  const page = Math.max(parseInt(q.get('_page') ?? '') || 1, 1);

  let result;
  try {
    result = withDb(conn => queryRows(conn, params.table, {
      filters: [...q].filter(([k]) => !RESERVED.has(k)),
      sort: q.get('_sort'),
      dir: q.get('_dir') ?? 'desc',
      limit: per,
      offset: (page - 1) * per,
    }));
  } catch (err) {
    console.error('mcdb error:', (err as Error)?.message ?? err);
    if (isUnavailable(err)) throw data(UNAVAILABLE, { status: 503 });
    throw data({ error: 'Query failed' }, { status: 500 });
  }
  if (!result) throw data(`Unknown table "${params.table}". Only allowlisted tables can be browsed.`, { status: 404 });

  return {
    table: result.table,
    columns: result.columns,
    rows: result.rows.map(serializeRow),
    total: result.total,
    view: { filters: result.filters, sort: result.sort, dir: result.dir, per, page } satisfies View,
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: `${loaderData?.table ?? 'Table'} · Minecraft DB` }];
}

function Cell({ table, col, raw, link }: { table: string; col: string; raw: CellValue; link: (col: string, val: string) => string }) {
  const { text, cls, filterable } = formatCell(col, raw);
  const rel = RELATIONS[table]?.[col];
  const rawText = raw === null || typeof raw === 'object' ? null : String(raw);
  return (
    <td className={cls}>
      {filterable && rawText !== null
        ? <Link to={link(col, rawText)} title={`${rawText}\nclick to filter`}>{text}</Link>
        : text}
      {rel && rawText && (
        <Link className="rel" to={`/mcdb/${rel[0]}?${new URLSearchParams([[rel[1], rawText]])}`} title={`Show in ${rel[0]}`}>
          ↗ {rel[0]}
        </Link>
      )}
    </td>
  );
}

function Pager({ table, view, total }: { table: string; view: View; total: number }) {
  const pages = Math.max(Math.ceil(total / view.per), 1);
  const first = total ? (view.page - 1) * view.per + 1 : 0;
  const last = Math.min(view.page * view.per, total);
  const to = (over: Partial<View>) => viewHref(table, { ...view, ...over });
  return (
    <div className="pager">
      <span>{total ? `${first.toLocaleString()}–${last.toLocaleString()} of ${total.toLocaleString()}` : 'No rows'}</span>
      {view.page > 1
        ? <><Link to={to({ page: 1 })}>« First</Link><Link to={to({ page: view.page - 1 })}>‹ Prev</Link></>
        : <><span className="off">« First</span><span className="off">‹ Prev</span></>}
      <span className="muted">page {view.page} / {pages}</span>
      {view.page < pages
        ? <><Link to={to({ page: view.page + 1 })}>Next ›</Link><Link to={to({ page: pages })}>Last »</Link></>
        : <><span className="off">Next ›</span><span className="off">Last »</span></>}
      <span className="per">
        rows:
        {PER_PAGE.map(n => n === view.per
          ? <b key={n}>{n}</b>
          : <Link key={n} to={to({ per: n, page: 1 })}>{n}</Link>)}
      </span>
    </div>
  );
}

export default function TablePage({ loaderData }: Route.ComponentProps) {
  const { table, columns, rows, total, view } = loaderData;
  const to = (over: Partial<View>) => viewHref(table, { ...view, page: 1, ...over });
  const withFilter = (col: string, val: string) => to({ filters: [...view.filters.filter(([k]) => k !== col), [col, val]] });
  const withoutFilter = (col: string) => to({ filters: view.filters.filter(([k]) => k !== col) });

  const apiQuery = new URLSearchParams([
    ...view.filters,
    ['limit', String(view.per)], ['offset', String((view.page - 1) * view.per)],
    ...(view.sort ? [['sort', view.sort], ['dir', view.dir]] : []),
  ]);

  return (
    <>
      <div className="toolbar">
        <h1>{table}</h1>
        {/* Plain GET form; hidden inputs carry the current view through the submit. */}
        <Form className="filter" method="get" action={`/mcdb/${table}`}>
          {view.filters.map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          {view.sort && <><input type="hidden" name="_sort" value={view.sort} /><input type="hidden" name="_dir" value={view.dir} /></>}
          {view.per !== DEFAULT_PER && <input type="hidden" name="_per" value={view.per} />}
          <select name="_fcol" aria-label="Column">
            {columns.map(c => <option key={c.name}>{c.name}</option>)}
          </select>
          <input name="_fval" placeholder="equals…" aria-label="Value" />
          <button type="submit">Filter</button>
        </Form>
        <a className="json" href={`/api/v1/mc/tables/${table}?${apiQuery}`}>JSON</a>
      </div>

      {view.filters.length > 0 && (
        <div className="chips">
          {view.filters.map(([k, v]) => (
            <Link key={k} className="chip" to={withoutFilter(k)} title="Remove filter">
              {k} = {v === '' ? '(empty)' : v} ✕
            </Link>
          ))}
          <Link className="clear" to={to({ filters: [] })}>clear all</Link>
        </div>
      )}

      <Pager table={table} view={view} total={total} />

      <div className="wrap">
        <table className="grid">
          <thead>
            <tr>
              {columns.map(c => {
                const active = view.sort === c.name;
                const nextDir = active && view.dir === 'desc' ? 'asc' : 'desc';
                return (
                  <th key={c.name} className={/INT|REAL|NUM|FLOA|DOUB/i.test(c.type) && !/_at$/.test(c.name) ? 'num' : undefined} title={`${c.type || 'untyped'}${c.pk ? ', primary key' : ''}`}>
                    <Link to={to({ sort: c.name, dir: nextDir })}>
                      {c.name}{active ? (view.dir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </Link>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length
              ? rows.map((r, i) => (
                  <tr key={i}>
                    {columns.map(c => <Cell key={c.name} table={table} col={c.name} raw={r[c.name]} link={withFilter} />)}
                  </tr>
                ))
              : <tr><td colSpan={columns.length} className="muted">No rows match.</td></tr>}
          </tbody>
        </table>
      </div>

      {total > view.per && <Pager table={table} view={view} total={total} />}
    </>
  );
}

// Errors render inside the layout, so the table list stays visible.
export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    const body = error.data as string | Partial<typeof UNAVAILABLE>;
    if (typeof body === 'string') return <div className="error"><h1>Not found</h1><p>{body}</p></div>;
    if (body?.dependency) {
      return (
        <div className="error">
          <h1>{body.error}</h1>
          <p>
            Dependency <code>{body.dependency}</code>: no SQLite file at <code>{body.path}</code>.
            Check the <code>{body.setting}</code> setting and the <code>/mcdata</code> mount.
          </p>
        </div>
      );
    }
  }
  return <div className="error"><h1>Query failed</h1></div>;
}
