// GET /api/v1/mc/tables/:table?limit=&offset=&sort=&dir=asc|desc&<column>=<value>...
// Any query param matching a column name becomes an equality filter.
import { json, mcdbFailure } from '~/lib/api.server';
import { queryRows, serializeRow, withDb } from '~/lib/mcdb.server';
import type { Route } from './+types/table';

const MAX_LIMIT = 500;

export function loader({ request, params }: Route.LoaderArgs) {
  const q = new URL(request.url).searchParams;
  try {
    const result = withDb(conn => queryRows(conn, params.table, {
      filters: [...q.entries()],
      sort: q.get('sort'),
      dir: q.get('dir'),
      limit: Math.min(Math.max(parseInt(q.get('limit') ?? '') || 100, 1), MAX_LIMIT),
      offset: Math.max(parseInt(q.get('offset') ?? '') || 0, 0),
    }));
    if (!result) return json({ error: 'Unknown table' }, 404);
    const { table, columns, total, limit, offset, rows } = result;
    return json({ table, columns, total, limit, offset, rows: rows.map(serializeRow) });
  } catch (err) {
    return mcdbFailure(err);
  }
}
